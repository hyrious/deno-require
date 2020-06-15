# deno-require

make deno *require* again (you don't need this, seriously)

instead, you should check out [pika.dev](https://pika.dev) and [jspm.io](https://jspm.io)
to look for dependencies you need. also look at [this post](https://denotutorials.net/migrating-your-npm-packages-to-deno.html)
for migration details

#### still here? alright, I'll give you what you want

```ts
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

let require = (function () {
  var cache = Object.create(null);
  var tmpdir = path.dirname(Deno.makeTempFileSync());
  fs.ensureDirSync(path.join(tmpdir, "deno-require"));

  const toText = (r: Response) => r.text();

  async function resolve(name: string) {
    let code: any, type: string;
    if (name.endsWith(".js")) {
      code = await fs.readFileStr(name);
      type = "js";
    } else if (name.endsWith(".json")) {
      code = await fs.readJson(name);
      type = "json";
    } else {
      const tmpfile = path.join(tmpdir, "deno-require", name);
      if (fs.existsSync(tmpfile)) {
        code = await fs.readFileStr(tmpfile, { encoding: "utf-8" });
      } else {
        code = await fetch(`https://cdn.jsdelivr.net/npm/${name}`).then(toText);
        await fs.writeFileStr(tmpfile, code);
      }
      try {
        code = JSON.parse(code);
        type = "json";
      } catch {
        type = "js";
      }
    }
    return { code, type };
  }

  return async function (name: string) {
    if (!(name in cache)) {
      let { code, type } = await resolve(name);
      if (type === "js") {
        let module = { exports: {} };
        cache[name] = module;
        let wrapper = Function("require, exports, module", code);
        wrapper(require, module.exports, module);
      } else if (type === "json") {
        cache[name] = { exports: code };
      }
    }
    return cache[name].exports;
  };
})();

// Usage:
// const marked = await require("marked");
// console.log(marked("# hello world!"));
```

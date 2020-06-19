import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { require } from "./require.ts";

// not all modules can be `require`-ed
// only those pure js libraries with singleton dist file are ok
// `pure` means not relying on Node.js standard libraries and ffi
// for example, to use markdown-it:
//    const MarkdownIt = await require("markdown-it/dist/markdown-it.js")
Deno.test("require", async () => {
  const marked = await require("marked");
  assertEquals(
    marked("# hello world!"),
    `<h1 id="hello-world">hello world!</h1>\n`,
  );
});

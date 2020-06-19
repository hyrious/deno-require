// use node modules without node

import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { readFileStr } from "./file-cache.ts";

const cache: Record<string, { exports: any }> = Object.create(null);
const tmpdir = path.join(Deno.dir("tmp") ?? ".", "deno-require");
await fs.ensureDir(tmpdir);

type StringMap = Record<string, string>;
const requireMap: StringMap = Object.create(null);

const stack: string[] = [];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function setRequireMap(map: StringMap) {
  for (const [key, value] of Object.entries(map)) {
    if (value) {
      requireMap[key] = value;
    } else {
      delete requireMap[key];
    }
  }
}

function tryUrl(name: string) {
  try {
    return new URL(name);
  } catch {
    return null;
  }
}

async function fetchContent(name: string, url: string) {
  const tmpname = name.split("/").join("-");
  return await readFileStr(path.join(tmpdir, tmpname), async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`can not download module from ${url}`);
    }
    return await response.text();
  });
}

function tryJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getRealName() {
  let result = "";
  for (const name of stack) {
    if (name.includes("/")) {
      const lastIndexOfSlash = result.lastIndexOf("/");
      if (lastIndexOfSlash !== -1) {
        if (path.extname(result.substring(lastIndexOfSlash))) {
          result = result.substring(0, lastIndexOfSlash);
        }
      }
      result = path.posix.join(result, name);
    } else {
      result = name;
    }
  }
  return result;
}

async function resolve(name: string) {
  const maybeUrl = tryUrl(name);
  const url = maybeUrl?.href ?? `https://cdn.jsdelivr.net/npm/${name}`;
  let text = await fetchContent(name, url);
  text = text.replace("require(", "await require(");
  const maybeJson = tryJson(text);
  if (maybeJson != null) return maybeJson;
  const module = { exports: {} };
  const wrapper = new AsyncFunction("require, exports, module", text);
  await wrapper(require, module.exports, module);
  return module;
}

export async function require(name: string) {
  if (name in requireMap) {
    name = requireMap[name];
  }
  if (!(name in cache)) {
    stack.push(name);
    cache[name] = await resolve(getRealName());
    stack.pop();
  }
  return cache[name].exports;
}

// persistent cache in system temp

import * as fs from "https://deno.land/std/fs/mod.ts";

/**
 * read file from cache, or fetch it
 * @param filePath the temp file path
 * @param fetchContent the function to fetch content
 */
export async function readFileStr(
  filePath: string,
  fetchContent: () => Promise<string>,
): Promise<string> {
  if (await fs.exists(filePath)) {
    return await fs.readFileStr(filePath, { encoding: "utf-8" });
  }
  const content = await fetchContent();
  fs.writeFileStr(filePath, content);
  return content;
}

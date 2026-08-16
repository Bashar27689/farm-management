import path from "node:path";

export default {
  cacheDirectory: path.join(
    process.cwd(),
    ".puppeteer-cache"
  ),
};
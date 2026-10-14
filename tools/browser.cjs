const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
module.exports = async () => {
  let executablePath = process.env.CHROMIUM_PATH;
  // Reuse a local Playwright browser when its revision differs from our dev package.
  if (!executablePath && !fs.existsSync(chromium.executablePath()) && process.env.LOCALAPPDATA) {
    const cache = path.join(process.env.LOCALAPPDATA,'ms-playwright');
    if (fs.existsSync(cache)) {
      for (const name of fs.readdirSync(cache).filter(n=>/^chromium-\d+$/.test(n)).reverse()) {
        const candidate = path.join(cache,name,'chrome-win64','chrome.exe');
        if (fs.existsSync(candidate)) { executablePath = candidate; break; }
      }
    }
  }
  return chromium.launch({executablePath});
};

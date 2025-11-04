const puppeteer = require('puppeteer');

/**
 * Launches a headless Puppeteer browser with recommended flags.
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
  });
}

module.exports = { launchBrowser };

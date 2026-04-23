const puppeteer = require('puppeteer');

const TIMEOUT_MS  = 15000;
const MAX_CHARS   = 8000;
const USER_AGENT  = 'IRONSCOUT/2.0 (sales intelligence tool; public data only)';

async function scrapeUrl(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', req => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });

    // Extract meaningful text from the page
    const content = await page.evaluate(() => {
      const remove = ['nav', 'footer', 'script', 'style', 'noscript', 'iframe',
                      'header', '.cookie', '.popup', '.modal', '.ad', '.banner'];
      remove.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const prioritySelectors = [
        'h1', 'h2', 'h3',
        'main p', 'article p', '.about p', '.hero p', '.content p',
        '[class*="about"] p', '[class*="hero"] p', '[class*="mission"] p',
        '[class*="product"] p', '[class*="service"] p',
        'p', 'li'
      ];

      const seen = new Set();
      const lines = [];

      prioritySelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const text = el.innerText?.trim();
          if (text && text.length > 20 && !seen.has(text)) {
            seen.add(text);
            lines.push(text);
          }
        });
      });

      return lines.join('\n\n');
    });

    // Also try to scrape the About page if it exists
    let aboutContent = '';
    try {
      const aboutLinks = await page.$$eval('a', links =>
        links
          .map(a => a.href)
          .filter(href => href && /about|company|who-we-are/i.test(href))
          .slice(0, 1)
      );

      if (aboutLinks.length > 0 && aboutLinks[0] !== url) {
        await page.goto(aboutLinks[0], { waitUntil: 'domcontentloaded', timeout: 10000 });
        aboutContent = await page.evaluate(() => {
          document.querySelectorAll('nav, footer, script, style').forEach(el => el.remove());
          return Array.from(document.querySelectorAll('p, h1, h2, h3'))
            .map(el => el.innerText?.trim())
            .filter(t => t && t.length > 20)
            .join('\n\n');
        });
      }
    } catch (e) {
      // About page scraping is best-effort
    }

    const combined = [content, aboutContent].filter(Boolean).join('\n\n---\n\n');
    return combined.slice(0, MAX_CHARS);

  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeUrl };

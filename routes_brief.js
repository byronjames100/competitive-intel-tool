const express = require('express');
const router = express.Router();
const { scrapeUrl }     = require('../services/scraper');
const { generateBrief } = require('../services/claude');

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  // Basic URL validation
  let validUrl;
  try {
    validUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  try {
    // 1. Attempt real scraping of public page content
    let content = '';
    let scraped = false;
    try {
      content = await scrapeUrl(validUrl.href);
      scraped = content.length > 100;
    } catch (e) {
      console.warn(`Scraping failed for ${validUrl.href}:`, e.message);
    }

    // 2. Pass scraped content (or just URL) to Claude
    const brief = await generateBrief(content, validUrl.href, scraped);
    res.json(brief);

  } catch (err) {
    console.error('Brief generation error:', err.message);
    res.status(500).json({ error: 'Brief generation failed: ' + err.message });
  }
});

module.exports = router;

const express      = require('express');
const router       = express.Router();
const { scrapeUrl }     = require('../services/scraper');
const { generateBrief } = require('../services/claude');
const requireAuth  = require('../middleware/requireAuth');
const db           = require('../db');

const HISTORY_LIMIT = 50;

function saveBrief(userId, brief, url) {
  db.prepare('INSERT INTO briefs (user_id, company, url, brief_json) VALUES (?, ?, ?, ?)')
    .run(userId, brief.company_name || 'Unknown', url || null, JSON.stringify(brief));

  // Prune to keep only the most recent HISTORY_LIMIT briefs for this user
  const oldest = db.prepare(
    `SELECT id FROM briefs WHERE user_id = ?
     ORDER BY created_at DESC LIMIT -1 OFFSET ?`
  ).all(userId, HISTORY_LIMIT);
  if (oldest.length) {
    const ids = oldest.map(r => r.id).join(',');
    db.prepare(`DELETE FROM briefs WHERE id IN (${ids})`).run();
  }
}

router.post('/', requireAuth, async (req, res) => {
  const { url, content: pastedContent } = req.body;

  // Text paste mode — no scraping needed
  if (pastedContent && !url) {
    try {
      const brief = await generateBrief(pastedContent, 'pasted-content', true);
      saveBrief(req.user.userId, brief, null);
      return res.json(brief);
    } catch (err) {
      console.error('Brief generation error:', err.message);
      return res.status(500).json({ error: 'Brief generation failed: ' + err.message });
    }
  }

  if (!url) {
    return res.status(400).json({ error: 'URL or content is required.' });
  }

  let validUrl;
  try {
    validUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  try {
    let content = '';
    let scraped = false;
    try {
      content = await scrapeUrl(validUrl.href);
      scraped = content.length > 100;
    } catch (e) {
      console.warn(`Scraping failed for ${validUrl.href}:`, e.message);
    }

    const brief = await generateBrief(content, validUrl.href, scraped);
    saveBrief(req.user.userId, brief, validUrl.href);
    res.json(brief);

  } catch (err) {
    console.error('Brief generation error:', err.message);
    res.status(500).json({ error: 'Brief generation failed: ' + err.message });
  }
});

module.exports = router;

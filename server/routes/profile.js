const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { scrapeUrl } = require('../services/scraper');
const { autoFillProfile } = require('../services/claude');

router.get('/', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, email, name, company_name, company_url, company_size,
           industry, service_area, service_radius_miles,
           profile_products, target_customer, profile_complete
    FROM users WHERE id = ?
  `).get(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.profile_products = JSON.parse(user.profile_products || '[]');
  res.json(user);
});

router.post('/', requireAuth, (req, res) => {
  const {
    company_name, company_url, company_size, industry,
    service_area, service_radius_miles, profile_products, target_customer
  } = req.body;

  const products = JSON.stringify(
    Array.isArray(profile_products) ? profile_products.map(p => p.trim()).filter(Boolean) : []
  );

  db.prepare(`
    UPDATE users SET
      company_name         = ?,
      company_url          = ?,
      company_size         = ?,
      industry             = ?,
      service_area         = ?,
      service_radius_miles = ?,
      profile_products     = ?,
      target_customer      = ?,
      profile_complete     = 1
    WHERE id = ?
  `).run(
    (company_name || '').trim(),
    (company_url  || '').trim(),
    (company_size || '').trim(),
    (industry     || '').trim(),
    (service_area || '').trim(),
    parseInt(service_radius_miles) || 50,
    products,
    (target_customer || '').trim(),
    req.user.userId
  );

  res.json({ ok: true, profile_complete: 1 });
});

router.post('/autofill', requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required.' });

  let content = '';
  try {
    content = await scrapeUrl(url);
  } catch {
    // scrape failed — Claude falls back to URL-based knowledge
  }

  try {
    const result = await autoFillProfile(content, url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Auto-fill failed: ' + err.message });
  }
});

module.exports = router;

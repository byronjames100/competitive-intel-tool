const express     = require('express');
const router      = express.Router();
const requireAuth = require('../middleware/requireAuth');
const db          = require('../db');

// GET /api/briefs — last 50 for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, company, url, brief_json, created_at
       FROM briefs WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`
    ).all(req.user.userId);

    res.json(rows.map(r => ({
      id: r.id,
      company: r.company,
      url: r.url,
      created_at: r.created_at,
      brief: JSON.parse(r.brief_json)
    })));
  } catch (err) {
    console.error('[briefs] GET error:', err.message);
    res.status(500).json({ error: 'Failed to load history.' });
  }
});

// DELETE /api/briefs/:id — delete one brief (must belong to current user)
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM briefs WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.userId);

  if (result.changes === 0) return res.status(404).json({ error: 'Brief not found.' });
  res.json({ ok: true });
});

module.exports = router;

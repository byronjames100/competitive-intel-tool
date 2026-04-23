const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.post('/', async (req, res) => {
  const brief = req.body;
  if (!brief || !brief.company_name) {
    return res.status(400).json({ error: 'Brief data required.' });
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const filename = `IRONSCOUT_${brief.company_name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;

  const cfColor = brief.confidence_level === 'HIGH' ? '#1a6e3a'
                : brief.confidence_level === 'MEDIUM' ? '#a06010' : '#c0392b';
  const cfBg    = brief.confidence_level === 'HIGH' ? '#eaf3de'
                : brief.confidence_level === 'MEDIUM' ? '#faeeda' : '#fcebeb';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:10pt; color:#1e2430; }
  .header { background:#1a3a5c; color:#fff; padding:14px 32px; display:flex; justify-content:space-between; align-items:center; }
  .hbrand { font-size:20pt; font-weight:700; letter-spacing:0.1em; }
  .hsub { font-size:7pt; letter-spacing:0.2em; color:#a0b8d0; }
  .hright { text-align:right; font-size:8pt; color:#a0b8d0; }
  .co-block { padding:16px 32px 10px; border-bottom:2px solid #1a3a5c; }
  .co-name { font-size:20pt; font-weight:700; }
  .co-meta { display:flex; gap:10px; margin-top:5px; flex-wrap:wrap; }
  .tag { font-size:8pt; font-weight:700; padding:2px 8px; text-transform:uppercase; }
  .ti { background:rgba(26,58,92,0.1); color:#1a3a5c; }
  .ts { background:rgba(176,74,26,0.1); color:#b04a1a; }
  .cf { margin:10px 32px 0; padding:7px 12px; font-size:8pt; font-weight:700; background:${cfBg}; color:${cfColor}; }
  .body { padding:0 32px 24px; }
  .sec { margin-top:16px; page-break-inside:avoid; }
  .sec-head { display:flex; align-items:center; gap:8px; border-bottom:1px solid #c8d0dc; padding-bottom:4px; margin-bottom:8px; }
  .sec-num { font-size:7pt; font-weight:700; color:#6b7585; background:#edf0f4; padding:2px 5px; }
  .sec-title { font-size:10pt; font-weight:700; color:#1a3a5c; text-transform:uppercase; letter-spacing:0.1em; }
  p { line-height:1.55; font-size:9.5pt; color:#2c3440; }
  ul { padding-left:18px; } li { font-size:9.5pt; line-height:1.5; margin-bottom:2px; }
  .impl { background:#f4f6f9; border-left:3px solid #b04a1a; padding:8px 10px; margin-bottom:7px; }
  .impl-num { font-size:7.5pt; font-weight:700; color:#b04a1a; display:block; margin-bottom:3px; }
  .disc { margin:20px 32px; padding:10px; border-top:1px solid #c8d0dc; font-size:7.5pt; font-style:italic; color:#6b7585; }
</style></head><body>
<div class="header">
  <div><div class="hbrand">IRONSCOUT</div><div class="hsub">TACTICAL INTELLIGENCE</div></div>
  <div class="hright">${date}<br>Intelligence Brief</div>
</div>
<div class="co-block">
  <div class="co-name">${brief.company_name}</div>
  <div class="co-meta">
    ${brief.industry ? `<span class="tag ti">${brief.industry}</span>` : ''}
    ${brief.employee_estimate ? `<span class="tag ts">${brief.employee_estimate}</span>` : ''}
  </div>
</div>
${brief.confidence_reason ? `<div class="cf">&#9679; ${brief.confidence_level} CONFIDENCE — ${brief.confidence_reason}</div>` : ''}
<div class="body">
  <div class="sec">
    <div class="sec-head"><span class="sec-num">01</span><span class="sec-title">Product Overview</span></div>
    <p>${brief.product_overview || '—'}</p>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">02</span><span class="sec-title">Top Products / Services</span></div>
    <ul>${(brief.top_products || []).map(p => `<li>${p}</li>`).join('')}</ul>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">03</span><span class="sec-title">Mission & Values</span></div>
    <p>${brief.mission_values || '—'}</p>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">04</span><span class="sec-title">Philanthropy & Community</span></div>
    <ul>${(brief.philanthropy || []).map(p => `<li>${p}</li>`).join('')}</ul>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">05</span><span class="sec-title">Senior Leadership</span></div>
    <ul>${(brief.leadership || []).map(l => `<li>${l}</li>`).join('')}</ul>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">06</span><span class="sec-title">Operational Signals</span></div>
    <ul>${(brief.operational_signals || []).map(s => `<li>${s}</li>`).join('')}</ul>
  </div>
  <div class="sec">
    <div class="sec-head"><span class="sec-num">07</span><span class="sec-title">Strategic Implications</span></div>
    ${(brief.strategic_implications || []).map(i =>
      `<div class="impl"><span class="impl-num">${i.num}</span><p>${i.implication}</p></div>`
    ).join('')}
  </div>
</div>
<div class="disc">Insights are AI-generated from public data and may contain errors. Verify all information before use. Not business, financial, or legal advice.</div>
</body></html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfData = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.6in', left: '0.5in' }
    });

    const pdf = Buffer.from(pdfData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.send(pdf);

  } catch (err) {
    console.error('PDF export error:', err.message);
    res.status(500).json({ error: 'PDF generation failed.' });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;

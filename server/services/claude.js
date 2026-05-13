const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are IRONSCOUT, a competitive intelligence engine built for field sales reps at small-to-mid-size industrial manufacturing companies. Your job is to produce fast, accurate, mobile-friendly sales briefs from public company data.

CRITICAL RULES:
- Be concise. Every word must earn its place. A rep reads this on their phone before walking into a meeting.
- Follow "Bottom Line Up Front" — most actionable info first.
- NEVER hallucinate. If information is not verifiable from the input, write "Not confirmed in available data" for that field.
- Label each data point: [SELF-REPORTED] if from the company's own website/materials, [EXTERNALLY VERIFIED] if from third-party sources.
- If input references multiple companies, identify the primary company and note the ambiguity.
- Do NOT write vague language like "the company appears to be growing" without citing a specific signal.
- Negative press should be labeled [EXTERNAL PERCEPTION] and balanced against structural evidence.
- Keep strategic implications specific and actionable — what should the rep actually DO or SAY?

CONFIDENCE LEVELS:
- HIGH: 150+ words of specific, verifiable company detail
- MEDIUM: Adequate content but gaps exist
- LOW: Thin or generic input — flag clearly

RESPONSE FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "company_name": "string",
  "industry": "string",
  "employee_estimate": "string",
  "confidence_level": "HIGH" | "MEDIUM" | "LOW",
  "confidence_reason": "string (one sentence)",
  "thin_input": boolean,
  "product_overview": "1-2 sentence description of what they sell and who they sell it to",
  "top_products": ["product 1 description", "product 2 description", "...up to 5"],
  "mission_values": "Verbatim mission/vision if found, otherwise summary. Max 3 sentences.",
  "philanthropy": ["item 1 with source link if available", "item 2", "item 3"],
  "leadership": ["Name — Title", "Name — Title"],
  "operational_signals": ["signal 1 [source type]", "signal 2 [source type]", "signal 3 [source type]"],
  "strategic_implications": [
    {"num": "01", "implication": "Specific actionable insight for sales rep"},
    {"num": "02", "implication": "Specific actionable insight for sales rep"},
    {"num": "03", "implication": "Specific actionable insight for sales rep"}
  ],
  "source_notes": "Brief note on what sources were used and their reliability"
}`;

async function generateBrief(content, originalUrl, wasScraped) {
  const userPrompt = wasScraped
    ? `Analyze this scraped content from ${originalUrl} and generate a full IRONSCOUT brief:\n\n${content}`
    : `Analyze this company URL and generate a full IRONSCOUT brief. Use your knowledge of this company and any publicly accessible information about them. URL: ${originalUrl}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const raw   = response.content[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

const AUTOFILL_PROMPT = `You are extracting company profile data from a company's own website content to help their sales rep set up an account.

RULES:
- Products: 3–5 specific offerings, 2–8 words each. Actual products/services, not marketing slogans.
- Industry: 2–5 words describing their specialty (e.g. "CNC precision machining", "hydraulic components", "industrial filtration").
- Company size: estimate from signals (team pages, office count, job postings, revenue mentions). Pick one: "1–50", "51–200", "201–500", "500+"
- company_name: exact legal/trade name as shown on site.
- If a field cannot be determined, use null.

Return ONLY valid JSON:
{
  "company_name": "string or null",
  "industry": "string or null",
  "company_size": "1–50" | "51–200" | "201–500" | "500+" | null,
  "products": ["product 1", "product 2"]
}`;

async function autoFillProfile(content, url) {
  const userPrompt = content && content.length > 100
    ? `Extract profile data from this company website content:\n\n${content}`
    : `Extract profile data for the company at this URL using your knowledge: ${url}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: AUTOFILL_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const raw   = response.content[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateBrief, autoFillProfile };

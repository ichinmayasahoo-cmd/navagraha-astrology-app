const fetch = require('node-fetch');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5'; // see https://docs.claude.com for current model IDs

/**
 * Ask Claude to write the interpretive reading, strictly grounded in the
 * REAL computed chart + numerology data we pass it. We explicitly instruct
 * it not to invent or alter any placements — only to interpret what's given.
 */
async function generateReading({ name, chart, numerology }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment (.env file).');
  }

  const planetLines = chart.planets
    .map(
      (p) =>
        `- ${p.label}: ${p.sign} (House ${p.house})${p.retrograde ? ' [Retrograde]' : ''} at ${p.degree}`
    )
    .join('\n');

  const systemPrompt = `You are an experienced, warm, and grounded Vedic astrologer and numerologist writing a personal reading.
You MUST treat the chart data given to you (ascendant, moon sign, planetary sign/house placements, numerology numbers) as ground truth — never invent, change, or contradict any placement or number.
Do not claim certainty about the future; frame guidance as tendencies, strengths, and areas for growth.
Write in a warm, clear, non-generic voice. Avoid excessive hedging disclaimers beyond one brief note at the end.
Use simple section headers exactly as instructed in the user message.`;

  const userPrompt = `Person's name: ${name}

COMPUTED NATAL CHART (Vedic / sidereal, whole-sign houses) — treat as ground truth:
Ascendant (Lagna): ${chart.ascendant.sign} at ${chart.ascendant.degree}
Moon Sign (Rashi): ${chart.moonSign}

Planetary placements:
${planetLines}

COMPUTED NUMEROLOGY — treat as ground truth:
Mulank (Root number): ${numerology.mulank} — ${numerology.mulankTrait}
Bhagyank (Destiny number): ${numerology.bhagyank} — ${numerology.bhagyankTrait}

Please write a personal reading with exactly these section headers (as markdown h3, "### "):
### Overview & Personality
### Love & Relationships
### Career & Success
### Strengths & Challenges
### Practical Guidance

Keep each section to a tight, focused paragraph (roughly 80-140 words). Ground every claim in the specific placements/numbers above — reference the actual planet/sign/house or number where relevant instead of writing generically. End the whole reading with one short italic line noting this is for reflection and entertainment, not a substitute for professional advice.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return text;
}

module.exports = { generateReading };

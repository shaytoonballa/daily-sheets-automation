const fs = require('fs');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const TODAY = new Date().toISOString().split('T')[0];

// Generate content for Darius (adult sheet)
async function generateDariusContent() {
  const prompt = `Generate daily content for an adult physician's personal sheet. Today is ${TODAY}. Return ONLY valid JSON.

{
  "factoid": { "text": "a surprising intellectual fact from science/medicine/philosophy/history", "category": "e.g. Neuroscience" },
  "quote": { "text": "a reflection-quality quote for an adult, preferably from philosophers, leaders, or scientists", "attr": "— Author" },
  "meditFocus": "a 1-2 sentence advanced meditation focus (breath awareness, body scan, visualization, etc.)",
  "writePrompt": "a specific writing prompt for a nonfiction book author to spark today's session (1-2 sentences)",
  "lang_es": {
    "theme": "a topic (e.g. Expressing Opinion, Weather, Negotiation)",
    "phrases": [
      {"en":"English", "tl":"Spanish", "pr":"pronunciation"},
      {"en":"English", "tl":"Spanish", "pr":"pronunciation"}
    ]
  },
  "lang_it": {
    "theme": "topic",
    "phrases": [
      {"en":"English", "tl":"Italian", "pr":"pronunciation"},
      {"en":"English", "tl":"Italian", "pr":"pronunciation"}
    ]
  },
  "lang_ko": {
    "theme": "topic",
    "phrases": [
      {"en":"English", "tl":"한국어 (romanization)", "pr":"easy pronunciation"},
      {"en":"English", "tl":"한국어 (romanization)", "pr":"easy pronunciation"}
    ]
  },
  "lang_zh": {
    "theme": "topic",
    "phrases": [
      {"en":"English", "tl":"汉字 (pinyin)", "pr":"easy pronunciation"},
      {"en":"English", "tl":"汉字 (pinyin)", "pr":"easy pronunciation"}
    ]
  }
}

Give exactly 2 phrases per language, intermediate-adult level. Vary themes daily.`;

  return await callAnthropicAPI(prompt);
}

// Generate content for Caspian (kid sheet)
async function generateCaspianContent() {
  const prompt = `Generate fresh daily content for a 10-year-old's activity sheet. Today is ${TODAY}. Return ONLY valid JSON.

{
  "wotd": {
    "word": "an interesting vocabulary word (not too common, not too obscure — a stretch word)",
    "pronunciation": "simple phonetic like KUR-ee-us",
    "partOfSpeech": "noun | verb | adjective | adverb",
    "definition": "a clear kid-friendly 1-sentence definition",
    "examples": [
      "First example sentence using the word naturally",
      "Second example sentence showing a different context",
      "Third example in a fun or surprising way"
    ],
    "challenge": "a fun challenge like 'Use this word in a real conversation today'"
  },
  "factoid": { "text": "a surprising true fact (science, nature, math, geography, history)", "category": "e.g. Biology" },
  "quote": { "text": "an inspiring confidence quote suitable for a child", "attr": "— Author Name" },
  "finTopic": {
    "question": "engaging finance question (compound interest, Roth IRA, budgeting, etc.)",
    "intro": "short plain-English 2-sentence explanation",
    "resources": [
      {"tag":"yt","name":"specific YouTube resource","url":"youtube.com or channel"},
      {"tag":"web","name":"specific site","url":"domain.com"},
      {"tag":"game","name":"specific game","url":"domain.com"},
      {"tag":"yt","name":"another resource","url":"source"}
    ],
    "challenge": "concrete kid-fun challenge to apply the concept"
  },
  "spanish": {
    "theme": "topic (Greetings, Food, Animals, Weather, etc.)",
    "note": "fun cultural/language tip",
    "phrases": [
      {"en":"English","tl":"Spanish","pr":"pronunciation"}, ...6 phrases...
    ]
  },
  "chinese": {
    "theme": "topic",
    "note": "cultural/tone tip",
    "phrases": [
      {"en":"English","tl":"Chinese 汉字 pinyin","pr":"easy pronunciation"}, ...6 phrases...
    ]
  },
  "stretches": "simple 2-sentence stretch routine",
  "meditFocus": "1-sentence meditation focus",
  "artIdea": "creative art/craft project idea (1 sentence)"
}

Age-appropriate, genuinely fun, educational. The Word of the Day should feel exciting.`;

  return await callAnthropicAPI(prompt);
}

async function callAnthropicAPI(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  let text = '';
  for (const block of data.content || []) {
    if (block.type === 'text') text += block.text;
  }
  
  text = text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

function updateHTMLFile(filename, content) {
  const html = fs.readFileSync(filename, 'utf8');
  
  // Find the defaultState object in the script
  const stateRegex = /(const defaultState = \{[\s\S]*?dailyContent: \{\},)/;
  const updatedState = html.replace(stateRegex, (match) => {
    return match.replace('dailyContent: {},', `dailyContent: { "${TODAY}": ${JSON.stringify(content)} },`);
  });
  
  fs.writeFileSync(filename, updatedState);
  console.log(`✓ Updated ${filename} with fresh content for ${TODAY}`);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    console.log('🤖 Generating fresh daily content...');
    
    // Generate content for both sheets
    const [dariusContent, caspianContent] = await Promise.all([
      generateDariusContent(),
      generateCaspianContent()
    ]);
    
    // Update HTML files
    updateHTMLFile('darius_daily_sheet.html', dariusContent);
    updateHTMLFile('caspian_daily_sheet.html', caspianContent);
    
    console.log('🎉 Daily content updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating content:', error);

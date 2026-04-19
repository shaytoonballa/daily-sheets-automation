const fs = require('fs');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const TODAY = new Date().toISOString().split('T')[0];

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
    
    const dariusPrompt = `Generate daily content for an adult physician's personal sheet. Today is ${TODAY}. Return ONLY valid JSON: {"factoid":{"text":"a surprising intellectual fact from science/medicine/philosophy/history","category":"e.g. Neuroscience"},"quote":{"text":"a reflection-quality quote for an adult","attr":"— Author"},"meditFocus":"a 1-2 sentence advanced meditation focus","writePrompt":"a specific writing prompt for a nonfiction book author","lang_es":{"theme":"topic","phrases":[{"en":"English","tl":"Spanish","pr":"pronunciation"},{"en":"English","tl":"Spanish","pr":"pronunciation"}]},"lang_it":{"theme":"topic","phrases":[{"en":"English","tl":"Italian","pr":"pronunciation"},{"en":"English","tl":"Italian","pr":"pronunciation"}]},"lang_ko":{"theme":"topic","phrases":[{"en":"English","tl":"한국어","pr":"pronunciation"},{"en":"English","tl":"한국어","pr":"pronunciation"}]},"lang_zh":{"theme":"topic","phrases":[{"en":"English","tl":"中文","pr":"pronunciation"},{"en":"English","tl":"中文","pr":"pronunciation"}]}}`;

    const caspianPrompt = `Generate fresh daily content for a 10-year-old's activity sheet. Today is ${TODAY}. Return ONLY valid JSON: {"wotd":{"word":"an interesting vocabulary word","pronunciation":"simple phonetic","partOfSpeech":"noun|verb|adjective|adverb","definition":"a clear kid-friendly definition","examples":["First example sentence","Second example sentence","Third example sentence"],"challenge":"a fun challenge"},"factoid":{"text":"a surprising true fact","category":"e.g. Biology"},"quote":{"text":"an inspiring confidence quote suitable for a child","attr":"— Author Name"},"finTopic":{"question":"engaging finance question","intro":"short explanation","resources":[{"tag":"yt","name":"YouTube resource","url":"youtube.com"},{"tag":"web","name":"website","url":"domain.com"}],"challenge":"concrete kid-fun challenge"},"spanish":{"theme":"topic","note":"cultural tip","phrases":[{"en":"English","tl":"Spanish","pr":"pronunciation"}]},"chinese":{"theme":"topic","note":"cultural tip","phrases":[{"en":"English","tl":"Chinese","pr":"pronunciation"}]},"stretches":"simple stretch routine","meditFocus":"meditation focus","artIdea":"art project idea"}`;
    
    const [dariusContent, caspianContent] = await Promise.all([
      callAnthropicAPI(dariusPrompt),
      callAnthropicAPI(caspianPrompt)
    ]);
    
    updateHTMLFile('darius_daily_sheet.html', dariusContent);
    updateHTMLFile('caspian_daily_sheet.html', caspianContent);
    
    console.log('🎉 Daily content updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating content:', error);
    process.exit(1);
  }
}

main();

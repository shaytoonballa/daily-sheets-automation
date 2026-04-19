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
  let html = fs.readFileSync(filename, 'utf8');
  
  // Replace the entire dailyContent object
  const contentStr = JSON.stringify({ [TODAY]: content }, null, 2);
  html = html.replace(
    /dailyContent:\s*\{[^}]*\}/,
    `dailyContent: ${contentStr}`
  );
  
  fs.writeFileSync(filename, html);
  console.log(`✓ Updated ${filename} with fresh content for ${TODAY}`);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    process.exit(1);
  }

  try {
    console.log('🤖 Generating content...');
    
    // Darius content
    const dariusPrompt = `Generate JSON for adult daily sheet: {"factoid":{"text":"science/history fact","category":"Science"},"quote":{"text":"philosophical quote","attr":"— Author"},"meditFocus":"meditation instruction","writePrompt":"book writing prompt","lang_es":{"theme":"Spanish topic","phrases":[{"en":"Hello","tl":"Hola","pr":"OH-lah"},{"en":"Thank you","tl":"Gracias","pr":"GRAH-see-ahs"}]},"lang_it":{"theme":"Italian topic","phrases":[{"en":"Hello","tl":"Ciao","pr":"chow"},{"en":"Thank you","tl":"Grazie","pr":"GRAH-tsee-eh"}]},"lang_ko":{"theme":"Korean topic","phrases":[{"en":"Hello","tl":"안녕하세요","pr":"an-nyeong-ha-se-yo"},{"en":"Thank you","tl":"감사합니다","pr":"gam-sa-ham-ni-da"}]},"lang_zh":{"theme":"Chinese topic","phrases":[{"en":"Hello","tl":"你好","pr":"nee-how"},{"en":"Thank you","tl":"谢谢","pr":"sheh-sheh"}]}}`;

    // Caspian content  
    const caspianPrompt = `Generate JSON for kid daily sheet: {"wotd":{"word":"curious","pronunciation":"KYUR-ee-us","partOfSpeech":"adjective","definition":"wanting to learn about something","examples":["I am curious about space","She asked curious questions","Be curious about the world"],"challenge":"Use this word today"},"factoid":{"text":"fun science fact for kids","category":"Science"},"quote":{"text":"inspiring quote for children","attr":"— Author"},"finTopic":{"question":"What is saving money?","intro":"Saving means keeping money for later","resources":[{"tag":"yt","name":"Kids money videos","url":"youtube.com"}],"challenge":"Save one coin today"},"spanish":{"theme":"Greetings","note":"Spanish tip","phrases":[{"en":"Hello","tl":"Hola","pr":"OH-lah"}]},"chinese":{"theme":"Greetings","note":"Chinese tip","phrases":[{"en":"Hello","tl":"你好","pr":"nee-how"}]},"stretches":"Do 5 arm circles","meditFocus":"Breathe slowly","artIdea":"Draw your favorite animal"}`;

    const [dariusContent, caspianContent] = await Promise.all([
      callAnthropicAPI(dariusPrompt),
      callAnthropicAPI(caspianPrompt)
    ]);
    
    updateHTMLFile('darius_daily_sheet.html', dariusContent);
    updateHTMLFile('caspian_daily_sheet.html', caspianContent);
    
    console.log('🎉 Success!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

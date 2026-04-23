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
  
  console.log(`📂 Processing ${filename}`);
  console.log(`📊 File size: ${html.length} characters`);
  
  // Look for the defaultState object
  const stateMatch = html.match(/const defaultState = \{[\s\S]*?\};/);
  if (stateMatch) {
    console.log(`✓ Found defaultState in ${filename}`);
    
    // Extract the current dailyContent value
    const dailyContentMatch = stateMatch[0].match(/dailyContent:\s*(\{[^}]*\})/);
    if (dailyContentMatch) {
      console.log(`✓ Current dailyContent: ${dailyContentMatch[1]}`);
      
      // Replace the entire defaultState with updated content
      const newState = stateMatch[0].replace(
        /dailyContent:\s*\{[^}]*\}/,
        `dailyContent: { "${TODAY}": ${JSON.stringify(content)} }`
      );
      
      html = html.replace(stateMatch[0], newState);
      console.log(`✓ Updated dailyContent for ${TODAY}`);
    } else {
      console.log(`❌ Could not find dailyContent in defaultState`);
    }
  } else {
    console.log(`❌ Could not find defaultState in ${filename}`);
  }
  
  fs.writeFileSync(filename, html);
  console.log(`✓ Saved ${filename}`);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    process.exit(1);
  }

  try {
    console.log('🤖 Generating content...');
    
    // Simple test content first
    const dariusContent = {
      factoid: { text: "Test factoid for debugging", category: "Test" },
      quote: { text: "This is a test quote", attr: "— Debug Author" },
      meditFocus: "Test meditation focus",
      writePrompt: "Test writing prompt"
    };

    const caspianContent = {
      wotd: { 
        word: "debug", 
        pronunciation: "dee-BUG",
        partOfSpeech: "verb",
        definition: "To find and fix problems",
        examples: ["We need to debug this code", "Let's debug the issue", "Debugging helps us learn"],
        challenge: "Use debug in a sentence today"
      },
      factoid: { text: "Test factoid for Caspian", category: "Test" }
    };
    
    updateHTMLFile('darius_daily_sheet.html', dariusContent);
    updateHTMLFile('caspian_daily_sheet.html', caspianContent);
    
    console.log('🎉 Update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

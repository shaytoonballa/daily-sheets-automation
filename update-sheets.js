const fs = require('fs');
const TODAY = new Date().toISOString().split('T')[0];

// Simple working content
const dariusContent = {
  factoid: { text: "Your brain uses 20% of your body's energy despite being only 2% of your weight.", category: "Neuroscience" },
  quote: { text: "The obstacle is the way.", attr: "— Marcus Aurelius" },
  meditFocus: "Focus on your breath for 5 counts in, 5 counts out.",
  writePrompt: "Write about one thing you learned yesterday that changed how you think about something.",
  lang_es: { theme: "Daily Actions", phrases: [{en:"I work",tl:"Trabajo",pr:"tra-BAH-ho"},{en:"I study",tl:"Estudio",pr:"es-TOO-dee-oh"}]},
  lang_it: { theme: "Daily Actions", phrases: [{en:"I work",tl:"Lavoro",pr:"la-VOH-roh"},{en:"I study",tl:"Studio",pr:"STOO-dee-oh"}]},
  lang_ko: { theme: "Daily Actions", phrases: [{en:"I work",tl:"일해요",pr:"il-hae-yo"},{en:"I study",tl:"공부해요",pr:"gong-bu-hae-yo"}]},
  lang_zh: { theme: "Daily Actions", phrases: [{en:"I work",tl:"我工作",pr:"wo gong-zuo"},{en:"I study",tl:"我学习",pr:"wo xue-xi"}]}
};

const caspianContent = {
  wotd: { word: "persistent", pronunciation: "per-SIS-tent", partOfSpeech: "adjective", definition: "Never giving up, even when things are hard.", examples: ["She was persistent in learning piano.", "Be persistent with your goals.", "Persistent effort leads to success."], challenge: "Use 'persistent' in a sentence today." },
  factoid: { text: "A group of flamingos is called a 'flamboyance'.", category: "Animals" },
  quote: { text: "You are capable of amazing things.", attr: "— Growth Mindset" },
  finTopic: { question: "What is compound interest?", intro: "Compound interest is when your money grows, and then that growth grows too! It's like a snowball rolling downhill.", resources: [], challenge: "Ask a parent to show you a compound interest calculator online." },
  spanish: { theme: "School", phrases: [{en:"Pencil",tl:"Lápiz",pr:"LAH-pees"}] },
  chinese: { theme: "School", phrases: [{en:"Book",tl:"书 shū",pr:"shoo"}] },
  stretches: "Do 10 jumping jacks and stretch your arms up high.",
  meditFocus: "Sit quietly and count your heartbeat for 30 seconds.",
  artIdea: "Draw your dream house with all your favorite things."
};

// Update files
['darius_daily_sheet.html', 'caspian_daily_sheet.html'].forEach((filename, i) => {
  const content = i === 0 ? dariusContent : caspianContent;
  let html = fs.readFileSync(filename, 'utf8');
  
  // Find and replace dailyContent
  html = html.replace(
    /dailyContent:\s*\{[^}]*\}/,
    `dailyContent: { "${TODAY}": ${JSON.stringify(content)} }`
  );
  
  fs.writeFileSync(filename, html);
  console.log(`✓ Updated ${filename}`);
});

console.log('✓ Done');

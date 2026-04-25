const fs = require('fs');
const path = require('path');
const https = require('https');

const TODAY = new Date().toISOString().split('T')[0];
const TODAY_FORMATTED = new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

// Anthropic API call function
async function callAnthropicAPI(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.error) {
            reject(new Error(`API Error: ${result.error.message}`));
            return;
          }
          
          let text = '';
          for (const block of result.content || []) {
            if (block.type === 'text') text += block.text;
          }
          
          // Clean and parse JSON
          text = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(text);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Generate content for Darius
async function generateDariusContent() {
  const prompt = `Generate daily content for an adult physician's personal development sheet. Today is ${TODAY_FORMATTED}. Return ONLY valid JSON:

{
  "vocabulary": {"word": "sophisticated medical/professional term", "pronunciation": "phonetic pronunciation with /slashes/", "pos": "part of speech", "definition": "precise professional definition", "examples": ["professional context example 1", "medical/academic context example 2"], "etymology": "word origin and history"},
  "quote": {"text": "reflection-quality quote for an adult professional", "attr": "— Author Name"},
  "meditFocus": "1-2 sentence advanced meditation focus or breathing technique",
  "writePrompt": "specific writing prompt for a nonfiction book author (1-2 sentences)",
  "lang_es": {"theme": "Spanish learning topic", "phrases": [{"en": "English phrase", "tl": "Spanish translation", "pr": "pronunciation"}, {"en": "English phrase", "tl": "Spanish translation", "pr": "pronunciation"}]},
  "lang_it": {"theme": "Italian learning topic", "phrases": [{"en": "English phrase", "tl": "Italian translation", "pr": "pronunciation"}, {"en": "English phrase", "tl": "Italian translation", "pr": "pronunciation"}]},
  "lang_ko": {"theme": "Korean learning topic", "phrases": [{"en": "English phrase", "tl": "Korean translation", "pr": "romanized pronunciation"}, {"en": "English phrase", "tl": "Korean translation", "pr": "romanized pronunciation"}]},
  "lang_zh": {"theme": "Chinese learning topic", "phrases": [{"en": "English phrase", "tl": "Chinese characters + pinyin", "pr": "simple pronunciation"}, {"en": "English phrase", "tl": "Chinese characters + pinyin", "pr": "simple pronunciation"}]}
}

Make vocabulary sophisticated for a physician. Include medical, philosophical, or scientific terms. Vary themes daily.`;

  return await callAnthropicAPI(prompt);
}

// Generate content for Caspian
async function generateCaspianContent() {
  const prompt = `Generate daily content for a 10-year-old's educational sheet focusing on confidence building and financial literacy. Today is ${TODAY_FORMATTED}. Return ONLY valid JSON:

{
  "wotd": {"word": "interesting vocabulary word for kids", "pronunciation": "phonetic pronunciation", "partOfSpeech": "noun|verb|adjective|adverb", "definition": "clear kid-friendly definition", "examples": ["example sentence 1", "example sentence 2", "example sentence 3"], "challenge": "fun daily challenge to use the word"},
  "factoid": {"text": "amazing kid-friendly fact about science/nature/animals", "category": "category name"},
  "quote": {"text": "inspiring quote suitable for children", "attr": "— Author Name"},
  "finTopic": {"question": "engaging finance question for kids", "intro": "simple 2-sentence explanation suitable for 10-year-old", "example": "real-world example they can understand", "challenge": "practical money challenge they can try today"},
  "mathProblems": {"fractionProblem1": "fraction addition/subtraction problem", "fractionProblem2": "decimal to fraction conversion or vice versa", "wordProblem": "real-world word problem involving fractions or decimals with clear steps"},
  "readingComprehension": {"title": "engaging passage title", "passage": "200-word passage about science, nature, or interesting topic", "questions": ["comprehension question 1", "comprehension question 2", "comprehension question 3", "vocabulary question about the passage"]},
  "spanish": {"theme": "Spanish topic for kids", "phrases": [{"en": "English", "tl": "Spanish", "pr": "pronunciation"}]},
  "chinese": {"theme": "Chinese topic for kids", "phrases": [{"en": "English", "tl": "Chinese + pinyin", "pr": "pronunciation"}]}
}

Make content age-appropriate, confidence-building, and genuinely educational. Focus on growth mindset and learning.`;

  return await callAnthropicAPI(prompt);
}

// Create vocabulary tracking directories and files
function ensureVocabularyFiles() {
  const vocabDir = 'vocabulary_tracking';
  if (!fs.existsSync(vocabDir)) {
    fs.mkdirSync(vocabDir);
  }

  // Create individual language CSV files for Anki import
  const languages = [
    { code: 'en_caspian', name: 'English (Caspian)', file: 'english_caspian_vocabulary.csv' },
    { code: 'en_darius', name: 'English (Darius)', file: 'english_darius_vocabulary.csv' },
    { code: 'es', name: 'Spanish', file: 'spanish_vocabulary.csv' },
    { code: 'it', name: 'Italian', file: 'italian_vocabulary.csv' },
    { code: 'ko', name: 'Korean', file: 'korean_vocabulary.csv' },
    { code: 'zh', name: 'Chinese', file: 'chinese_vocabulary.csv' }
  ];

  languages.forEach(lang => {
    const filePath = path.join(vocabDir, lang.file);
    if (!fs.existsSync(filePath)) {
      // Create CSV with Anki-friendly headers
      const headers = 'Front,Back,Pronunciation,Example,Theme,Date,Source,Notes\\n';
      fs.writeFileSync(filePath, headers, 'utf8');
      console.log(`📁 Created ${lang.file}`);
    }
  });

  // Create master CSV for backup
  const masterFile = path.join(vocabDir, 'master_vocabulary.csv');
  if (!fs.existsSync(masterFile)) {
    const headers = 'Date,Language,English,Translation,Pronunciation,Example,Theme,Source,PartOfSpeech,Definition\\n';
    fs.writeFileSync(masterFile, headers, 'utf8');
    console.log('📁 Created master_vocabulary.csv');
  }
}

// In-memory storage for Excel file data
let vocabularyData = {
  'Vocabulary (Darius)': [['Date', 'Word', 'Definition', 'Pronunciation', 'Part of Speech', 'Example 1', 'Example 2', 'Etymology', 'Theme']],
  'Vocabulary (Caspian)': [['Date', 'Word', 'Definition', 'Pronunciation', 'Part of Speech', 'Example 1', 'Example 2', 'Example 3', 'Challenge', 'Theme']],
  'Spanish': [['Date', 'English', 'Spanish', 'Pronunciation', 'Theme', 'Source']],
  'Italian': [['Date', 'English', 'Italian', 'Pronunciation', 'Theme', 'Source']],
  'Korean': [['Date', 'English', 'Korean', 'Pronunciation', 'Theme', 'Source']],
  'Chinese': [['Date', 'English', 'Chinese', 'Pronunciation', 'Theme', 'Source']]
};

// Load existing vocabulary data if Excel file exists
function loadExistingVocabulary() {
  const excelFile = path.join('vocabulary_tracking', 'Family_Vocabulary_Master.xlsx');
  
  if (fs.existsSync(excelFile)) {
    console.log('📊 Loading existing vocabulary data...');
    // For simplicity, we'll append to existing structure
    // In a real implementation, you'd use xlsx library to read existing data
  }
}

// Add vocabulary to tracking files and Excel data
function trackVocabulary(content) {
  const vocabDir = 'vocabulary_tracking';
  
  // Track Darius content
  if (content.darius) {
    // Darius Vocabulary (Professional/Medical)
    if (content.darius.vocabulary) {
      const vocab = content.darius.vocabulary;
      
      // Add to CSV
      const csvLine = `"${vocab.word}","${vocab.definition}","${vocab.pronunciation || ''}","${vocab.examples[0] || ''}","Professional Vocabulary","${TODAY}","Darius","${vocab.pos}"\\n`;
      fs.appendFileSync(path.join(vocabDir, 'english_darius_vocabulary.csv'), csvLine, 'utf8');
      
      // Add to Excel data
      vocabularyData['Vocabulary (Darius)'].push([
        TODAY,
        vocab.word,
        vocab.definition,
        vocab.pronunciation || '',
        vocab.pos || '',
        vocab.examples[0] || '',
        vocab.examples[1] || '',
        vocab.etymology || '',
        'Professional Vocabulary'
      ]);
      
      // Add to master CSV
      const masterLine = `"${TODAY}","EN-DARIUS","${vocab.word}","${vocab.definition}","${vocab.pronunciation || ''}","${vocab.examples[0] || ''}","Professional Vocabulary","Darius","${vocab.pos}","${vocab.definition}"\\n`;
      fs.appendFileSync(path.join(vocabDir, 'master_vocabulary.csv'), masterLine, 'utf8');
      console.log(`📝 Added Darius vocabulary: ${vocab.word}`);
    }

    // Darius Language phrases
    const languages = [
      { code: 'es', data: content.darius.lang_es, file: 'spanish_vocabulary.csv', tabName: 'Spanish' },
      { code: 'it', data: content.darius.lang_it, file: 'italian_vocabulary.csv', tabName: 'Italian' },
      { code: 'ko', data: content.darius.lang_ko, file: 'korean_vocabulary.csv', tabName: 'Korean' },
      { code: 'zh', data: content.darius.lang_zh, file: 'chinese_vocabulary.csv', tabName: 'Chinese' }
    ];

    languages.forEach(lang => {
      if (lang.data && lang.data.phrases) {
        lang.data.phrases.forEach((phrase, index) => {
          // Add to CSV file for Anki
          const csvLine = `"${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${lang.data.theme}","${TODAY}","Darius",""\\n`;
          const filePath = path.join(vocabDir, lang.file);
          fs.appendFileSync(filePath, csvLine, 'utf8');
          
          // Add to Excel data structure
          vocabularyData[lang.tabName].push([
            TODAY,
            phrase.en,
            phrase.tl,
            phrase.pr || '',
            lang.data.theme,
            'Darius'
          ]);
          
          // Add to master CSV
          const masterLine = `"${TODAY}","${lang.code.toUpperCase()}","${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${lang.data.theme}","Darius","","Phrase"\\n`;
          fs.appendFileSync(path.join(vocabDir, 'master_vocabulary.csv'), masterLine, 'utf8');
        });
        console.log(`📝 Added ${lang.data.phrases.length} ${lang.code.toUpperCase()} phrases (Darius)`);
      }
    });
  }

  // Track Caspian content
  if (content.caspian) {
    // Word of the Day (English - Caspian)
    if (content.caspian.wotd) {
      const wotd = content.caspian.wotd;
      
      // Add to CSV
      const csvLine = `"${wotd.word}","${wotd.definition}","${wotd.pronunciation || ''}","${wotd.examples[0] || ''}","Word of the Day","${TODAY}","Caspian","${wotd.partOfSpeech}"\\n`;
      fs.appendFileSync(path.join(vocabDir, 'english_caspian_vocabulary.csv'), csvLine, 'utf8');
      
      // Add to Excel data
      vocabularyData['Vocabulary (Caspian)'].push([
        TODAY,
        wotd.word,
        wotd.definition,
        wotd.pronunciation || '',
        wotd.partOfSpeech,
        wotd.examples[0] || '',
        wotd.examples[1] || '',
        wotd.examples[2] || '',
        wotd.challenge || '',
        'Word of the Day'
      ]);
      
      // Add to master
      const masterLine = `"${TODAY}","EN-CASPIAN","${wotd.word}","${wotd.definition}","${wotd.pronunciation || ''}","${wotd.examples[0] || ''}","Word of the Day","Caspian","${wotd.partOfSpeech}","${wotd.definition}"\\n`;
      fs.appendFileSync(path.join(vocabDir, 'master_vocabulary.csv'), masterLine, 'utf8');
      console.log(`📝 Added Caspian vocabulary: ${wotd.word}`);
    }

    // Spanish from Caspian
    if (content.caspian.spanish && content.caspian.spanish.phrases) {
      content.caspian.spanish.phrases.forEach(phrase => {
        // Add to CSV
        const csvLine = `"${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${content.caspian.spanish.theme}","${TODAY}","Caspian",""\\n`;
        fs.appendFileSync(path.join(vocabDir, 'spanish_vocabulary.csv'), csvLine, 'utf8');
        
        // Add to Excel data
        vocabularyData['Spanish'].push([
          TODAY,
          phrase.en,
          phrase.tl,
          phrase.pr || '',
          content.caspian.spanish.theme,
          'Caspian'
        ]);
        
        const masterLine = `"${TODAY}","ES","${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${content.caspian.spanish.theme}","Caspian","","Phrase"\\n`;
        fs.appendFileSync(path.join(vocabDir, 'master_vocabulary.csv'), masterLine, 'utf8');
      });
      console.log(`📝 Added ${content.caspian.spanish.phrases.length} Spanish phrases (Caspian)`);
    }

    // Chinese from Caspian
    if (content.caspian.chinese && content.caspian.chinese.phrases) {
      content.caspian.chinese.phrases.forEach(phrase => {
        // Add to CSV
        const csvLine = `"${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${content.caspian.chinese.theme}","${TODAY}","Caspian",""\\n`;
        fs.appendFileSync(path.join(vocabDir, 'chinese_vocabulary.csv'), csvLine, 'utf8');
        
        // Add to Excel data
        vocabularyData['Chinese'].push([
          TODAY,
          phrase.en,
          phrase.tl,
          phrase.pr || '',
          content.caspian.chinese.theme,
          'Caspian'
        ]);
        
        const masterLine = `"${TODAY}","ZH","${phrase.en}","${phrase.tl}","${phrase.pr || ''}","","${content.caspian.chinese.theme}","Caspian","","Phrase"\\n`;
        fs.appendFileSync(path.join(vocabDir, 'master_vocabulary.csv'), masterLine, 'utf8');
      });
      console.log(`📝 Added ${content.caspian.chinese.phrases.length} Chinese phrases (Caspian)`);
    }
  }
}

// Generate Excel file with tabs
function generateExcelFile() {
  const vocabDir = 'vocabulary_tracking';
  const excelContent = generateExcelHTML();
  
  // Save as HTML that Excel can open with multiple sheets
  const htmlExcelFile = path.join(vocabDir, 'Family_Vocabulary_Master.html');
  fs.writeFileSync(htmlExcelFile, excelContent, 'utf8');
  
  // Also create a simplified Excel-compatible format
  const xlsContent = generateXLSContent();
  const xlsFile = path.join(vocabDir, 'Family_Vocabulary_Master.xls');
  fs.writeFileSync(xlsFile, xlsContent, 'utf8');
  
  console.log('📊 Created Excel files with language tabs');
}

// Generate HTML that Excel can open with tabs
function generateExcelHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Family Vocabulary Master</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.tab { display: none; }
.tab.active { display: block; }
.tab-buttons { margin-bottom: 20px; }
.tab-button { 
  padding: 8px 16px; 
  margin-right: 5px; 
  border: 1px solid #ccc; 
  background: #f0f0f0; 
  cursor: pointer; 
  border-radius: 4px 4px 0 0;
}
.tab-button.active { background: #fff; border-bottom: 1px solid #fff; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f0f0f0; font-weight: bold; }
tr:nth-child(even) { background-color: #f9f9f9; }
.stats { background: #e8f4fd; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
</style>
</head>
<body>

<h1>📚 Family Vocabulary Master</h1>
<div class="stats">
  <strong>Last Updated:</strong> ${TODAY_FORMATTED}<br>
  <strong>Total Languages:</strong> 6 tabs<br>
  <strong>Total Entries:</strong> ${getTotalEntries()} vocabulary items
</div>

<div class="tab-buttons">
  ${Object.keys(vocabularyData).map((tabName, index) => 
    `<button class="tab-button ${index === 0 ? 'active' : ''}" onclick="showTab('${tabName}')">${tabName}</button>`
  ).join('')}
</div>

${Object.entries(vocabularyData).map(([tabName, data], index) => `
<div id="${tabName}" class="tab ${index === 0 ? 'active' : ''}">
  <h2>${tabName}</h2>
  <table>
    ${data.map((row, rowIndex) => `
      <tr>
        ${row.map(cell => `<${rowIndex === 0 ? 'th' : 'td'}>${cell}</${rowIndex === 0 ? 'th' : 'td'}>`).join('')}
      </tr>
    `).join('')}
  </table>
  <p><strong>Total entries:</strong> ${data.length - 1}</p>
</div>
`).join('')}

<script>
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}
</script>

</body>
</html>`;
}

// Generate XLS-compatible content
function generateXLSContent() {
  let xlsContent = '<?xml version="1.0"?>\\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\\n';
  
  // Add each language as a worksheet
  Object.entries(vocabularyData).forEach(([sheetName, data]) => {
    xlsContent += `<Worksheet ss:Name="${sheetName}">\\n<Table>\\n`;
    
    data.forEach(row => {
      xlsContent += '<Row>\\n';
      row.forEach(cell => {
        xlsContent += `<Cell><Data ss:Type="String">${cell}</Data></Cell>\\n`;
      });
      xlsContent += '</Row>\\n';
    });
    
    xlsContent += '</Table>\\n</Worksheet>\\n';
  });
  
  xlsContent += '</Workbook>';
  return xlsContent;
}

function getTotalEntries() {
  return Object.values(vocabularyData).reduce((total, tabData) => total + (tabData.length - 1), 0);
}

// Generate Anki import instructions
function generateAnkiInstructions() {
  const instructions = `# 📚 Anki Import Instructions

## Quick Import Steps:
1. **Open Anki** → **File** → **Import**
2. **Select any CSV file** from the vocabulary_tracking folder
3. **Field Mapping:**
   - Field 1: Front (English)
   - Field 2: Back (Translation/Definition)
   - Field 3: Pronunciation
   - Field 4: Example
   - Field 5: Theme/Category
   - Field 6: Date
   - Field 7: Source
   - Field 8: Notes/PartOfSpeech

## 📁 Available Files:

### Language-Specific CSV Files (Perfect for separate Anki decks):
- **english_caspian_vocabulary.csv** - Word of the Day entries
- **english_darius_vocabulary.csv** - Advanced English vocabulary  
- **spanish_vocabulary.csv** - Spanish phrases from both sheets
- **italian_vocabulary.csv** - Italian phrases from Darius sheet
- **korean_vocabulary.csv** - Korean phrases from Darius sheet  
- **chinese_vocabulary.csv** - Chinese phrases from both sheets

### Excel Files:
- **Family_Vocabulary_Master.html** - Interactive Excel file with tabs
- **Family_Vocabulary_Master.xls** - Excel-compatible format
- **master_vocabulary.csv** - ALL vocabulary in one CSV

## 📊 Excel File Features:
- **Separate tabs** for each language
- **English (Caspian)** - Word of the Day with examples
- **English (Darius)** - Advanced vocabulary (if any)
- **Spanish, Italian, Korean, Chinese** - Language learning phrases
- **Sortable columns** for analysis
- **Entry counts** per language

Updated: ${new Date().toLocaleDateString()}
`;

  fs.writeFileSync('vocabulary_tracking/ANKI_IMPORT_INSTRUCTIONS.md', instructions, 'utf8');
  console.log('📋 Created Anki import instructions');
}

// Update worksheet files
function updateWorksheets(dariusContent, caspianContent) {
  // Update Darius sheet
  let dariusHtml = fs.readFileSync('darius_daily_sheet.html', 'utf8');
  dariusHtml = dariusHtml.replace(
    /dailyContent:\s*\{[^}]*\}/s,
    `dailyContent: { "${TODAY}": ${JSON.stringify(dariusContent)} }`
  );
  fs.writeFileSync('darius_daily_sheet.html', dariusHtml, 'utf8');
  console.log('✅ Updated darius_daily_sheet.html');

  // Update Caspian sheet
  let caspianHtml = fs.readFileSync('caspian_daily_sheet.html', 'utf8');
  caspianHtml = caspianHtml.replace(
    /dailyContent:\s*\{[^}]*\}/s,
    `dailyContent: { "${TODAY}": ${JSON.stringify(caspianContent)} }`
  );
  fs.writeFileSync('caspian_daily_sheet.html', caspianHtml, 'utf8');
  console.log('✅ Updated caspian_daily_sheet.html');
}

// Generate vocabulary statistics
function generateVocabularyStats() {
  const totalEntries = getTotalEntries();
  
  const stats = {
    totalEntries,
    vocabularyDarius: vocabularyData['Vocabulary (Darius)'].length - 1,
    vocabularyCaspian: vocabularyData['Vocabulary (Caspian)'].length - 1,
    spanish: vocabularyData['Spanish'].length - 1,
    italian: vocabularyData['Italian'].length - 1,
    korean: vocabularyData['Korean'].length - 1,
    chinese: vocabularyData['Chinese'].length - 1,
    lastUpdated: TODAY
  };

  const statsContent = `# 📊 Vocabulary Statistics

**Total Vocabulary Entries:** ${stats.totalEntries}

## By Type & Source:
- 🎓 **Vocabulary (Darius):** ${stats.vocabularyDarius} professional/medical terms
- 📚 **Vocabulary (Caspian):** ${stats.vocabularyCaspian} academic words (WOTD)
- 🇪🇸 **Spanish:** ${stats.spanish} phrases  
- 🇮🇹 **Italian:** ${stats.italian} phrases
- 🇰🇷 **Korean:** ${stats.korean} phrases
- 🇨🇳 **Chinese:** ${stats.chinese} phrases

## Excel File Features:
- **📊 Family_Vocabulary_Master.html** - Interactive file with tabs
- **📁 Separate vocabulary tabs** for Darius and Caspian
- **🌍 Language learning tabs** for each language
- **🔍 Sortable columns** for analysis
- **📈 Entry counts** and progress tracking

## Daily Learning Goals:
- **Darius:** 1 professional vocab + 8 language phrases = 9 daily entries
- **Caspian:** 1 academic word + 4-6 language phrases = 5-7 daily entries
- **Combined:** ~14-16 new vocabulary entries daily

## Progress Tracking:
- **Average per day:** ${(stats.totalEntries / Math.max(1, getDaysSinceStart())).toFixed(1)} new entries
- **Last updated:** ${TODAY}

*Comprehensive vocabulary tracking with separate academic and language learning tabs.*
`;

  fs.writeFileSync('vocabulary_tracking/VOCABULARY_STATS.md', statsContent, 'utf8');
  console.log(`📊 Total vocabulary tracked: ${stats.totalEntries} entries across ${Object.keys(vocabularyData).length} tabs`);
}

function getDaysSinceStart() {
  return Math.max(1, Math.floor((Date.now() - new Date('2026-04-20').getTime()) / (1000 * 60 * 60 * 24)));
}

// Main execution
async function main() {
  try {
    console.log('🚀 Generating daily content with vocabulary tracking...');
    console.log(`📅 Date: ${TODAY_FORMATTED}`);

    // Ensure vocabulary tracking setup
    ensureVocabularyFiles();
    loadExistingVocabulary();

    // Generate fresh content
    console.log('\\n🤖 Calling Anthropic API...');
    const [dariusContent, caspianContent] = await Promise.all([
      generateDariusContent(),
      generateCaspianContent()
    ]);

    // Track vocabulary in CSV files and Excel data
    console.log('\\n📝 Tracking vocabulary...');
    trackVocabulary({ darius: dariusContent, caspian: caspianContent });

    // Generate Excel file with tabs
    console.log('\\n📊 Creating Excel file with language tabs...');
    generateExcelFile();

    // Update worksheets
    console.log('\\n📄 Updating worksheets...');
    updateWorksheets(dariusContent, caspianContent);

    // Generate support files
    generateAnkiInstructions();
    generateVocabularyStats();

    console.log('\\n✅ Daily update complete!');
    console.log('🎯 New vocabulary automatically added to CSV and Excel files');
    console.log('📚 Excel file with language tabs ready for analysis');
    console.log('📊 Ready for Anki import from individual CSV files');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

const fs = require('fs');

const file = 'src/services/geminiService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const response = await ai\.models\.generateContent\(\{/g, 'const response = await generateContentWrapper({');

fs.writeFileSync(file, content);
console.log('Replaced successfully');

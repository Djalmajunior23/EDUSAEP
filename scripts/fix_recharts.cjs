const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Fix width="100%" height="100%" missing min dimensions
      let newContent = content.replace(
        /<ResponsiveContainer width="100%" height="100%">/g, 
        '<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>'
      );

      // Fix width="100%" height={300} missing min dimensions
      newContent = newContent.replace(
        /<ResponsiveContainer width="100%" height=\{300\}>/g, 
        '<ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>'
      );

      if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log(`Updated ${p}`);
      }
    }
  });
}

walk('src');

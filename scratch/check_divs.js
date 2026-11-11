const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

let depth = 0;
for (let i = 870; i < 915; i++) {
    const l = lines[i];
    const opens = (l.match(/<div(\s|>)/gi) || []).length;
    const closes = (l.match(/<\/div>/gi) || []).length;
    depth += (opens - closes);
    console.log(`${i+1} (delta=${opens-closes}, depth=${depth}): ${l.trim()}`);
}

const fs = require('fs');
const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');

const tagRe = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*?)?(\/?)>/g;
let stack = [];
let match;
while ((match = tagRe.exec(html)) !== null) {
  const full = match[0];
  const tag = match[1].toLowerCase();
  const isClosing = full.startsWith('</');
  const isSelfClosing = match[2] === '/' || ['meta', 'link', 'img', 'br', 'hr', 'input'].includes(tag);

  if (isClosing) {
    while (stack.length > 0) {
      const top = stack.pop();
      if (top.tag === tag) {
        break;
      }
    }
  } else if (!isSelfClosing) {
    let id = '';
    let cls = '';
    let m = full.match(/id=['"]([^'"]+)['"]/);
    if (m) id = m[1];
    m = full.match(/class=['"]([^'"]+)['"]/);
    if (m) cls = m[1];

    if (id === 'room-gh-saves') {
      console.log('--- FOUND #room-gh-saves in ' + file + ' ---');
      console.log('Hierarchy:');
      stack.forEach(s => console.log('  < ' + s.tag + (s.id ? '#' + s.id : '') + (s.cls ? '.' + s.cls.split(' ')[0] : '')));
    }
    stack.push({ tag, id, cls });
  }
}

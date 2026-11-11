const fs = require('fs');

const cssFiles = ['css/main.css', 'css/board.css', 'css/modals.css', 'css/mobile.css'];
for (const file of cssFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
        if (/grid-column|grid-row|room-gh|gamehall|saved-games/i.test(l)) {
            console.log(`${file}:${idx + 1}: ${l.trim()}`);
        }
    });
}

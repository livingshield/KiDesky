const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('class="gamehall-sidebar-col"');
const mIdx = html.indexOf('class="gamehall-main-col"');
const eIdx = html.indexOf('id="tab-board"');

console.log('Sidebar section length:', mIdx - sIdx);
console.log('Main section length:', eIdx - mIdx);

const sidebarHtml = html.slice(sIdx, mIdx);
const mainHtml = html.slice(mIdx, eIdx);

console.log('Does sidebar have room-gh-saves?', sidebarHtml.includes('room-gh-saves'));
console.log('Does main have room-gh-saves?', mainHtml.includes('room-gh-saves'));
console.log('Does sidebar have Paměť království?', sidebarHtml.includes('Paměť království'));
console.log('Does main have Paměť království?', mainHtml.includes('Paměť království'));

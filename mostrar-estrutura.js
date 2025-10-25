// gerar-estrutura.js
const fs = require('fs');
const path = require('path');

const IGNORE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.vercel',
  'coverage',
  '.DS_Store',
  'package-lock.json',
  '.env.local',
  '.env.production',
  '.env.staging'
];

function generateTree(dir, prefix = '', isLast = true) {
  let output = '';
  const items = fs.readdirSync(dir)
    .filter(item => !IGNORE.includes(item))
    .sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isLastItem = index === items.length - 1;
    const stats = fs.statSync(itemPath);
    
    const connector = isLastItem ? '└── ' : '├── ';
    const icon = stats.isDirectory() ? '📁' : '📄';
    
    output += `${prefix}${connector}${icon} ${item}\n`;
    
    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
      output += generateTree(itemPath, newPrefix, isLastItem);
    }
  });
  
  return output;
}

const projectName = path.basename(process.cwd());
const tree = `📦 ${projectName}/\n${generateTree('.')}`;

fs.writeFileSync('ESTRUTURA.txt', tree);
console.log('✅ Estrutura gerada em ESTRUTURA.txt');
console.log('\n' + tree);
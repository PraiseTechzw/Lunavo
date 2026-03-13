const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';
const replacements = [
  { from: /@\/app\/_components/g, to: '@/components' },
  { from: /@\/app\/_constants/g, to: '@/constants' },
  { from: /@\/app\/_hooks/g, to: '@/hooks' },
  { from: /@\/app\/_types/g, to: '@/types' },
  { from: /@\/app\/_utils/g, to: '@/utils' }
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        walk(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const r of replacements) {
        if (r.from.test(content)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walk(rootDir);

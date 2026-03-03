import fs from 'fs';
import path from 'path';

function checkFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                checkFiles(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const singleQuotes = (content.match(/'/g) || []).length;
            const doubleQuotes = (content.match(/"/g) || []).length;
            const backticks = (content.match(/`/g) || []).length;
            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
                console.log(`Potential issue in ${fullPath}: Single:${singleQuotes} Double:${doubleQuotes} Backticks:${backticks}`);
            }
        }
    }
}

checkFiles('.');

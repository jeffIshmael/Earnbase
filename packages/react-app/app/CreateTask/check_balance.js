
const fs = require('fs');

const content = fs.readFileSync('/Users/jeff/coding/earnbase/packages/react-app/app/CreateTask/page.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let divCount = 0;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
    }
    
    // Naive tag counting (will fail on comments/strings, but good enough for rough check)
    // Counting <div and </div
    // We ignore <div /> self closing
    
    const divOpens = (line.match(/<div\s/g) || []).length + (line.match(/<div>/g) || []).length;
    const divCloses = (line.match(/<\/div>/g) || []).length;
    
    divCount += divOpens;
    divCount -= divCloses;
    
    // console.log(`Line ${i+1}: Braces: ${braceCount}, Parens: ${parenCount}, Divs: ${divCount}`);
    
    if (braceCount < 0) {
        console.log(`Brace mismatch (negative) at line ${i+1}`);
        process.exit(1);
    }
    if (parenCount < 0) {
        console.log(`Paren mismatch (negative) at line ${i+1}`);
        process.exit(1);
    }
    if (divCount < 0) {
        console.log(`Div mismatch (negative) at line ${i+1}`);
        process.exit(1);
    }
}

console.log(`Final: Braces: ${braceCount}, Parens: ${parenCount}, Divs: ${divCount}`);

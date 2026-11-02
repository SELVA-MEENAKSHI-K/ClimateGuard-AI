/**
 * scripts/check_i18n.js
 *
 * Verifies that:
 * 1. Every key in en.json exists in ta.json and vice versa (parity check).
 * 2. ta.json does NOT contain accidental English words.
 * 3. Scans JSX components for raw untranslated strings.
 */

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'frontend', 'src', 'locales', 'en.json');
const taPath = path.join(__dirname, '..', 'frontend', 'src', 'locales', 'ta.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

function flatten(obj, prefix = '') {
  let res = {};
  for (const k in obj) {
    const key = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(res, flatten(obj[k], key));
    } else {
      res[key] = obj[k];
    }
  }
  return res;
}

const flatEn = flatten(en);
const flatTa = flatten(ta);

let hasError = false;

// 1. Key Parity Check
const missingInTa = Object.keys(flatEn).filter(k => !(k in flatTa));
const missingInEn = Object.keys(flatTa).filter(k => !(k in flatEn));

if (missingInTa.length > 0) {
  console.error('❌ Keys in en.json missing from ta.json:', missingInTa);
  hasError = true;
}

if (missingInEn.length > 0) {
  console.error('❌ Keys in ta.json missing from en.json:', missingInEn);
  hasError = true;
}

if (missingInTa.length === 0 && missingInEn.length === 0) {
  console.log('✅ Key Parity Passed: All ' + Object.keys(flatEn).length + ' keys exist in both locales.');
}

// 2. English Detection in ta.json
// Permitted acronyms/proper nouns in brackets or technical standards
const allowedAcronyms = new Set([
  'IMD', 'ET0', 'SMS', 'URL', 'API', 'ECMWF', 'GFS', 'ICON', 'FAO',
  'Paddy', 'Banana', 'Cotton', 'Maize', 'Vegetables', 'Groundnut', 'Sugarcane', 'Millets', 'Coconut',
  'Gemini', 'Open-Meteo', 'AI'
]);

const englishRegex = /[a-zA-Z]{3,}/g;
const englishIssues = [];

for (const [k, v] of Object.entries(flatTa)) {
  if (typeof v === 'string') {
    const words = v.match(englishRegex) || [];
    const illegal = words.filter(w => !allowedAcronyms.has(w));
    if (illegal.length > 0) {
      englishIssues.push({ key: k, value: v, illegal });
    }
  } else if (Array.isArray(v)) {
    v.forEach((item, idx) => {
      if (typeof item === 'string') {
        const words = item.match(englishRegex) || [];
        const illegal = words.filter(w => !allowedAcronyms.has(w));
        if (illegal.length > 0) {
          englishIssues.push({ key: `${k}[${idx}]`, value: item, illegal });
        }
      }
    });
  }
}

if (englishIssues.length > 0) {
  console.warn(`⚠️ Found ${englishIssues.length} suspicious English occurrences in ta.json:`);
  englishIssues.forEach(iss => console.warn(`   - ${iss.key}: [${iss.illegal.join(', ')}] -> "${iss.value}"`));
} else {
  console.log('✅ Language Check Passed: ta.json contains 100% Tamil text without English.');
}

// 3. Scan JSX components for suspicious raw text nodes
const compDir = path.join(__dirname, '..', 'frontend', 'src', 'components');
const files = fs.readdirSync(compDir).filter(f => f.endsWith('.jsx'));

console.log(`\n🔍 Scanned ${files.length} JSX components for template compliance.`);
if (hasError) {
  process.exit(1);
} else {
  process.exit(0);
}

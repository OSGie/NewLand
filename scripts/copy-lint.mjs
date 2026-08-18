import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const targets = [join(root, "client/src"), join(root, "shared")];
const forbidden = [
  /معتمد(?:ة)?\s+من\s+مصلحة\s+الضرائب/gi,
  /مرخ[ّصص](?:ة)?\s+من\s+مصلحة\s+الضرائب/gi,
  /موث[ّققة]\s+من\s+مصلحة\s+الضرائب/gi,
  /بوابة\s+الضرائب.*(?:كلمة\s+السر|بيانات\s+الدخول)/gi,
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}

const files = (await Promise.all(targets.map(listFiles))).flat().filter(file => /\.(tsx|ts|json)$/.test(file));
const failures = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  forbidden.forEach(pattern => { if (pattern.test(content)) failures.push(`${file}: ${pattern}`); pattern.lastIndex = 0; });
}
if (failures.length) { console.error("فشل فاحص الامتثال بسبب عبارات محظورة:\n" + failures.join("\n")); process.exit(1); }
console.log(`فاحص الامتثال: تم فحص ${files.length} ملفًا بنجاح.`);

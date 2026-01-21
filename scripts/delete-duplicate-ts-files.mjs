import { readFileSync, unlinkSync, existsSync } from 'fs';

const filesToDelete = readFileSync('scripts/duplicate-ts-files-to-delete.txt', 'utf-8')
  .trim()
  .split('\n')
  .filter(Boolean);

let deleted = 0;
let notFound = 0;

for (const file of filesToDelete) {
  if (existsSync(file)) {
    try {
      unlinkSync(file);
      deleted++;
      console.log(`✅ Deleted: ${file}`);
    } catch (error) {
      console.error(`❌ Error deleting ${file}:`, error.message);
    }
  } else {
    notFound++;
    console.log(`⚠️  Not found: ${file}`);
  }
}

console.log(`\n✨ Deleted ${deleted} files`);
if (notFound > 0) {
  console.log(`⚠️  ${notFound} files were not found`);
}

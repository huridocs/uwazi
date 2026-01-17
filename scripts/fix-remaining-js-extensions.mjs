import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const replacements = [
  {
    from: /from\s+(['"])\.\/MultiSelect\.js(['"])/g,
    to: `from $1./MultiSelect.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Markdown\/components\/MarkdownMedia\.js(['"])/g,
    to: `from $1#app/Markdown/components/MarkdownMedia.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Metadata\/components\/MediaModal\.js(['"])/g,
    to: `from $1#app/Metadata/components/MediaModal.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/App\/Collapsible\.js(['"])/g,
    to: `from $1#app/App/Collapsible.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/App\/StickyHeader\.js(['"])/g,
    to: `from $1#app/App/StickyHeader.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Relationships\/components\/LoadMoreRelationshipsButton\.js(['"])/g,
    to: `from $1#app/Relationships/components/LoadMoreRelationshipsButton.jsx$2`,
  },
  {
    from: /from\s+(['"])#app\/Relationships\/actions\/actions(['"])/g,
    to: `from $1#app/Relationships/actions/actions.js$2`,
  },
];

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
  }
}

console.log(`✨ Fixed ${totalFixed} files`);

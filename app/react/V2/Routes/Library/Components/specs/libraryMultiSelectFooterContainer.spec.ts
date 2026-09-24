/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '@tailwindcss/node';

const footerPath = join('app/react/V2/Routes/Library/Components', 'LibraryMultiSelectFooter.tsx');

const labelClassName = (source: string) => {
  const match = source.match(/<span className="([^"]+)">\s*<Translate>\{label\}/);
  return match?.[1] ?? '';
};

const compiledUtility = async (utility: string) => {
  const stylesDir = join(process.cwd(), 'app/react/App/styles');
  const compiler = await compile(readFileSync(join(stylesDir, 'tailwind.css'), 'utf8'), {
    base: stylesDir,
    from: join(stylesDir, 'tailwind.css'),
    onDependency() {
      return undefined;
    },
  });
  return compiler.build([utility]);
};

describe('library multi-select footer labels', () => {
  it('uses a viewport utility and does not hide labels with a container query', () => {
    const labels = labelClassName(readFileSync(footerPath, 'utf8'));
    const classes = labels.split(/\s+/);
    expect(classes).toContain('sm:inline');
    expect(classes).not.toContain('hidden');
    expect(labels).not.toContain('@min-');
    expect(labels).not.toContain('@[');
  });

  it('emits display inline for sm:inline at the sm breakpoint', async () => {
    const css = await compiledUtility('sm:inline');
    expect(css).toContain('@media (width >= 40rem)');
    expect(css).toContain('.sm\\:inline');
    expect(css).toContain('display: inline');
    expect(css).not.toContain('@container (width >= 56rem)');
  });
});

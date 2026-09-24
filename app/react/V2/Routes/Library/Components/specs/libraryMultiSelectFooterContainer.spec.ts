/**
 * @jest-environment node
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '@tailwindcss/node';

const selectionDir = 'app/react/V2/Routes/Library/Components';
const footerPath = join(selectionDir, 'LibraryMultiSelectFooter.tsx');
const legacyContainerClass = '@[';

const selectionSources = () =>
  readdirSync(selectionDir)
    .filter(name => name.startsWith('LibrarySelection') || name === 'LibraryMultiSelectFooter.tsx')
    .map(name => readFileSync(join(selectionDir, name), 'utf8'));

const containerUtilities = (source: string) =>
  [...source.matchAll(/(?:^|[\s"'`])(@[^\s"'`]+)/g)].map(match => match[1]);

const assertTailwind4ContainerUtilities = () => {
  selectionSources().forEach(source => {
    expect(source).not.toContain(legacyContainerClass);
  });
  expect(containerUtilities(readFileSync(footerPath, 'utf8'))).toEqual(
    expect.arrayContaining(['@container', '@min-[56rem]:inline', '@min-[56rem]:px-3'])
  );
};

const compiledContainerRule = async (utilities: string[]) => {
  const stylesDir = join(process.cwd(), 'app/react/App/styles');
  const compiler = await compile(readFileSync(join(stylesDir, 'tailwind.css'), 'utf8'), {
    base: stylesDir,
    from: join(stylesDir, 'tailwind.css'),
    onDependency() {
      return undefined;
    },
  });
  const css = compiler.build(utilities);
  return css.match(/@container \(width >= 56rem\) \{[\s\S]*?\n {2}\}/)?.[0] ?? '';
};

const assertEmittedLabelRule = (rule: string) => {
  expect(rule).toContain('.\\@min-\\[56rem\\]\\:inline');
  expect(rule).toContain('display: inline');
  expect(rule).not.toContain('.\\@\\[56rem\\]');
};

describe('library multi-select footer container queries', () => {
  it('keeps Tailwind 4 container utilities in the selection files', () => {
    assertTailwind4ContainerUtilities();
  });

  it('emits a 56rem container rule for the shipped label class', async () => {
    const utilities = containerUtilities(readFileSync(footerPath, 'utf8'));
    expect(utilities.find(utility => utility.endsWith(':inline'))).toBe('@min-[56rem]:inline');
    assertEmittedLabelRule(await compiledContainerRule(utilities));
  });
});

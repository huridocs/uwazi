import { extractUsages } from '../extractUsages.js';
import { COMPOSED_PLACEHOLDER } from '../heuristics.js';

const file = 'app/react/Example.tsx';

const byKind = (source: string, kind: string) =>
  extractUsages(source, file).filter(usage => usage.kind === kind);

describe('extractUsages composed strings', () => {
  it('flags template literals in translatable positions as composed and not fixable', () => {
    const source = `
      const x = <button aria-label={\`Page \${pageNumber}\`} />;
    `;

    expect(byKind(source, 'composed')).toEqual([
      expect.objectContaining({
        text: `Page ${COMPOSED_PLACEHOLDER}`,
        translated: false,
        fixable: false,
      }),
    ]);
  });

  it('flags Translate wrapping a whole interpolated phrase', () => {
    const source = `
      const x = <Translate>{\`\${mode} Group\`}</Translate>;
    `;

    expect(byKind(source, 'composed')[0]).toMatchObject({
      translated: false,
      fixable: false,
    });
  });

  it('does not flag composed strings that are only interpolations', () => {
    const source = `
      const x = (
        <>
          <span title={\`\${date}\\n\${entity.title}\`} />
          <button aria-label={\`\${hh}:\${mm}:\${ss}\`} />
          <Translate>{\`\${label} (\${key})\`}</Translate>
        </>
      );
    `;

    expect(byKind(source, 'composed')).toEqual([]);
  });

  it('flags interpolations that embed hardcoded UI copy', () => {
    const source = `
      const x = (
        <Translate>
          {\`\${title === '' ? 'New' : 'Edit'} \${type === 'group' ? 'Group' : 'Link'}\`}
        </Translate>
      );
    `;

    expect(byKind(source, 'composed')[0]).toMatchObject({
      text: expect.stringContaining('New'),
      translated: false,
      fixable: false,
    });
  });
});

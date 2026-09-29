import { applySourceFixes, jsStringLiteral } from '../applyFixes.js';
import type { Finding } from '../types.js';

const loc = (start: number, end: number) => ({ line: 1, column: start, start, end });

const finding = (overrides: Partial<Finding> & { start: number; end: number }): Finding => ({
  kind: 'untranslated-attribute',
  severity: 'warning',
  file: 'Modal.tsx',
  text: 'Close modal',
  key: 'Close modal',
  fixable: true,
  loc: loc(overrides.start, overrides.end),
  ...overrides,
});

describe('applySourceFixes', () => {
  it('wraps unwrapped JSX text in Translate', () => {
    const source = 'const x = <button>Close modal</button>;';
    const start = source.indexOf('Close modal');
    const { source: next, applied } = applySourceFixes(source, [
      finding({
        kind: 'unwrapped-jsx-text',
        severity: 'error',
        text: 'Close modal',
        key: 'Close modal',
        start,
        end: start + 'Close modal'.length,
      }),
    ]);

    expect(next).toBe(
      "import { Translate } from '#app/I18N/index.js';\nconst x = <button><Translate>Close modal</Translate></button>;"
    );
    expect(applied).toHaveLength(1);
  });

  it('converts static native attributes to t()', () => {
    const source = 'const x = <button aria-label="Close modal" />;';
    const start = source.indexOf('"Close modal"');
    const { source: next } = applySourceFixes(source, [
      finding({
        kind: 'untranslated-attribute',
        text: 'Close modal',
        key: 'Close modal',
        attrName: 'aria-label',
        start,
        end: start + '"Close modal"'.length,
      }),
    ]);

    expect(next).toBe(
      "import { t } from '#app/I18N/index.js';\nconst x = <button aria-label={t('System', 'Close modal', null, false)} />;"
    );
  });

  it('wraps notify() string arguments in t()', () => {
    const source = "notify('Document updated', 'success');";
    const start = source.indexOf("'Document updated'");
    const { source: next } = applySourceFixes(source, [
      finding({
        kind: 'untranslated-notify',
        text: 'Document updated',
        key: 'Document updated',
        start,
        end: start + "'Document updated'".length,
      }),
    ]);

    expect(next).toBe(
      "import { t } from '#app/I18N/index.js';\nnotify(t('System', 'Document updated', null, false), 'success');"
    );
  });

  it('adds a t / Translate import when the file has none', () => {
    const source = 'const x = <button>Save</button>;\n';
    const start = source.indexOf('Save');
    const { source: next } = applySourceFixes(source, [
      finding({
        kind: 'unwrapped-jsx-text',
        severity: 'error',
        text: 'Save',
        key: 'Save',
        start,
        end: start + 4,
      }),
    ]);

    expect(next.startsWith("import { Translate } from '#app/I18N/index.js';")).toBe(true);
    expect(next).toContain('<Translate>Save</Translate>');
  });

  it('extends an existing I18N import instead of adding a second one', () => {
    const source = `import { Translate } from '#app/I18N/index.js';
const x = <button aria-label="Close modal" />;
`;
    const start = source.indexOf('"Close modal"');
    const { source: next } = applySourceFixes(source, [
      finding({
        kind: 'untranslated-attribute',
        text: 'Close modal',
        key: 'Close modal',
        start,
        end: start + '"Close modal"'.length,
      }),
    ]);

    expect(next).toContain("import { t, Translate } from '#app/I18N/index.js';");
    expect(next.match(/#app\/I18N/g)).toHaveLength(1);
  });

  it('leaves unfixable findings untouched', () => {
    const source = "const options = [{ label: 'Text' }];";
    const start = source.indexOf("'Text'");
    const { source: next, leftover } = applySourceFixes(source, [
      finding({
        kind: 'untranslated-label',
        text: 'Text',
        key: 'Text',
        fixable: false,
        start,
        end: start + 6,
      }),
    ]);

    expect(next).toBe(source);
    expect(leftover).toHaveLength(1);
  });

  it('quotes keys that contain apostrophes', () => {
    expect(jsStringLiteral("It's closed")).toBe(`"It's closed"`);
    expect(jsStringLiteral('Close modal')).toBe(`'Close modal'`);
  });
});

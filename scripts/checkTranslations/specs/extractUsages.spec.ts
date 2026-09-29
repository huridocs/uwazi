import { extractUsages } from '../extractUsages.js';

const file = 'app/react/Example.tsx';

const texts = (source: string) => extractUsages(source, file).map(usage => usage.text);

const byKind = (source: string, kind: string) =>
  extractUsages(source, file).filter(usage => usage.kind === kind);

describe('extractUsages', () => {
  describe('already translated', () => {
    it('extracts t(System) lookups as translated usages', () => {
      const usages = extractUsages(
        `t('System', 'Close modal', null, false);`,
        'app/react/Modal.tsx'
      );

      expect(usages).toEqual([
        expect.objectContaining({
          kind: 't-call',
          key: 'Close modal',
          text: 'Close modal',
          translated: true,
          fixable: false,
        }),
      ]);
    });

    it('extracts <Translate> text as translated usages', () => {
      const usages = extractUsages(`const x = <Translate>Save changes</Translate>;`, file);

      expect(usages).toEqual([
        expect.objectContaining({
          kind: 'translate-jsx',
          key: 'Save changes',
          translated: true,
        }),
      ]);
    });

    it('uses translationKey when present', () => {
      const usages = extractUsages(
        `const x = <Translate translationKey="save">Save</Translate>;`,
        file
      );

      expect(usages[0]).toMatchObject({ key: 'save', text: 'Save', translated: true });
    });

    it('ignores t() calls for non-System contexts (entity / template translations)', () => {
      const usages = extractUsages(
        `t('template-id', 'Title', null, false); t('System', 'Library', null, false);`,
        file
      );

      expect(usages.map(usage => usage.key)).toEqual(['Library']);
    });
  });

  describe('JSX text', () => {
    it('flags hardcoded JSX text that is not wrapped in Translate', () => {
      const usages = byKind(`const x = <button>Close modal</button>;`, 'jsx-text');

      expect(usages).toEqual([
        expect.objectContaining({
          text: 'Close modal',
          key: 'Close modal',
          translated: false,
          fixable: true,
        }),
      ]);
    });

    it('ignores whitespace-only and non-letter JSX text', () => {
      expect(texts(`const x = <span>  </span>;`)).toEqual([]);
      expect(texts(`const x = <span>123</span>;`)).toEqual([]);
    });
  });

  describe('native attributes', () => {
    it('flags literal aria-label / placeholder / alt', () => {
      const source = `
        const x = (
          <div>
            <button aria-label="Close modal" />
            <input placeholder="Search" />
            <img alt="Default file" />
          </div>
        );
      `;

      expect(
        byKind(source, 'attribute')
          .map(usage => usage.text)
          .sort()
      ).toEqual(['Close modal', 'Default file', 'Search']);
      expect(byKind(source, 'attribute').every(usage => usage.fixable)).toBe(true);
    });

    it('flags native HTML title tooltips, not already-translated attributes', () => {
      const source = `
        const x = (
          <div>
            <button title="Toggle dark theme" />
            <button aria-label={t('System', 'Close modal', null, false)} />
          </div>
        );
      `;

      expect(byKind(source, 'attribute').map(usage => usage.text)).toEqual(['Toggle dark theme']);
      expect(byKind(source, 't-call').map(usage => usage.key)).toEqual(['Close modal']);
    });

    it('does not flag member expressions such as entity titles', () => {
      const source = `
        const x = (
          <h1 title={entity.title} no-translate="true">
            <span>{entity.title}</span>
          </h1>
        );
      `;

      expect(extractUsages(source, file)).toEqual([]);
    });

    it('does not flag identifier-like attributes, brand tokens, confirm() copy or entity records', () => {
      const source = `
        const x = (
          <>
            <img title="HURIDOCS" alt="uwazi" />
            <input aria-label="fileInput" />
            <span>&times;</span>
          </>
        );
        confirm({ title: 'Delete', message: 'Are you sure?' });
        const entity = { title: 'Document 1', sharedId: 'abc', template: 't1' };
      `;

      expect(extractUsages(source, file).filter(usage => !usage.translated)).toEqual([]);
    });
  });

  describe('component props vs user content', () => {
    it('flags literal label/title props on unsafe components', () => {
      const source = `
        const x = (
          <>
            <Select label="Operator" />
            <Card title="Data" />
          </>
        );
      `;

      expect(
        byKind(source, 'component-prop')
          .map(usage => usage.text)
          .sort()
      ).toEqual(['Data', 'Operator']);
      expect(byKind(source, 'component-prop').every(usage => usage.fixable)).toBe(false);
    });

    it('does not flag title on SettingsContent or SettingsContent.Header (safe wrappers)', () => {
      expect(
        extractUsages(`const x = <SettingsContent title="Data visualizations" />;`, file)
      ).toEqual([]);
      expect(
        extractUsages(`const x = <SettingsContent.Header title="Data visualizations" />;`, file)
      ).toEqual([]);
    });

    it('flags Tooltip content literals', () => {
      const source = `const x = <Tooltip content="This table of contents was automatically created by the system." />;`;
      expect(byKind(source, 'component-prop').map(usage => usage.text)).toEqual([
        'This table of contents was automatically created by the system.',
      ]);
    });
  });

  describe('option / status maps', () => {
    it('flags object-literal UI labels', () => {
      const source = `
        const propertyTypeOptions = [
          { value: 'text', label: 'Text' },
          { value: 'markdown', label: 'Rich text' },
        ];
        const columns = [{ id: 'name', header: 'File name' }];
      `;

      expect(
        byKind(source, 'option-label')
          .map(usage => usage.text)
          .sort()
      ).toEqual(['File name', 'Rich text', 'Text']);
      expect(byKind(source, 'option-label').every(usage => usage.fixable)).toBe(false);
    });

    it('flags string literals assigned to UI label variables', () => {
      const source = `
        const label = themeMode === 'light' ? 'Toggle dark theme' : 'Toggle light theme';
      `;
      expect(
        byKind(source, 'option-label')
          .map(usage => usage.text)
          .sort()
      ).toEqual(['Toggle dark theme', 'Toggle light theme']);
    });

    it('does not flag data fields such as entity default names', () => {
      const source = `const draft = { name: 'Untitled visualization', template: entity.template };`;
      expect(extractUsages(source, file)).toEqual([]);
    });

    it('does not flag labels that come from entity / template data', () => {
      const source = `const option = { label: property.label, title: entity.title };`;
      expect(extractUsages(source, file)).toEqual([]);
    });
  });

  describe('notify / toasts', () => {
    it('flags literal notify() / notifyBridge() messages', () => {
      const source = `
        notify('Document updated', 'success');
        notifyBridge('An error occurred', 'error');
        notificationActions.notify('Connection deleted', 'success');
        notify(t('System', 'Saved', null, false), 'success');
      `;

      expect(
        byKind(source, 'notify')
          .map(usage => usage.text)
          .sort()
      ).toEqual(['An error occurred', 'Connection deleted', 'Document updated']);
      expect(byKind(source, 'notify').every(usage => usage.fixable)).toBe(true);
    });
  });

  describe('no-translate', () => {
    it('skips entire subtrees marked no-translate, including attributes', () => {
      const source = `
        const x = (
          <div no-translate="true">
            <span>Beta panel</span>
            <button aria-label="New Relationships" />
          </div>
        );
      `;

      expect(extractUsages(source, file)).toEqual([]);
    });
  });
});

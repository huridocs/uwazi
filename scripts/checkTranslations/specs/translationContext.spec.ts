import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  CONTEXT_HEADER,
  addContextStubs,
  inferComponent,
  inferView,
  loadTranslationContext,
  type TranslationContextRow,
} from '../translationContext.js';
import type { Finding } from '../types.js';

const finding = (input: Partial<Finding> & Pick<Finding, 'kind' | 'key' | 'file'>): Finding => ({
  severity: 'warning',
  text: input.key,
  fixable: true,
  ...input,
});

const APPEND_STUBS: TranslationContextRow[] = [
  {
    key: 'Save',
    component: 'UI text',
    view: 'Settings > Account',
    context: 'should not replace',
    doNotTranslate: false,
  },
  {
    key: 'Done',
    component: 'UI text',
    view: 'Library',
    context:
      'Used in app/react/Widget.tsx. Replace this stub with a one-line meaning before translating.',
    doNotTranslate: false,
  },
  {
    key: 'Uwazi',
    component: 'UI text',
    view: 'Settings > Theme and branding',
    context: 'Used in Theme.tsx.',
    doNotTranslate: true,
  },
];

const expectAppendedStubs = async (file: string, added: string[]) => {
  expect(added).toEqual(['Done', 'Uwazi']);
  const content = await readFile(file, 'utf8');
  expect(content).toContain('Key,Component,View,Context,DoNotTranslate');
  expect(content).toContain('Save,Button label,Library,Saves the current entity.');
  expect(content).not.toContain('should not replace');
  expect(content).toContain('Uwazi,UI text,Settings > Theme and branding,Used in Theme.tsx.,true');
  const rows = await loadTranslationContext(file);
  expect(rows.find(row => row.key === 'Save')?.context).toBe('Saves the current entity.');
  expect(rows.find(row => row.key === 'Done')?.component).toBe('UI text');
};

describe('inferComponent', () => {
  it('maps finding kinds onto the closed Component taxonomy', () => {
    expect(
      inferComponent(finding({ kind: 'untranslated-notify', key: 'Saved', file: 'a.tsx' }))
    ).toBe('Toast notification');
    expect(
      inferComponent(
        finding({
          kind: 'untranslated-attribute',
          key: 'Name',
          file: 'a.tsx',
          attrName: 'placeholder',
        })
      )
    ).toBe('Placeholder');
    expect(
      inferComponent(
        finding({
          kind: 'untranslated-attribute',
          key: 'Close',
          file: 'a.tsx',
          attrName: 'aria-label',
        })
      )
    ).toBe('Accessible label');
    expect(
      inferComponent(finding({ kind: 'untranslated-label', key: 'Text', file: 'a.tsx' }))
    ).toBe('Option label');
    expect(
      inferComponent(finding({ kind: 'unwrapped-jsx-text', key: 'Done', file: 'a.tsx' }))
    ).toBe('UI text');
    expect(inferComponent(finding({ kind: 'missing-key', key: 'Library', file: 'a.tsx' }))).toBe(
      'UI text'
    );
  });
});

describe('inferView', () => {
  it('maps known route folders to translator View labels', () => {
    expect(inferView('app/react/V2/Routes/Settings/Account/Account.tsx')).toBe(
      'Settings > Account'
    );
    expect(inferView('app/react/V2/Routes/Settings/IX/IXDashboard.tsx')).toBe(
      'Settings > Metadata extraction'
    );
    expect(inferView('app/react/V2/Routes/Library/Library.tsx')).toBe('Library');
    expect(inferView('app/react/V2/Routes/Entity/Entity.tsx')).toBe('Entity view');
    expect(inferView('app/react/V2/Components/UI/Modal.tsx')).toBe('Unresolved');
  });
});

describe('translation context CSV', () => {
  const makeFixture = async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'translation-context-'));
    const file = path.join(root, 'contents', 'translation-context.csv');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      'Key,Component,View,Context\nSave,Button label,Library,Saves the current entity.\n'
    );
    return { root, file };
  };

  it('reads four-column files and treats missing DoNotTranslate as false', async () => {
    const { file } = await makeFixture();
    const rows = await loadTranslationContext(file);
    expect(rows).toEqual([
      {
        key: 'Save',
        component: 'Button label',
        view: 'Library',
        context: 'Saves the current entity.',
        doNotTranslate: false,
      },
    ]);
  });

  it('appends stubs for new keys and does not overwrite existing rows', async () => {
    const { file } = await makeFixture();
    const added = await addContextStubs(file, APPEND_STUBS);
    await expectAppendedStubs(file, added);
  });

  it('creates the context file when it does not exist', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'translation-context-missing-'));
    const file = path.join(root, 'translation-context.csv');
    const added = await addContextStubs(file, [
      {
        key: 'Done',
        component: 'UI text',
        view: 'Unresolved',
        context: 'Used in Widget.tsx.',
        doNotTranslate: false,
      },
    ]);
    expect(added).toEqual(['Done']);
    const content = await readFile(file, 'utf8');
    expect(content).toContain(CONTEXT_HEADER);
    expect(content).toContain('Done,UI text,Unresolved,Used in Widget.tsx.,false');
  });
});

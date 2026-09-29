import React from 'react';
import preview from '#storybook/preview';
import { Provider, createStore } from 'jotai';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { EntityTypeChip } from '#V2/Components/UI/EntityTypeChip.js';
import { templates, translations } from '../../fixtures/referencesFixtures.js';

const EntityTypeChipWithStore = ({ templateId }: { templateId: string }) => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);

  return (
    <Provider store={store}>
      <div className="tw-content flex items-center gap-3 p-4">
        <EntityTypeChip templateId={templateId} />
        <span className="text-sm font-medium text-ink">Pávez Pávez. Audiencia del 13 de abril</span>
      </div>
    </Provider>
  );
};

const meta = preview.meta({
  title: 'Components/UI/EntityTypeChip',
  component: EntityTypeChipWithStore,
});

const Documents = meta.story({
  args: { templateId: 'template1' },
});

const Person = meta.story({
  args: { templateId: 'template2' },
});

const Country = meta.story({
  args: { templateId: 'template3' },
});

export { Documents, Person, Country };

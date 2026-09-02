import React from 'react';
import preview from '#storybook/preview';
import { Provider, createStore } from 'jotai';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { templates, translations } from '../../fixtures/referencesFixtures.js';

const TemplatePillWithStore = ({ templateId, label }: { templateId: string; label?: string }) => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);

  return (
    <Provider store={store}>
      <div className="tw-content p-4">
        <TemplatePill templateId={templateId} label={label} />
      </div>
    </Provider>
  );
};

const meta = preview.meta({
  title: 'Components/UI/TemplatePill',
  component: TemplatePillWithStore,
});

const WithCustomLabel = meta.story({
  args: {
    templateId: 'template2',
    label: 'Person',
  },
});

const WithTemplateName = meta.story({
  args: {
    templateId: 'template3',
  },
});
export { WithCustomLabel, WithTemplateName };

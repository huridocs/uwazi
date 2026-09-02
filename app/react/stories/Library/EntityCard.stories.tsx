import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { Provider, createStore } from 'jotai';
import { localeAtom, settingsAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';
import { EntityCard } from '#V2/Routes/Library/Components/EntityCard.js';

const StoreShell = ({ children }: { children: React.ReactNode }) => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);
  store.set(settingsAtom, {});
  return (
    <BrowserRouter>
      <Provider store={store}>{children}</Provider>
    </BrowserRouter>
  );
};

const InteractiveCard = ({ layout, selected }: { layout: 'cards' | 'list'; selected: boolean }) => {
  const [isSelected, setSelected] = useState(selected);
  return (
    <div className="tw-content max-w-sm p-4">
      <EntityCard
        title="The State v. Example"
        templateId="template1"
        fields={[
          { id: 'country', label: 'Country', value: 'Spain' },
          { id: 'year', label: 'Year', value: '2021' },
          { id: 'language', label: 'Language', value: 'EN' },
        ]}
        thumbnailKind="document"
        layout={layout}
        selected={isSelected}
        onSelect={() => setSelected(current => !current)}
        viewHref="/entityv2/abc"
      />
    </div>
  );
};

const meta: Meta<typeof InteractiveCard> = {
  title: 'Library/EntityCard',
  component: InteractiveCard,
  decorators: [
    Story => (
      <StoreShell>
        <Story />
      </StoreShell>
    ),
  ],
};

type Story = StoryObj<typeof InteractiveCard>;

const Cards: Story = {
  args: { layout: 'cards', selected: false },
};

const CardsSelected: Story = {
  args: { layout: 'cards', selected: true },
};

const List: Story = {
  args: { layout: 'list', selected: false },
  decorators: [
    Story => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

const WithoutThumbnail: Story = {
  render: () => (
    <div className="tw-content max-w-sm p-4">
      <EntityCard
        title="Person without files"
        templateId="template2"
        fields={[{ id: 'country', label: 'Country', value: 'France' }]}
        layout="cards"
        viewHref="/entityv2/person-1"
      />
    </div>
  ),
};

export default meta;
export { Cards, CardsSelected, List, WithoutThumbnail };

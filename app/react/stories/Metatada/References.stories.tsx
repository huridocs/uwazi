import React, { useMemo } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { localeAtom, settingsAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { apiEntity, templates } from '../fixtures/MetadataDisplayFixtures.js';
import { Entity, MetadataSchema } from '#V2/api/entities/types.js';
import { PDF } from '#V2/Components/PDFViewer/index.js';

const ReferencesDisplayComponent = () => {
  //   const store = createStore();
  //   store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });
  //   store.set(templatesAtom, templates);
  //   store.set(localeAtom, locale);
  //   store.set(translationsAtom, [
  //     {
  //       locale: 'en',
  //       contexts: [
  //         {
  //           id: 'System',
  //           label: 'User Interface',
  //           type: 'Uwazi UI',
  //           values: { 'Grouped geolocation properties': 'Grouped geolocation properties' },
  //         },
  //       ],
  //     },
  //     {
  //       locale: 'es',
  //       contexts: [
  //         {
  //           id: 'System',
  //           label: 'User Interface',
  //           type: 'Uwazi UI',
  //           values: { 'Grouped geolocation properties': 'Propiedades agrupadas de geolocalización' },
  //         },
  //       ],
  //     },
  //   ]);

  const a = '';

  return (
    <div className="tw-content h-screen">
      <BrowserRouter>
        {/* <Provider store={store}> */}
        <div className="flex flex-col gap-4 w-full h-full">
          <div>
            <p>References</p>
            <p>Current page: {0}</p>
          </div>
          <div className="flex flex-row gap-4 flex-1 overflow-hidden min-h-0">
            <div className="w-5/6 overflow-y-auto">
              <PDF fileUrl="/sample.pdf" />
            </div>
            <div className="w-1/6">
              <span>test</span>
            </div>
          </div>
        </div>
        {/* </Provider> */}
      </BrowserRouter>
    </div>
  );
};

const meta: Meta<typeof ReferencesDisplayComponent> = {
  title: 'Metadata/ReferencesDisplay',
  component: ReferencesDisplayComponent,
};

type Story = StoryObj<typeof ReferencesDisplayComponent>;

const Primary: Story = {
  render: args => <ReferencesDisplayComponent />,
};

const Basic: Story = {
  ...Primary,
  args: {},
};

export default meta;
export { Basic };

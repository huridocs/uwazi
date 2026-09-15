/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { render, screen } from '@testing-library/react';
import { getStore } from '#shared/atomStore/index.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { TemplatePill } from '../TemplatePill.js';

const templates: ClientTemplateSchema[] = [
  {
    _id: 'template-country',
    name: 'Country',
    color: '#2b8a3e',
    default: false,
  },
];

const translations = [
  {
    locale: 'es',
    contexts: [
      {
        id: 'template-country',
        label: 'Country',
        values: { Country: 'País' },
      },
    ],
  },
];

describe('TemplatePill', () => {
  const atomStore = getStore();

  beforeEach(() => {
    atomStore.set(localeAtom, 'es');
    atomStore.set(templatesAtom, templates);
    atomStore.set(translationsAtom, translations);
  });

  it('sets a translated native title from the template name', () => {
    render(
      <Provider store={atomStore}>
        <TemplatePill templateId="template-country" />
      </Provider>
    );

    expect(screen.getByTitle('País')).toBeInTheDocument();
    expect(screen.queryByTitle('Country')).not.toBeInTheDocument();
  });
});

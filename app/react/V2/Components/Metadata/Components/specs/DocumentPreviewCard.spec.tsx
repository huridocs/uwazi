/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { DocumentPreviewCard } from '../DocumentPreviewCard';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

const settings = {
  languages: [
    { key: 'en', label: 'English', default: true },
    { key: 'es', label: 'Spanish' },
  ],
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 'tmpl1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  documents: [
    {
      _id: 'doc-1',
      filename: 'judgment.pdf',
      originalname: 'Velasquez.pdf',
      mimetype: 'application/pdf',
      size: 218112,
      creationDate: 1710460800,
      language: 'eng',
    },
  ],
};

const previewField = (src: string, label = 'Preview'): MetadataProperty => ({
  _id: 'p-preview',
  name: 'preview',
  label,
  type: 'preview',
  style: 'cover',
  values: [{ value: src, alt: 'preview' }],
});

const renderCard = (entityOverride: Entity = entity, preview?: MetadataProperty, locale = 'en') =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, locale],
        [settingsAtom, settings],
      ]}
    >
      <DocumentPreviewCard entity={entityOverride} previewField={preview} />
    </TestAtomStoreProvider>
  );

describe('DocumentPreviewCard', () => {
  it('shows the property label, thumbnail, and file actions without file facts', () => {
    renderCard(entity, previewField('/api/files/custom-preview.png', 'Preview of the file'));

    expect(screen.getByRole('heading', { name: 'Preview of the file' })).toBeVisible();
    expect(screen.queryByText('NAME')).toBeNull();
    expect(screen.queryByText('TYPE')).toBeNull();
    expect(screen.queryByText('SIZE')).toBeNull();
    expect(screen.queryByText('ADDED')).toBeNull();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/api/files/judgment.pdf'
    );
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      '/api/files/judgment.pdf?download=true'
    );
    expect(screen.getByRole('img', { name: 'Velasquez.pdf' }).className).toContain('h-full');
    expect(screen.getByRole('img', { name: 'Velasquez.pdf' }).parentElement?.className).toContain(
      'min-h-32'
    );
  });

  it('shows file thumbnail when preview image fails to load', () => {
    renderCard(entity, previewField('/api/files/custom-preview.png'));

    const thumb = screen.getByRole('img', { name: 'Velasquez.pdf' });
    expect(thumb).toHaveAttribute('src', '/api/files/custom-preview.png');
    fireEvent.error(thumb);

    expect(screen.getByRole('img', { name: 'Velasquez.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-1.jpg'
    );
  });

  it('shows default-language document when entity language has no file', () => {
    const multilingual: Entity = {
      ...entity,
      language: 'fr',
      documents: [
        {
          _id: 'doc-es',
          filename: 'es.pdf',
          originalname: 'Spanish.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1710460800,
          language: 'spa',
        },
        {
          _id: 'doc-en',
          filename: 'en.pdf',
          originalname: 'English.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: 1710460800,
          language: 'eng',
        },
      ],
    };

    renderCard(multilingual, undefined, 'es');

    expect(screen.getByRole('img', { name: 'English.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-en.jpg'
    );
  });

  it('shows document matching entity language over route locale', () => {
    const multilingual: Entity = {
      ...entity,
      language: 'es',
      documents: [
        {
          _id: 'doc-es',
          filename: 'es.pdf',
          originalname: 'Spanish.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1710460800,
          language: 'spa',
        },
        {
          _id: 'doc-en',
          filename: 'en.pdf',
          originalname: 'English.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: 1710460800,
          language: 'eng',
        },
      ],
    };

    renderCard(multilingual, undefined, 'en');

    expect(screen.getByRole('img', { name: 'Spanish.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-es.jpg'
    );
  });

  it('ignores non-ready documents when selecting the main document', () => {
    const withProcessing: Entity = {
      ...entity,
      documents: [
        {
          _id: 'processing',
          filename: 'busy.pdf',
          originalname: 'Busy.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1710460800,
          language: 'eng',
          status: 'processing',
        },
        {
          _id: 'ready',
          filename: 'ready.pdf',
          originalname: 'Ready.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: 1710460800,
          language: 'eng',
          status: 'ready',
        },
      ],
    };

    renderCard(withProcessing);

    expect(screen.getByRole('img', { name: 'Ready.pdf' })).toHaveAttribute(
      'src',
      '/api/files/ready.jpg'
    );
  });
});

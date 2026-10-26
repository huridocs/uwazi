/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { localeAtom, templatesAtom, thesauriAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import { LibraryCreateEntityPanel } from '../LibraryCreateEntityPanel.js';

jest.mock('#shared/IDGenerator', () => ({
  generateID: () => 'GEN-ID',
}));

const savedEntity = (title: string) => ({
  _id: 'n1',
  sharedId: 'created-1',
  title,
  template: 'template1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
});

type CommonProperties = NonNullable<(typeof templates)[number]['commonProperties']>;

const flagTitle = (commonProperties: CommonProperties, generatedId: boolean): CommonProperties => {
  const [first, ...rest] = commonProperties;
  return first.name === 'title' ? [{ ...first, generatedId }, ...rest] : commonProperties;
};

const withGeneratedTitle = () =>
  templates.map(template =>
    template.default && template.commonProperties
      ? { ...template, commonProperties: flagTitle(template.commonProperties, true) }
      : template
  );

const withGeneratedIdProperty = () =>
  templates.map(template =>
    template.default && template.commonProperties
      ? {
          ...template,
          properties: [
            {
              name: 'generatedid',
              label: 'Generatedid',
              type: 'generatedid',
            } satisfies PropertySchema,
          ],
          commonProperties: flagTitle(template.commonProperties, false),
        }
      : template
  );

const renderCreatePanel = ({
  upsert,
  onCreated = jest.fn(),
  onClose = jest.fn(),
  templateList = templates,
}: {
  upsert: jest.Mock;
  onCreated?: jest.Mock;
  onClose?: jest.Mock;
  templateList?: typeof templates;
}) =>
  render(
    <ServicesProvider value={createTestServices({ entities: { upsert } })}>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templateList],
          [thesauriAtom, []],
          [translationsAtom, translations],
        ]}
      >
        <LibraryCreateEntityPanel onClose={onClose} onCreated={onCreated} />
      </TestAtomStoreProvider>
    </ServicesProvider>
  );

const renderPanel = (upsert: jest.Mock, onCreated = jest.fn(), onClose = jest.fn()) =>
  renderCreatePanel({ upsert, onCreated, onClose });

const expectEmptyCreateForm = () => {
  expect(screen.getByTestId('library-create-entity')).toBeInTheDocument();
  expect(screen.getByText('New entity')).toBeInTheDocument();
  expect(screen.getByLabelText(/Title/)).toHaveValue('');
};

const readSavedPayload = async (upsert: jest.Mock) => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => {
    expect(upsert).toHaveBeenCalled();
  });
  const [[payload]] = upsert.mock.calls;
  return payload;
};

const expectCreatedPayload = (upsert: jest.Mock, onCreated: jest.Mock) => {
  const [[payload]] = upsert.mock.calls;
  expect(payload._id).toBeUndefined();
  expect(payload.sharedId).toBeUndefined();
  expect(payload.title).toBe('Paella');
  expect(onCreated).toHaveBeenCalledWith('created-1');
};

describe('LibraryCreateEntityPanel', () => {
  it('saves a new entity without an existing id and selects it', async () => {
    const upsert = jest.fn().mockResolvedValue([savedEntity('Paella'), undefined]);
    const onCreated = jest.fn();
    renderPanel(upsert, onCreated);
    expectEmptyCreateForm();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(upsert).toHaveBeenCalled();
    });
    expectCreatedPayload(upsert, onCreated);
  });

  it('shows a generated title and saves that same string', async () => {
    const upsert = jest.fn().mockResolvedValue([savedEntity('GEN-ID'), undefined]);
    renderCreatePanel({ upsert, templateList: withGeneratedTitle() });
    const title = screen.getByLabelText(/Title/);
    expect(title).toHaveValue('GEN-ID');
    expect(title).toBeEnabled();
    const payload = await readSavedPayload(upsert);
    expect(payload.title).toBe('GEN-ID');
  });

  it('shows a generated id property and saves that same string', async () => {
    const upsert = jest.fn().mockResolvedValue([savedEntity(''), undefined]);
    renderCreatePanel({ upsert, templateList: withGeneratedIdProperty() });
    expect(screen.getByLabelText(/Title/)).toHaveValue('');
    const generatedId = screen.getByLabelText(/Generatedid/);
    expect(generatedId).toHaveValue('GEN-ID');
    expect(generatedId).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
    const payload = await readSavedPayload(upsert);
    expect(payload.title).toBe('Paella');
    expect(payload.metadata.generatedid).toEqual([{ value: 'GEN-ID' }]);
  });
});

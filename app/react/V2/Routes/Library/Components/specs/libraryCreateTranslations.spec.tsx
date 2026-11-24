/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  thesauriAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { TestRouterContext } from '#V2/testing/index.js';
import { LibraryCreateEntityPanel } from '../LibraryCreateEntityPanel.js';

const savedEntity = (title: string) => ({
  _id: 'n1',
  sharedId: 'created-1',
  title,
  template: 'template1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
});

const translatedRow = (value: string) => ({
  ...savedEntity('Paella'),
  translations: { es: { title: [{ value }] } },
});

type CreatedRow = ReturnType<typeof translatedRow>;

const installedLanguages = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
];

const renderCreate = async (getBySharedId: jest.Mock = jest.fn()) => {
  const upsert = jest.fn().mockResolvedValue([savedEntity('Paella'), undefined]);
  const onCreated = jest.fn();
  const view = render(
    <ServicesProvider value={createTestServices({ entities: { upsert, getBySharedId } })}>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [thesauriAtom, []],
          [translationsAtom, translations],
          [settingsAtom, { languages: installedLanguages }],
        ]}
      >
        <TestRouterContext>
          <LibraryCreateEntityPanel onClose={jest.fn()} onCreated={onCreated} />
        </TestRouterContext>
      </TestAtomStoreProvider>
    </ServicesProvider>
  );
  expect(await screen.findByTestId('library-create-entity')).toBeInTheDocument();
  return { upsert, onCreated, view, getBySharedId };
};

const savePaella = async () => {
  jest.useFakeTimers();
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
};

const advance = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

const expectWaiting = (getBySharedId: jest.Mock, onCreated: jest.Mock) => {
  expect(onCreated).not.toHaveBeenCalled();
  expect(getBySharedId).not.toHaveBeenCalled();
};

const expectCreated = (onCreated: jest.Mock) => {
  expect(onCreated).toHaveBeenCalledTimes(1);
  expect(onCreated).toHaveBeenCalledWith(
    'created-1',
    expect.objectContaining({ sharedId: 'created-1', title: 'Paella' })
  );
};

const openLanguages = () => {
  fireEvent.click(screen.getAllByRole('button', { name: /Languages:/ })[0]);
};

const expectSaveLocked = (upsert: jest.Mock, onCreated: jest.Mock) => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(upsert).toHaveBeenCalledTimes(1);
  expect(onCreated).not.toHaveBeenCalled();
};

const expectPanelHeld = (getBySharedId: jest.Mock, onCreated: jest.Mock, upsert: jest.Mock) => {
  expect(getBySharedId).toHaveBeenCalledTimes(3);
  expect(onCreated).not.toHaveBeenCalled();
  expect(screen.getByTestId('library-create-entity')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(upsert).toHaveBeenCalledTimes(1);
};

const expectPendingTitle = (getBySharedId: jest.Mock, onCreated: jest.Mock) => {
  expect(getBySharedId).toHaveBeenCalledTimes(2);
  expect(getBySharedId).toHaveBeenCalledWith('created-1', {
    language: 'en',
    omitRelationships: true,
  });
  expect(screen.getByLabelText(/Title/)).toHaveValue('Paella');
  openLanguages();
  expect(screen.getByDisplayValue('(AI translation pending) Hola')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  expect(onCreated).not.toHaveBeenCalled();
  expect(screen.getByTestId('library-create-entity')).toBeInTheDocument();
};

const deferredRead = () => {
  let resolveRead: (result: [CreatedRow[]]) => void = () => undefined;
  const getBySharedId = jest.fn(
    async () =>
      new Promise<[CreatedRow[]]>(resolve => {
        resolveRead = resolve;
      })
  );
  return {
    getBySharedId,
    finish: () => {
      resolveRead([[translatedRow('(AI translation pending) Late')]]);
    },
  };
};

describe('Library create pending translations', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the panel open and shows a pending translation from a later read', async () => {
    const getBySharedId = jest
      .fn()
      .mockResolvedValueOnce([[translatedRow('')]])
      .mockResolvedValueOnce([[translatedRow('(AI translation pending) Hola')]]);
    const { onCreated, upsert } = await renderCreate(getBySharedId);
    await savePaella();
    expectWaiting(getBySharedId, onCreated);
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(1);
    await advance(1000);
    expectPendingTitle(getBySharedId, onCreated);
    expectSaveLocked(upsert, onCreated);
  });

  it('closes after three reads that are still empty', async () => {
    const getBySharedId = jest.fn(async () => [[savedEntity('Paella')]]);
    const { onCreated } = await renderCreate(getBySharedId);
    await savePaella();
    expectWaiting(getBySharedId, onCreated);
    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(3);
    expectCreated(onCreated);
  });

  it('stays closed when the form is closed before the next read', async () => {
    const getBySharedId = jest.fn(async () => [[translatedRow('(AI translation pending) Late')]]);
    const { onCreated, view } = await renderCreate(getBySharedId);
    await savePaella();
    expectWaiting(getBySharedId, onCreated);
    view.unmount();
    await advance(3000);
    expect(getBySharedId).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.queryByTestId('library-create-entity')).not.toBeInTheDocument();
  });

  it('does not read again when a fetch finishes after the form is left', async () => {
    const read = deferredRead();
    const { onCreated, view } = await renderCreate(read.getBySharedId);
    await savePaella();
    await advance(1000);
    expect(read.getBySharedId).toHaveBeenCalledTimes(1);
    view.unmount();
    await act(async () => {
      read.finish();
      await jest.advanceTimersByTimeAsync(3000);
    });
    expect(read.getBySharedId).toHaveBeenCalledTimes(1);
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.queryByTestId('library-create-entity')).not.toBeInTheDocument();
  });

  it('stays open when the translation reads fail', async () => {
    const getBySharedId = jest.fn(async () => {
      throw new Error('offline');
    });
    const { upsert, onCreated } = await renderCreate(getBySharedId);
    await savePaella();
    await advance(1000);
    await advance(1000);
    await advance(1000);
    expectPanelHeld(getBySharedId, onCreated, upsert);
  });

  it('closes immediately when the create already sent every other language', async () => {
    const getBySharedId = jest.fn();
    const { upsert, onCreated } = await renderCreate(getBySharedId);
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
    openLanguages();
    fireEvent.change(screen.getByLabelText('Español title'), { target: { value: 'Hola' } });
    fireEvent.blur(screen.getByLabelText('Español title'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
    expect(getBySharedId).not.toHaveBeenCalled();
    expect(upsert.mock.calls[0][0].translations.es.title).toEqual([{ value: 'Hola' }]);
  });
});

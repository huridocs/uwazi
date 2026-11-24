/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAtomValue } from 'jotai';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  libraryEntityRevisionAtom,
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

const RevisionProbe = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  const revision = useAtomValue(libraryEntityRevisionAtom);
  const title = revision?.translations.es?.title?.[0]?.value;
  return (
    <div>
      <div data-testid="revision">{typeof title === 'string' ? title : ''}</div>
      <button type="button" onClick={() => setOpen(false)}>
        Leave create
      </button>
      {open ? children : null}
    </div>
  );
};

const renderCreate = async (
  getBySharedId: jest.Mock = jest.fn(),
  upsert: jest.Mock = jest.fn().mockResolvedValue([savedEntity('Paella'), undefined])
) => {
  const onCreated = jest.fn();
  const onNoted = jest.fn();
  const onClose = jest.fn();
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
          <RevisionProbe>
            <LibraryCreateEntityPanel onClose={onClose} onCreated={onCreated} onNoted={onNoted} />
          </RevisionProbe>
        </TestRouterContext>
      </TestAtomStoreProvider>
    </ServicesProvider>
  );
  expect(await screen.findByTestId('library-create-entity')).toBeInTheDocument();
  return { upsert, onCreated, onNoted, onClose, view, getBySharedId };
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

const expectNoted = (onNoted: jest.Mock) => {
  expect(onNoted).toHaveBeenCalledTimes(1);
  expect(onNoted).toHaveBeenCalledWith(
    'created-1',
    expect.objectContaining({ sharedId: 'created-1', title: 'Paella' })
  );
};

const expectCreated = (onCreated: jest.Mock, onNoted: jest.Mock) => {
  expect(onNoted).not.toHaveBeenCalled();
  expect(onCreated).toHaveBeenCalledTimes(1);
  expect(onCreated).toHaveBeenCalledWith(
    'created-1',
    expect.objectContaining({ sharedId: 'created-1', title: 'Paella' })
  );
};

const openLanguages = () => {
  fireEvent.click(screen.getAllByRole('button', { name: /Languages:/ })[0]);
};

const readAgain = async (reads: jest.Mock, count: number) => {
  await advance(1000);
  expect(reads).toHaveBeenCalledTimes(count);
};

const expectRevision = (title: string) => {
  expect(screen.getByTestId('revision')).toHaveTextContent(title);
};

const pendingSave = () => {
  let resolveSave: (saved: [ReturnType<typeof savedEntity>, undefined]) => void = () => undefined;
  const upsert = jest.fn(async () => {
    return new Promise<[ReturnType<typeof savedEntity>, undefined]>(resolve => {
      resolveSave = resolve;
    });
  });
  return { upsert, finish: () => resolveSave([savedEntity('Paella'), undefined]) };
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

  it('closes the panel and records a pending translation from a later read', async () => {
    const getBySharedId = jest
      .fn()
      .mockResolvedValueOnce([[translatedRow('')]])
      .mockResolvedValueOnce([[translatedRow('(AI translation pending) Hola')]]);
    const { onCreated, onNoted } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    expect(getBySharedId).not.toHaveBeenCalled();
    await readAgain(getBySharedId, 1);
    expect(screen.getByTestId('revision')).toBeEmptyDOMElement();
    await readAgain(getBySharedId, 2);
    expectRevision('(AI translation pending) Hola');
  });

  it('keeps reading in the background when the other languages stay empty', async () => {
    const getBySharedId = jest.fn(async () => [[savedEntity('Paella')]]);
    const { onCreated, onNoted } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('revision')).toBeEmptyDOMElement();
  });

  it('keeps reading after the panel closes', async () => {
    const getBySharedId = jest.fn(async () => [[translatedRow('(AI translation pending) Late')]]);
    const { onCreated, onNoted, view } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    view.unmount();
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(1);
  });

  it('records a translation from a read that resolves later', async () => {
    const read = deferredRead();
    const { onCreated, onNoted } = await renderCreate(read.getBySharedId);
    await savePaella();
    await advance(1000);
    expect(read.getBySharedId).toHaveBeenCalledTimes(1);
    await act(async () => {
      read.finish();
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(read.getBySharedId).toHaveBeenCalledTimes(1);
    expectCreated(onCreated, onNoted);
    expectRevision('(AI translation pending) Late');
  });

  it('closes when a failed read is followed by empty reads', async () => {
    const getBySharedId = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([[savedEntity('Paella')]]);
    const { onCreated, onNoted } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(3);
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it('closes when the translation reads fail', async () => {
    const getBySharedId = jest.fn(async () => {
      throw new Error('offline');
    });
    const { upsert, onCreated, onNoted } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(getBySharedId).toHaveBeenCalledTimes(3);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('revision')).toBeEmptyDOMElement();
  });

  it('closes immediately when the create already sent every other language', async () => {
    const getBySharedId = jest.fn();
    const { upsert, onCreated, onNoted } = await renderCreate(getBySharedId);
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Paella' } });
    openLanguages();
    fireEvent.change(screen.getByLabelText('Español title'), { target: { value: 'Hola' } });
    fireEvent.blur(screen.getByLabelText('Español title'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
      expect(onNoted).not.toHaveBeenCalled();
    });
    expect(getBySharedId).not.toHaveBeenCalled();
    expect(upsert.mock.calls[0][0].translations.es.title).toEqual([{ value: 'Hola' }]);
  });

  it('notes the row when the panel closes before save finishes', async () => {
    const pending = pendingSave();
    const getBySharedId = jest.fn(async () => [[translatedRow('(AI translation pending) Late')]]);
    const { onCreated, onNoted } = await renderCreate(getBySharedId, pending.upsert);
    await savePaella();
    fireEvent.click(screen.getByRole('button', { name: 'Leave create' }));
    await act(async () => {
      pending.finish();
    });
    expectNoted(onNoted);
    await advance(1000);
    expectRevision('(AI translation pending) Late');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('closes on save without asking to discard changes', async () => {
    const getBySharedId = jest
      .fn()
      .mockResolvedValue([[translatedRow('(AI translation pending) Hola')]]);
    const { onCreated, onNoted, onClose } = await renderCreate(getBySharedId);
    await savePaella();
    expectCreated(onCreated, onNoted);
    expect(screen.queryByText(/Discard changes/)).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

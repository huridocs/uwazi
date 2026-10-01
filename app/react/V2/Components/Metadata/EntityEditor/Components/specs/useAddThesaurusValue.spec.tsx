/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { thesauriAtom } from '#V2/atoms/index.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { useAddThesaurusValue } from '../useAddThesaurusValue.js';

const mockUpsert = jest.fn();
const mockNotify = jest.fn();

jest.mock('#app/I18N/index.js', () => ({
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: mockNotify }),
}));

const thesaurus: ClientThesaurus = {
  _id: 'status',
  name: 'Estado',
  values: [
    { id: 'group', label: 'Group', values: [{ id: 'child', label: 'Child' }] },
    { id: 'idle', label: 'Idle' },
  ],
};

const renderAdd = (singleSelect: boolean, selectedIds: string[] = []) => {
  const store = createStore();
  store.set(thesauriAtom, [thesaurus]);
  const onApply = jest.fn();
  const hook = renderHook(
    () => useAddThesaurusValue({ thesaurus, singleSelect, selectedIds, onApply }),
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ServicesProvider value={createTestServices({ thesauri: { upsert: mockUpsert } })}>
          <Provider store={store}>{children}</Provider>
        </ServicesProvider>
      ),
    }
  );
  return { ...hook, onApply, store };
};

describe('useAddThesaurusValue', () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockNotify.mockReset();
  });

  it('selects a fold match and does not upsert', async () => {
    const { result, onApply } = renderAdd(true);
    await act(async () => {
      await result.current.save('  IDLE ');
    });
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalledWith(
      ['idle'],
      expect.objectContaining({ _id: 'status' }),
      new Set()
    );
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('creates a root value once, stores the server id, and updates the thesaurus atom', async () => {
    mockUpsert.mockResolvedValue([
      {
        _id: 'status',
        name: 'Estado',
        values: [
          { id: 'group', label: 'Group', values: [{ id: 'child', label: 'Child' }] },
          { id: 'idle', label: 'Idle' },
          { id: 'server-new', label: 'Fresh Value' },
        ],
      },
    ]);
    const { result, onApply, store } = renderAdd(false, ['idle']);
    await act(async () => {
      await result.current.save(' Fresh\nValue ');
    });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith({
      _id: 'status',
      name: 'Estado',
      values: [...thesaurus.values, { label: 'Fresh Value' }],
    });
    expect(store.get(thesauriAtom)[0]?.values).toEqual([
      { id: 'group', label: 'Group', values: [{ id: 'child', label: 'Child' }] },
      { id: 'idle', label: 'Idle' },
      { id: 'server-new', label: 'Fresh Value' },
    ]);
    expect(onApply).toHaveBeenCalledWith(
      ['idle', 'server-new'],
      expect.objectContaining({
        values: expect.arrayContaining([{ id: 'server-new', label: 'Fresh Value' }]),
      }),
      new Set(['server-new'])
    );
  });

  it('does not change the form when upsert fails', async () => {
    const { result, onApply, store } = renderAdd(true, ['idle']);
    mockUpsert.mockResolvedValue([undefined, new Error('fail')]);
    await act(async () => {
      await result.current.save('Fresh');
    });
    expect(onApply).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('error', 'Could not add thesaurus value');
    expect(store.get(thesauriAtom)).toEqual([thesaurus]);
  });

  it('does not change the form when the response has no id', async () => {
    const { result, onApply, store } = renderAdd(true, ['idle']);
    mockUpsert.mockResolvedValue([{ _id: 'status', name: 'Estado', values: thesaurus.values }]);
    await act(async () => {
      await result.current.save('Another');
    });
    expect(onApply).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('error', 'Could not add thesaurus value');
    expect(store.get(thesauriAtom)).toEqual([thesaurus]);
  });

  it('appends a value inside the chosen group and selects that server id', async () => {
    mockUpsert.mockResolvedValue([
      {
        _id: 'status',
        name: 'Estado',
        values: [
          {
            id: 'group',
            label: 'Group',
            values: [
              { id: 'child', label: 'Child' },
              { id: 'nepal', label: 'Nepal' },
            ],
          },
          { id: 'idle', label: 'Idle' },
        ],
      },
    ]);
    const { result, onApply } = renderAdd(true, ['idle']);
    await act(async () => {
      await result.current.save('Nepal', 'group');
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      _id: 'status',
      name: 'Estado',
      values: [
        {
          id: 'group',
          label: 'Group',
          values: [{ id: 'child', label: 'Child' }, { label: 'Nepal' }],
        },
        { id: 'idle', label: 'Idle' },
      ],
    });
    expect(onApply).toHaveBeenCalledWith(['nepal'], expect.anything(), new Set(['nepal']));
  });

  it('selects an existing value in the group instead of creating one', async () => {
    const { result, onApply } = renderAdd(false, ['idle']);
    await act(async () => {
      await result.current.save('child', 'group');
    });
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalledWith(['idle', 'child'], expect.anything(), new Set());
  });
});

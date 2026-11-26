/** @jest-environment jsdom */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { ApiError } from '#shared/apiClient/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { entity, renderSession } from './metadataTabSpecSetup.js';

describe('MetadataTab reload', () => {
  it('saves the user from the loaded entity', async () => {
    const loaded: Entity = {
      ...entity,
      title: 'Loaded title',
      user: 'fresh-user',
      editDate: 1704153600,
    };
    const getBySharedId = jest.fn().mockResolvedValue([[loaded]]);
    const upsert = jest.fn().mockResolvedValue([{ ...loaded, title: 'Loaded title' }, undefined]);
    const { getSession } = await renderSession(upsert, getBySharedId);

    await act(async () => {
      getSession().registerMetadataActive('main', true);
      getSession().startEditing('main');
    });

    await screen.findByDisplayValue('Loaded title');
    expect(getSession().editBase?.editDate).toBe(1704153600);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'fresh-user', editDate: 1704153600 }),
        expect.anything()
      );
    });
  });

  it('shows the load error on the metadata record', async () => {
    const getBySharedId = jest
      .fn()
      .mockResolvedValue([
        undefined,
        new ApiError('Could not load the entity', { kind: 'http', status: 500 }),
      ]);
    const { getSession } = await renderSession(jest.fn(), getBySharedId);

    await act(async () => {
      getSession().startEditing('main');
    });

    expect((await screen.findAllByRole('alert')).map(alert => alert.textContent)).toEqual([
      'Could not load the entity',
      'Could not load the entity',
    ]);
    expect(screen.getAllByTestId('metadata-record')).toHaveLength(2);
  });
});

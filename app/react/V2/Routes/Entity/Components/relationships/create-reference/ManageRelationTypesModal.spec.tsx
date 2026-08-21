/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider, useAtomValue } from 'jotai';
import type { ClientUserSchema, Template } from '#app/apiResponseTypes.js';
import { ApiError } from '#shared/apiClient/index.js';
import { relationshipTypesAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import {
  RelationshipsProvider,
  useRelationshipsActions,
} from '#V2/Routes/Entity/Components/context/RelationshipsContext.js';
import type { RelationshipTypesService } from '#V2/services/contracts/RelationshipTypesService.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestingServices } from '#V2/testing/createTestingServices.js';
import { ManageRelationTypesModal } from './ManageRelationTypesModal.js';

const adminUser: ClientUserSchema = {
  _id: '1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const inUseTemplate: Template = {
  _id: 'template1',
  name: 'Document',
  properties: [
    {
      _id: 'property1',
      name: 'related',
      label: 'Related',
      type: 'relationship',
      relationType: 'in-use',
    },
  ],
};

const NotificationsProbe = () => {
  const { notifications } = useAtomValue(requestStatusAtom);
  return (
    <div data-testid="notifications">
      {notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.type}`}>
          {notification.title}
        </div>
      ))}
    </div>
  );
};

const OpenManageOnMount = () => {
  const { openManageRelationTypes } = useRelationshipsActions();
  useEffect(() => {
    openManageRelationTypes();
  }, [openManageRelationTypes]);
  return null;
};

const renderManageModal = ({
  types = [
    { _id: 'related', name: 'Related' },
    { _id: 'in-use', name: 'Mentions' },
  ],
  templates = [inUseTemplate],
  refCounts = { related: 0, 'in-use': 0 },
  deleteImpl,
}: {
  types?: { _id: string; name: string }[];
  templates?: Template[];
  refCounts?: { [id: string]: number };
  deleteImpl?: RelationshipTypesService['delete'];
} = {}) => {
  const store = createStore();
  store.set(userAtom, adminUser);
  store.set(relationshipTypesAtom, types);
  store.set(templatesAtom, templates);
  const { services, relationshipTypes } = createTestingServices({
    initialRelationshipTypes: types,
    initialRelationTypeRefCounts: refCounts,
  });
  const countByTypes = jest.spyOn(relationshipTypes, 'countByTypes');
  const value = deleteImpl
    ? { ...services, relationshipTypes: { ...services.relationshipTypes, delete: deleteImpl } }
    : services;

  render(
    <Provider store={store}>
      <ServicesProvider value={value}>
        <RelationshipsProvider>
          <OpenManageOnMount />
          <ManageRelationTypesModal />
          <NotificationsProbe />
        </RelationshipsProvider>
      </ServicesProvider>
    </Provider>
  );

  return { countByTypes };
};

describe('ManageRelationTypesModal', () => {
  it('lists types, shows In use, and disables delete when a template uses the type', async () => {
    const user = userEvent.setup();
    const { countByTypes } = renderManageModal();

    expect(screen.getByRole('dialog', { name: 'Manage relationship types' })).toBeInTheDocument();
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Mentions')).toBeInTheDocument();
    expect(screen.getByText('In use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Mentions' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Related' })).toBeEnabled();
    await waitFor(() => {
      expect(countByTypes).toHaveBeenCalledTimes(1);
      expect(countByTypes).toHaveBeenCalledWith(['related', 'in-use'], {
        signal: expect.any(AbortSignal),
      });
      expect(screen.getAllByText('0 refs')).toHaveLength(2);
    });

    await user.hover(screen.getByRole('button', { name: 'Delete Mentions' }).parentElement!);
    expect(await screen.findByText('Used in templates — cannot delete')).toBeInTheDocument();
  });

  it('shows N refs and disables delete when the type is used in references', async () => {
    const user = userEvent.setup();
    renderManageModal({ templates: [], refCounts: { related: 3, 'in-use': 0 } });

    await waitFor(() => {
      expect(screen.getByText('3 refs')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Delete Related' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Mentions' })).toBeEnabled();
    expect(screen.queryByText('In use')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Delete Related' }).parentElement!);
    expect(await screen.findByText('Used in 3 refs — cannot delete')).toBeInTheDocument();
  });

  it('shows both metas and a combined tooltip when used in templates and refs', async () => {
    const user = userEvent.setup();
    renderManageModal({ refCounts: { related: 0, 'in-use': 2 } });

    await waitFor(() => {
      expect(screen.getByText('2 refs')).toBeInTheDocument();
    });
    expect(screen.getByText('In use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Mentions' })).toBeDisabled();

    await user.hover(screen.getByRole('button', { name: 'Delete Mentions' }).parentElement!);
    expect(
      await screen.findByText('Used in templates and 2 refs — cannot delete')
    ).toBeInTheDocument();
  });

  it('omits ref count and keeps trash enabled when the count request fails', async () => {
    const { countByTypes } = renderManageModal({
      types: [{ _id: 'related', name: 'Related' }],
      templates: [],
      refCounts: {},
    });

    await waitFor(() => {
      expect(countByTypes).toHaveBeenCalledTimes(1);
      expect(countByTypes).toHaveBeenCalledWith(['related'], { signal: expect.any(AbortSignal) });
    });
    expect(screen.queryByText(/\d+\s+refs?/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Related' })).toBeEnabled();
  });

  it('adds a type and shows duplicate copy', async () => {
    const user = userEvent.setup();
    renderManageModal({ types: [{ _id: 'related', name: 'Related' }], templates: [] });

    await user.type(screen.getByPlaceholderText('New relation type label…'), 'Related');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Already exists')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('New relation type label…'));
    await user.type(screen.getByPlaceholderText('New relation type label…'), 'Custom');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
    expect(screen.getByTestId('notification-success')).toHaveTextContent(
      'Added relation type "Custom"'
    );
  });

  it('confirms delete inline', async () => {
    const user = userEvent.setup();
    renderManageModal({ types: [{ _id: 'related', name: 'Related' }], templates: [] });

    await user.click(screen.getByRole('button', { name: 'Delete Related' }));
    expect(screen.getByRole('button', { name: 'Cancel deleting Related' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Related' }));
    await waitFor(() => {
      expect(screen.queryByText('Related')).not.toBeInTheDocument();
    });
  });

  it('does not open confirm when delete is disabled', async () => {
    const user = userEvent.setup();
    renderManageModal();

    await user.click(screen.getByRole('button', { name: 'Delete Mentions' }));
    expect(
      screen.queryByRole('button', { name: 'Cancel deleting Mentions' })
    ).not.toBeInTheDocument();
  });

  it('toasts API errors when delete is rejected', async () => {
    const user = userEvent.setup();
    renderManageModal({
      types: [{ _id: 'related', name: 'Related' }],
      templates: [],
      deleteImpl: async () => [
        undefined,
        new ApiError('Cannot delete', {
          kind: 'http',
          status: 400,
          detail: 'Cannot delete type used in relationships',
        }),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Delete Related' }));
    await user.click(screen.getByRole('button', { name: 'Delete Related' }));

    expect(await screen.findByTestId('notification-error')).toHaveTextContent(
      'Cannot delete type used in relationships'
    );
    expect(screen.getByText('Related')).toBeInTheDocument();
  });
});

/** @jest-environment jsdom */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAtomValue } from 'jotai';
import { ApiError } from '#shared/apiClient/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { deletedEntityAtom, userAtom } from '#V2/atoms/index.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { ServicesProvider } from '#V2/services/index.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { MetadataDisplayFooter } from '../MetadataDisplayFooter.js';

const mockNavigate = jest.fn();

jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

const DeletedProbe = () => {
  const deleted = useAtomValue(deletedEntityAtom);
  return <span data-testid="deleted-entity">{deleted}</span>;
};

const NotificationsProbe = () => {
  const { notifications } = useAtomValue(requestStatusAtom);
  return (
    <div data-testid="notifications">
      {notifications.map(notification => (
        <div
          key={notification.id}
          data-testid={`notification-${notification.type}`}
          data-details={notification.details ?? ''}
        >
          {notification.title}
        </div>
      ))}
    </div>
  );
};

const renderFooters = (deleteFn: jest.Mock) => {
  const services = createTestServices({ entities: { delete: deleteFn } });
  render(
    <TestRouterContext loaderData={{ entity, mainDocument: undefined, pagePlaintext: '' }}>
      <ServicesProvider value={services}>
        <TestAtomStoreProvider
          initialValues={[[userAtom, { _id: '1', role: 'admin', name: 'admin' }]]}
        >
          <EntityScopedProvider entity={entity} language="en">
            <DeletedProbe />
            <NotificationsProbe />
            <MetadataDisplayFooter host="side" />
            <MetadataDisplayFooter host="main" />
          </EntityScopedProvider>
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );
};

describe('MetadataDisplayFooter', () => {
  let invalidateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    invalidateSpy = jest.spyOn(entityLoaderCache, 'invalidateEntity');
  });

  afterEach(() => {
    invalidateSpy.mockRestore();
  });

  it('renders sibling Edit, Share, and Delete buttons per host', () => {
    renderFooters(jest.fn().mockResolvedValue([undefined]));
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Share' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
    expect(screen.queryByTestId('accept-button')).not.toBeInTheDocument();
  });

  it('opens a danger confirmation with locked copy and cancels without deleting', () => {
    const deleteFn = jest.fn().mockResolvedValue([undefined]);
    renderFooters(deleteFn);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getByText('Delete entity?')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this entity? This action cannot be undone.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('accept-button')).toHaveTextContent('Delete');
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(screen.queryByTestId('accept-button')).not.toBeInTheDocument();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('keeps confirmation per footer instance', () => {
    renderFooters(jest.fn().mockResolvedValue([undefined]));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getAllByTestId('accept-button')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('cancel-button'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(screen.getAllByTestId('accept-button')).toHaveLength(1);
  });

  it('deletes, notifies, invalidates, records the atom, and navigates away', async () => {
    const deleteFn = jest.fn().mockResolvedValue([undefined]);
    renderFooters(deleteFn);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByTestId('accept-button'));
    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledWith(['s1']);
    });
    expect(screen.getByTestId('notification-success')).toHaveTextContent('Entity deleted');
    expect(invalidateSpy).toHaveBeenCalledWith('s1');
    expect(screen.getByTestId('deleted-entity').textContent).toBe('s1');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shares in-flight across twin hosts so overlapping delete cannot run', async () => {
    let resolveDelete: (value: [undefined]) => void = () => undefined;
    const deleteFn = jest.fn(
      async () =>
        new Promise<[undefined]>(resolve => {
          resolveDelete = resolve;
        })
    );
    renderFooters(deleteFn);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    const accepts = screen.getAllByTestId('accept-button');
    expect(accepts).toHaveLength(2);
    fireEvent.click(accepts[0]);
    fireEvent.click(accepts[1]);
    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(1));
    screen.getAllByRole('button', { name: 'Edit' }).forEach(button => {
      expect(button).toBeDisabled();
    });
    screen.getAllByRole('button', { name: 'Share' }).forEach(button => {
      expect(button).toBeDisabled();
    });
    screen.getAllByRole('button', { name: 'Delete' }).forEach(button => {
      expect(button).toBeDisabled();
    });
    await act(async () => {
      resolveDelete([undefined]);
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });

  it('disables the modal while delete is in flight', async () => {
    let resolveDelete: (value: [undefined]) => void = () => undefined;
    const deleteFn = jest.fn(
      async () =>
        new Promise<[undefined]>(resolve => {
          resolveDelete = resolve;
        })
    );
    renderFooters(deleteFn);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByTestId('accept-button'));
    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('accept-button')).toBeDisabled();
    expect(screen.getByTestId('cancel-button')).toBeDisabled();
    await act(async () => {
      resolveDelete([undefined]);
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });

  it('notifies an error and stays on the page when delete fails', async () => {
    const deleteFn = jest
      .fn()
      .mockResolvedValue([
        undefined,
        new ApiError('failed', { kind: 'http', status: 500, detail: 'cannot delete' }),
      ]);
    renderFooters(deleteFn);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByTestId('accept-button'));
    await waitFor(() => {
      expect(screen.getByTestId('notification-error')).toHaveTextContent('An error occurred');
    });
    expect(screen.getByTestId('notification-error')).toHaveAttribute(
      'data-details',
      'cannot delete'
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('accept-button')).toBeInTheDocument();
  });
});

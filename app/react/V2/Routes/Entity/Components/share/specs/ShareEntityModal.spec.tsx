/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import * as api from '#app/Permissions/PermissionsAPI.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { userAtom } from '#V2/atoms/index.js';
import { EntityProvider } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import type { Entity } from '#V2/api/entities/types.js';
import { ShareEntityModal } from '../ShareEntityModal.js';

jest.mock('#app/Permissions/PermissionsAPI.js', () => ({
  loadGrantedPermissions: jest.fn(),
  searchCollaborators: jest.fn(),
  savePermissions: jest.fn(),
}));

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

const entity = {
  _id: 'e1',
  sharedId: 'shared-1',
  language: 'en',
  title: 'Case 123',
  template: 't1',
  creationDate: 1,
  user: 'u1',
  published: false,
} as Entity;

const granted: MemberWithPermission[] = [
  {
    refId: 'user-1',
    type: PermissionType.USER,
    label: 'admin',
    level: AccessLevels.WRITE,
  },
];

const renderModal = (role: 'admin' | 'collaborator' = 'admin', onClose = jest.fn()) => {
  const store = createStore();
  store.set(userAtom, {
    _id: 'current',
    role,
    username: 'current',
    email: 'current@example.com',
  });

  render(
    <Provider store={store}>
      <EntityProvider entity={entity}>
        <ShareEntityModal sharedIds={['shared-1']} onClose={onClose} />
      </EntityProvider>
    </Provider>
  );

  return { onClose };
};

describe('ShareEntityModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(api.loadGrantedPermissions).mockResolvedValue(granted);
    jest.mocked(api.savePermissions).mockResolvedValue({
      ids: ['shared-1'],
      permissions: [],
    });
  });

  it('loads members and shows close when pristine', async () => {
    renderModal();

    expect(await screen.findByText('admin')).toBeInTheDocument();
    expect(
      screen.getByText('Administrators and Editors always have edit access')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('adds a collaborator by exact lookup without a suggestions list', async () => {
    const user = userEvent.setup();
    jest.mocked(api.searchCollaborators).mockResolvedValue([
      {
        refId: 'user-2',
        type: PermissionType.USER,
        label: 'alice',
      },
    ]);

    renderModal();
    await screen.findByText('admin');

    const input = screen.getByPlaceholderText('Username, email or group');
    await user.type(input, 'alice');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(api.searchCollaborators).toHaveBeenCalledWith('alice');
    });
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('rejects prefix-only group matches and keeps focus in the lookup field', async () => {
    const user = userEvent.setup();
    jest.mocked(api.searchCollaborators).mockResolvedValue([
      {
        refId: 'group-1',
        type: PermissionType.GROUP,
        label: 'Reviewers',
      },
    ]);

    renderModal();
    await screen.findByText('admin');

    const input = screen.getByPlaceholderText('Username, email or group');
    await user.type(input, 'Rev');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('No user or group found')).toBeInTheDocument();
    expect(screen.queryByText('Reviewers')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('saves visibility and members', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await screen.findByText('admin');

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(api.savePermissions).toHaveBeenCalledWith({
        ids: ['shared-1'],
        permissions: [
          {
            refId: 'user-1',
            type: PermissionType.USER,
            level: AccessLevels.WRITE,
          },
          {
            refId: 'public',
            type: PermissionType.PUBLIC,
            level: AccessLevels.READ,
          },
        ],
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('hides general access controls for collaborators', async () => {
    renderModal('collaborator');
    await screen.findByText('admin');
    expect(screen.queryByRole('radiogroup', { name: 'General access' })).not.toBeInTheDocument();
  });

  it('shows an empty state when no people or groups are assigned', async () => {
    jest.mocked(api.loadGrantedPermissions).mockResolvedValue([]);
    renderModal();
    expect(await screen.findByText('No people or groups added yet')).toBeInTheDocument();
  });

  it('shows labeled access, status, and public tip only when switching to published', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText('admin');

    expect(screen.getByText('General access')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Private' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Published' })).toBeInTheDocument();
    expect(
      screen.getByText('Administrators and Editors always have edit access')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    expect(
      screen.getByText(/Caution: the selected entities will be|Anyone will be able to see them/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Published' })).toHaveAttribute(
      'aria-describedby',
      'share-public-caution'
    );
    expect(screen.queryByText('Anyone can see this entity')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Can see' })).not.toBeInTheDocument();

    await user.click(screen.getByText('People and groups'));
    expect(
      screen.queryByText(/Caution: the selected entities will be|Anyone will be able to see them/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText('Anyone can see this entity')).toBeInTheDocument();

    await user.hover(screen.getByRole('radio', { name: 'Published' }));
    expect(
      screen.queryByText(/Caution: the selected entities will be|Anyone will be able to see them/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText('Anyone can see this entity')).toBeInTheDocument();
  });

  it('shows lookup hint only after the info button is pressed', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText('admin');

    expect(
      screen.queryByText(/Enter the full username, email, or group name/)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lookup help' }));
    expect(screen.getByText(/Enter the full username, email, or group name/)).toBeInTheDocument();
  });

  it('discards changes without saving', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await screen.findByText('admin');

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(api.savePermissions).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when pristine close is clicked', async () => {
    const { onClose } = renderModal();
    await screen.findByText('admin');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('changes permission level with icon actions and removes members', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText('admin');

    const canSee = screen.getByRole('button', { name: 'Can see' });
    const canEdit = screen.getByRole('button', { name: 'Can edit' });
    expect(canEdit).toHaveAttribute('aria-pressed', 'true');

    await user.click(canSee);
    expect(canSee).toHaveAttribute('aria-pressed', 'true');
    expect(canEdit).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});

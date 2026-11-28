/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionType } from '#shared/types/permissionSchema.js';
import {
  expectAdded,
  expectFixedAccessRow,
  expectHeaderRow,
  expectMemberMarkAndClose,
  expectOneCollaborator,
  expectSegmentHeights,
  getPermissions,
  renderModal,
  resetPermissions,
  searchCollaborators,
  sectionLabel,
  typeAndAdd,
  typeLookup,
} from './shareEntityModalHarness.js';

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

describe('ShareEntityModal lookup', () => {
  beforeEach(resetPermissions);

  it('loads members and shows close when pristine', async () => {
    renderModal();

    expect(await screen.findByText('admin')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Permissions' })).toBeInTheDocument();
    expectHeaderRow();
    sectionLabel('General access');
    sectionLabel('People and groups');
    expectSegmentHeights();
    expectFixedAccessRow();
    expectMemberMarkAndClose();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('adds a collaborator by exact lookup without a suggestions list', async () => {
    const user = userEvent.setup();
    searchCollaborators.mockResolvedValue([
      [{ refId: 'user-2', type: PermissionType.USER, label: 'alice' }],
    ]);
    renderModal();
    await screen.findByText('admin');
    await typeLookup(user, 'alice');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(searchCollaborators).toHaveBeenCalledWith('alice');
    });
    await expectAdded('alice');
  });

  it('does not duplicate a collaborator when added again before re-render settles', async () => {
    const user = userEvent.setup();
    const alice = { refId: 'user-2', type: PermissionType.USER, label: 'alice' };
    searchCollaborators.mockResolvedValue([[alice]]);
    renderModal();
    await screen.findByText('admin');
    await typeAndAdd(user, 'alice');
    expect(await screen.findByText('alice')).toBeInTheDocument();
    await typeAndAdd(user, 'alice');
    await waitFor(() => {
      expect(searchCollaborators).toHaveBeenCalledTimes(2);
    });
    expectOneCollaborator('alice');
  });

  it('rejects prefix-only group matches and keeps focus in the lookup field', async () => {
    const user = userEvent.setup();
    searchCollaborators.mockResolvedValue([
      [{ refId: 'group-1', type: PermissionType.GROUP, label: 'Reviewers' }],
    ]);
    renderModal();
    await screen.findByText('admin');
    const input = await typeAndAdd(user, 'Rev');
    expect(await screen.findByText('No user or group found')).toBeInTheDocument();
    expect(screen.queryByText('Reviewers')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('does not reload permissions when sharedIds content is unchanged', async () => {
    const { rerenderWithSharedIds } = renderModal();
    await screen.findByText('admin');
    expect(getPermissions).toHaveBeenCalledTimes(1);
    rerenderWithSharedIds(['shared-1']);
    await waitFor(() => {
      expect(getPermissions).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('rejects multiple exact collaborator matches without adding any', async () => {
    const user = userEvent.setup();
    searchCollaborators.mockResolvedValue([
      [
        { refId: 'user-2', type: PermissionType.USER, label: 'alice' },
        { refId: 'group-1', type: PermissionType.GROUP, label: 'alice' },
      ],
    ]);
    renderModal();
    await screen.findByText('admin');
    const input = await typeAndAdd(user, 'alice');
    expect(await screen.findByText('Multiple matches found')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });
});

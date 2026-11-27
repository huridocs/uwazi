/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessLevels, MixedAccess, PermissionType } from '#shared/types/permissionSchema.js';
import { ApiError } from '#shared/apiClient/index.js';
import {
  expectGeneralAccessChoices,
  expectPermissionsLocked,
  expectPublicNotice,
  expectPublishedSelection,
  getPermissions,
  granted,
  publishAndMutate,
  renderModal,
  resetPermissions,
  savePermissions,
} from './shareEntityModalHarness.js';

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

const publicMixed = {
  refId: 'public',
  type: PermissionType.PUBLIC,
  label: 'Public',
  level: MixedAccess.MIXED,
};

const mixedBatch = [
  { ...granted[0], level: MixedAccess.MIXED },
  {
    refId: 'user-2',
    type: PermissionType.USER,
    label: 'editor',
    level: AccessLevels.WRITE,
  },
  publicMixed,
];

const changeEditorToView = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText('admin');
  expect(screen.getByText('Mixed access')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Private' })).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByRole('radio', { name: 'Published' })).toHaveAttribute('aria-checked', 'false');
  const editorLevel = screen.getByRole('radiogroup', { name: 'Permission level, editor' });
  await user.click(within(editorLevel).getByRole('radio', { name: 'Can view' }));
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
};

describe('ShareEntityModal actions', () => {
  beforeEach(resetPermissions);

  describe('saving', () => {
    it('saves visibility and members', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();
      await screen.findByText('admin');
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await waitFor(() => {
        expect(savePermissions).toHaveBeenCalledWith({
          ids: ['shared-1'],
          permissions: [
            { refId: 'user-1', type: PermissionType.USER, level: AccessLevels.WRITE },
            { refId: 'public', type: PermissionType.PUBLIC, level: AccessLevels.READ },
          ],
        });
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('applies published onto the latest entity after save', async () => {
      const user = userEvent.setup();
      let finishSave: (value: unknown) => void = () => undefined;
      savePermissions.mockImplementation(
        async () =>
          new Promise(resolve => {
            finishSave = resolve;
          })
      );
      const { onClose } = renderModal({ withProbe: true });
      await screen.findByText('admin');
      await publishAndMutate(user);
      finishSave([{ ids: ['shared-1'], permissions: [] }]);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(screen.getByTestId('entity-title')).toHaveTextContent('Updated during save');
      expect(screen.getByTestId('entity-published')).toHaveTextContent('true');
    });

    it('names the other entities and saves every shared id', async () => {
      const user = userEvent.setup();
      const ids = ['shared-1', 'shared-2', 'shared-3'];
      renderModal({ sharedIds: ids });
      expect(await screen.findByText('Case 123')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.getByText('x more')).toBeInTheDocument();
      expect(getPermissions).toHaveBeenCalledWith(ids);
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await waitFor(() => {
        expect(savePermissions).toHaveBeenCalledWith(expect.objectContaining({ ids }));
      });
    });

    it('does not explain Can view when several entities are published', async () => {
      const user = userEvent.setup();
      renderModal({ sharedIds: ['shared-1', 'shared-2'] });
      await screen.findByText('admin');
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      const canView = screen.getByRole('radio', { name: 'Can view' });
      expect(canView).toBeEnabled();
      expect(canView).not.toHaveAttribute('title');
      expect(canView).not.toHaveClass('bg-vellum');
    });

    it('hides general access controls for collaborators', async () => {
      renderModal({ role: 'collaborator' });
      await screen.findByText('admin');
      expect(screen.queryByRole('radiogroup', { name: 'General access' })).not.toBeInTheDocument();
    });

    it('discards changes without saving', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();
      await screen.findByText('admin');
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      await user.click(screen.getByRole('button', { name: 'Discard changes' }));
      expect(savePermissions).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('closes when pristine close is clicked', async () => {
      const { onClose } = renderModal();
      await screen.findByText('admin');
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    it('shows the administrators row when no people or groups are assigned', async () => {
      getPermissions.mockResolvedValue([[]]);
      renderModal();
      expect(await screen.findByText('Administrators and Editors')).toBeInTheDocument();
      expect(screen.getByText('Always')).toBeInTheDocument();
      const level = screen.getByText('Can edit');
      expect(level).toHaveClass('text-meta', 'font-medium', 'text-ink-secondary');
      expect(level.closest('[role="radio"]')).toBeNull();
    });

    it('blocks editing and saving when permissions fail to load', async () => {
      const user = userEvent.setup();
      getPermissions.mockResolvedValue([
        undefined,
        new ApiError('fail', { kind: 'http', status: 500, code: 'error', retryable: true }),
      ]);
      renderModal();
      expect(await screen.findByText('An error occurred')).toBeInTheDocument();
      expectPermissionsLocked();
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      expect(savePermissions).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });

    it('shows labeled access, status, and public tip only when switching to published', async () => {
      const user = userEvent.setup();
      renderModal();
      await screen.findByText('admin');
      expectGeneralAccessChoices();
      await user.click(screen.getByRole('radio', { name: 'Published' }));
      expectPublishedSelection();
      await user.click(screen.getByText('People and groups'));
      expectPublicNotice();
      await user.hover(screen.getByRole('radio', { name: 'Published' }));
      expectPublicNotice();
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

    it('changes permission level with labeled radios and removes members', async () => {
      const user = userEvent.setup();
      renderModal();
      await screen.findByText('admin');
      expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      await user.click(screen.getByRole('radio', { name: 'Can view' }));
      expect(screen.getByRole('radio', { name: 'Can view' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveAttribute(
        'aria-checked',
        'false'
      );
      await user.click(screen.getByRole('button', { name: 'Remove' }));
      expect(screen.queryByText('admin')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('leaves both levels unchecked when access is mixed', async () => {
      getPermissions.mockResolvedValue([
        granted.map(member => ({ ...member, level: MixedAccess.MIXED })),
      ]);
      renderModal();
      await screen.findByText('admin');
      expect(screen.getByText('Mixed access')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Can view' })).toHaveAttribute(
        'aria-checked',
        'false'
      );
      expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('preserves mixed publication and unchanged mixed members', async () => {
      const user = userEvent.setup();
      getPermissions.mockResolvedValue([mixedBatch]);
      const { onClose } = renderModal({
        sharedIds: ['shared-1', 'shared-2'],
        withProbe: true,
      });
      await changeEditorToView(user);
      await waitFor(() => {
        expect(savePermissions).toHaveBeenCalledWith({
          ids: ['shared-1', 'shared-2'],
          permissions: [
            { refId: 'user-2', type: PermissionType.USER, level: AccessLevels.READ },
            { refId: 'public', type: PermissionType.PUBLIC, level: MixedAccess.MIXED },
          ],
        });
      });
      expect(onClose).toHaveBeenCalled();
      expect(screen.getByTestId('entity-published')).toHaveTextContent('false');
    });

    it('sends the loaded public level when a collaborator saves', async () => {
      const user = userEvent.setup();
      getPermissions.mockResolvedValue([[...granted, publicMixed]]);
      renderModal({ role: 'collaborator', sharedIds: ['shared-1', 'shared-2'] });
      await screen.findByText('admin');
      expect(screen.queryByRole('radiogroup', { name: 'General access' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('radio', { name: 'Can view' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await waitFor(() => {
        expect(savePermissions).toHaveBeenCalledWith({
          ids: ['shared-1', 'shared-2'],
          permissions: [
            { refId: 'user-1', type: PermissionType.USER, level: AccessLevels.READ },
            { refId: 'public', type: PermissionType.PUBLIC, level: MixedAccess.MIXED },
          ],
        });
      });
    });
  });
});

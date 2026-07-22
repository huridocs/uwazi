/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { ApiError } from '#shared/apiClient/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { userAtom } from '#V2/atoms/index.js';
import {
  EntityProvider,
  useEntityContext,
} from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ShareEntityModal } from '../ShareEntityModal.js';

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

const EntityProbe = () => {
  const { entity: current, setEntity } = useEntityContext();
  return (
    <div>
      <button type="button" onClick={() => setEntity({ ...current, title: 'Updated during save' })}>
        Mutate entity
      </button>
      <span data-testid="entity-title">{current.title}</span>
      <span data-testid="entity-published">{String(current.published)}</span>
    </div>
  );
};

const granted: MemberWithPermission[] = [
  {
    refId: 'user-1',
    type: PermissionType.USER,
    label: 'admin',
    level: AccessLevels.WRITE,
  },
];

const getPermissions = jest.fn();
const savePermissions = jest.fn();
const searchCollaborators = jest.fn();

const renderModal = (
  role: 'admin' | 'collaborator' = 'admin',
  onClose = jest.fn(),
  sharedIds: string[] = ['shared-1'],
  withProbe = false
) => {
  const store = createStore();
  store.set(userAtom, {
    _id: 'current',
    role,
    username: 'current',
    email: 'current@example.com',
  });

  const testServices = createTestServices({
    entities: {
      getPermissions,
      savePermissions,
      searchCollaborators,
    },
  });

  const ui = (ids: string[]) => (
    <Provider store={store}>
      <ServicesProvider value={testServices}>
        <EntityProvider entity={entity}>
          {withProbe ? <EntityProbe /> : null}
          <ShareEntityModal sharedIds={ids} onClose={onClose} />
        </EntityProvider>
      </ServicesProvider>
    </Provider>
  );

  const view = render(ui(sharedIds));

  return {
    onClose,
    rerenderWithSharedIds: (ids: string[]) => view.rerender(ui(ids)),
  };
};

describe('ShareEntityModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPermissions.mockResolvedValue([granted]);
    savePermissions.mockResolvedValue([{ ids: ['shared-1'], permissions: [] }]);
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
    searchCollaborators.mockResolvedValue([
      [
        {
          refId: 'user-2',
          type: PermissionType.USER,
          label: 'alice',
        },
      ],
    ]);

    renderModal();
    await screen.findByText('admin');

    const input = screen.getByPlaceholderText('Username, email or group');
    await user.type(input, 'alice');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(searchCollaborators).toHaveBeenCalledWith('alice');
    });
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('does not duplicate a collaborator when added again before re-render settles', async () => {
    const user = userEvent.setup();
    const alice = { refId: 'user-2', type: PermissionType.USER, label: 'alice' };
    searchCollaborators.mockResolvedValue([[alice]]);

    renderModal();
    await screen.findByText('admin');

    const input = screen.getByPlaceholderText('Username, email or group');
    await user.type(input, 'alice');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('alice')).toBeInTheDocument();

    await user.type(input, 'alice');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(searchCollaborators).toHaveBeenCalledTimes(2);
    });
    expect(screen.getAllByText('alice')).toHaveLength(1);
    expect(await screen.findByText('No user or group found')).toBeInTheDocument();
  });

  it('rejects prefix-only group matches and keeps focus in the lookup field', async () => {
    const user = userEvent.setup();
    searchCollaborators.mockResolvedValue([
      [
        {
          refId: 'group-1',
          type: PermissionType.GROUP,
          label: 'Reviewers',
        },
      ],
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
        {
          refId: 'user-2',
          type: PermissionType.USER,
          label: 'alice',
        },
        {
          refId: 'group-1',
          type: PermissionType.GROUP,
          label: 'alice',
        },
      ],
    ]);

    renderModal();
    await screen.findByText('admin');

    const input = screen.getByPlaceholderText('Username, email or group');
    await user.type(input, 'alice');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Multiple matches found')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
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
      expect(savePermissions).toHaveBeenCalledWith({
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

  it('applies published onto the latest entity after save', async () => {
    const user = userEvent.setup();
    let finishSave: (value: unknown) => void = () => undefined;
    savePermissions.mockImplementation(
      async () =>
        new Promise(resolve => {
          finishSave = resolve;
        })
    );

    const { onClose } = renderModal('admin', jest.fn(), ['shared-1'], true);
    await screen.findByText('admin');

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('button', { name: 'Mutate entity' }));
    expect(screen.getByTestId('entity-title')).toHaveTextContent('Updated during save');

    finishSave([{ ids: ['shared-1'], permissions: [] }]);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(screen.getByTestId('entity-title')).toHaveTextContent('Updated during save');
    expect(screen.getByTestId('entity-published')).toHaveTextContent('true');
  });

  it('hides general access controls for collaborators', async () => {
    renderModal('collaborator');
    await screen.findByText('admin');
    expect(screen.queryByRole('radiogroup', { name: 'General access' })).not.toBeInTheDocument();
  });

  it('shows an empty state when no people or groups are assigned', async () => {
    getPermissions.mockResolvedValue([[]]);
    renderModal();
    expect(await screen.findByText('No people or groups added yet')).toBeInTheDocument();
  });

  it('blocks editing and saving when permissions fail to load', async () => {
    const user = userEvent.setup();
    getPermissions.mockResolvedValue([
      undefined,
      new ApiError('fail', { kind: 'http', status: 500, code: 'error', retryable: true }),
    ]);
    renderModal();

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Private' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Published' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Username, email or group')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    expect(savePermissions).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
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

    expect(savePermissions).not.toHaveBeenCalled();
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

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccess, PermissionType } from '#shared/types/permissionSchema.js';
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

const sectionLabel = (name: string) => {
  expect(screen.getByText(name).closest('h4')).toHaveClass(
    'text-meta',
    'font-semibold',
    'uppercase',
    'tracking-wide',
    'text-ink-tertiary'
  );
};

const expectHeaderRow = () => {
  const title = screen.getByRole('heading', { name: 'Permissions' });
  const subtitle = screen.getByText('Case 123');
  expect(title).toHaveClass('text-sm', 'font-semibold');
  expect(subtitle).toHaveClass('truncate', 'text-meta', 'text-ink-tertiary');
  expect(title.parentElement).toHaveClass('items-baseline', 'gap-2');
  expect(title.parentElement).toContainElement(subtitle);
};

const expectSegmentHeights = () => {
  expect(screen.getByRole('radio', { name: 'Private' })).toHaveClass('h-8', 'text-xs', 'bg-vellum');
  expect(screen.getByRole('radio', { name: 'Published' })).toHaveClass('h-8', 'text-xs');
  expect(screen.getByRole('radio', { name: 'Can view' })).toHaveClass('h-8', 'text-xs');
  expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveClass('h-8', 'text-xs', 'bg-vellum');
};

const expectFixedAccessRow = () => {
  const fixedName = screen.getByText('Administrators and Editors');
  const fixedRow = fixedName.closest('div');
  expect(fixedName.parentElement).toHaveClass('text-xs');
  expect(fixedRow?.querySelector('svg')).toHaveClass('h-[11px]', 'w-[11px]');
  expect(fixedRow?.querySelector('span.rounded-full')).toHaveClass('h-5', 'w-5', 'ring-inset');
  const always = screen.getByText('Always');
  expect(always).toHaveClass('block', 'text-meta', 'text-ink-tertiary');
  expect(always.parentElement).toContainElement(fixedName);
  const staticLevel = screen
    .getAllByText('Can edit')
    .find(node => node.closest('[role="radio"]') === null);
  expect(staticLevel).toHaveClass('text-meta', 'font-medium', 'text-ink-secondary');
};

const expectMemberMarkAndClose = () => {
  expect(screen.getByText('admin')).toHaveClass('text-xs');
  expect(screen.getByText('admin').parentElement?.querySelector('svg')).toHaveClass(
    'h-3.5',
    'w-3.5'
  );
  expect(screen.getByPlaceholderText('Username, email or group')).toHaveClass(
    'h-9',
    'rounded-md',
    'px-2.5'
  );
  const add = screen.getByRole('button', { name: 'Add' });
  expect(add).toBeDisabled();
  expect(add).toHaveClass('h-8', 'bg-warm', 'text-ink-secondary', 'disabled:opacity-40');
  expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
    'border-0',
    'bg-transparent',
    'text-xs',
    'font-medium',
    'text-ink-secondary'
  );
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

    await user.click(screen.getByRole('radio', { name: 'Published' }));
    expect(screen.getByRole('radio', { name: 'Published' }).className).toContain('bg-ink');
    expect(screen.getByRole('radio', { name: 'Published' }).className).toContain('text-parchment');
    expect(document.getElementById('share-public-caution')).toHaveClass(
      'text-meta',
      'shadow-sm',
      'w-56'
    );
    expect(screen.getByRole('radio', { name: 'Published' })).toHaveAttribute(
      'aria-describedby',
      'share-public-caution'
    );
    expect(screen.queryByText('Anyone can see this entity')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Can view' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Can edit' })).toBeInTheDocument();

    await user.click(screen.getByText('People and groups'));
    expect(
      screen.queryByText(/Caution: the selected entities will be|Anyone will be able to see them/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText('Anyone can see this entity').closest('p')).toHaveClass('text-meta');

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

  it('changes permission level with labeled radios and removes members', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText('admin');
    expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'Can view' }));
    expect(screen.getByRole('radio', { name: 'Can view' })).toHaveAttribute('aria-checked', 'true');
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

    expect(screen.getByRole('radio', { name: 'Can view' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });
});

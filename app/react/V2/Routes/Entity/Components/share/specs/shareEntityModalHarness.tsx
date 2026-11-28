import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import type { Entity } from '#V2/api/entities/types.js';
import { userAtom } from '#V2/atoms/index.js';
import {
  EntityProvider,
  useEntityContext,
} from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ShareEntityModal } from '../ShareEntityModal.js';

type User = ReturnType<typeof userEvent.setup>;

type ModalHarness = {
  role?: 'admin' | 'collaborator';
  onClose?: () => void;
  sharedIds?: string[];
  withProbe?: boolean;
};

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

const resetPermissions = () => {
  jest.clearAllMocks();
  getPermissions.mockResolvedValue([granted]);
  savePermissions.mockResolvedValue([{ ids: ['shared-1'], permissions: [] }]);
};

const renderModal = ({
  role = 'admin',
  onClose = jest.fn(),
  sharedIds = ['shared-1'],
  withProbe = false,
}: ModalHarness = {}) => {
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

const lookupInput = () => screen.getByPlaceholderText('Username, email or group');

const typeLookup = async (user: User, value: string) => {
  const input = lookupInput();
  await user.type(input, value);
  return input;
};

const typeAndAdd = async (user: User, value: string) => {
  const input = await typeLookup(user, value);
  await user.click(screen.getByRole('button', { name: 'Add' }));
  return input;
};

const expectAdded = async (label: string) => {
  expect(await screen.findByText(label)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
};

const expectOneCollaborator = (label: string) => {
  expect(screen.getAllByText(label)).toHaveLength(1);
  expect(screen.getByText('No user or group found')).toBeInTheDocument();
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
  expect(subtitle).toHaveClass('truncate');
  expect(subtitle.parentElement).toHaveClass('gap-1', 'text-meta', 'text-ink-tertiary');
  expect(title.parentElement).toHaveClass('items-baseline', 'gap-2');
  expect(title.parentElement).toContainElement(subtitle);
};

const expectSegmentHeights = () => {
  expect(screen.getByRole('radio', { name: 'Private' })).toHaveClass('h-8', 'text-xs', 'bg-vellum');
  expect(screen.getByRole('radio', { name: 'Published' })).toHaveClass('h-8', 'text-xs');
  expect(screen.getByRole('radio', { name: 'Can view' })).toHaveClass('h-8', 'text-xs');
  expect(screen.getByRole('radio', { name: 'Can edit' })).toHaveClass(
    'h-8',
    'text-xs',
    'bg-vellum'
  );
};

const expectBatchHeading = async (ids: string[]) => {
  expect(await screen.findByText('Case 123')).toBeInTheDocument();
  expect(screen.getByText('+2')).toBeInTheDocument();
  expect(screen.getByText('x more')).toBeInTheDocument();
  expect(getPermissions).toHaveBeenCalledWith(ids);
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
  expect(screen.getByText('admin').parentElement?.parentElement?.querySelector('svg')).toHaveClass(
    'h-3.5',
    'w-3.5'
  );
  expect(lookupInput()).toHaveClass('h-9', 'rounded-md', 'px-2.5');
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

const expectPermissionsLocked = () => {
  expect(screen.getByRole('radio', { name: 'Private' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Published' })).toBeDisabled();
  expect(lookupInput()).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
};

const expectGeneralAccessChoices = () => {
  expect(screen.getByText('General access')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Private' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Published' })).toBeInTheDocument();
};

const expectPublishedView = () => {
  const canView = screen.getByRole('radio', { name: 'Can view' });
  expect(canView).toBeEnabled();
  expect(canView).toHaveAttribute('title', 'Anyone can view a published entity');
  expect(canView).not.toHaveClass('bg-vellum');
};

const expectPublishedSelection = () => {
  const published = screen.getByRole('radio', { name: 'Published' });
  expect(published.className).toContain('bg-ink');
  expect(published.className).toContain('text-parchment');
  expect(document.getElementById('share-public-caution')).toHaveClass(
    'text-meta',
    'shadow-sm',
    'w-56'
  );
  expect(published).toHaveAttribute('aria-describedby', 'share-public-caution');
  expect(screen.queryByText('Anyone can see this entity')).not.toBeInTheDocument();
  expectPublishedView();
  expect(screen.getByRole('radio', { name: 'Can edit' })).not.toHaveAttribute('title');
  expect(screen.getByRole('radiogroup', { name: 'Permission level, admin' })).toBeInTheDocument();
};

const publicCaution = /Caution: the selected entities will be|Anyone will be able to see them/i;

const expectPublicNotice = () => {
  expect(screen.queryByText(publicCaution)).not.toBeInTheDocument();
  const notice = screen.getByText('Anyone can see this entity');
  expect(notice.closest('p')).toHaveClass('text-meta');
};

const publishAndMutate = async (user: User) => {
  await user.click(screen.getByRole('radio', { name: 'Published' }));
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await user.click(screen.getByRole('button', { name: 'Mutate entity' }));
  expect(screen.getByTestId('entity-title')).toHaveTextContent('Updated during save');
};

export {
  expectAdded,
  expectBatchHeading,
  expectFixedAccessRow,
  expectGeneralAccessChoices,
  expectHeaderRow,
  expectMemberMarkAndClose,
  expectOneCollaborator,
  expectPermissionsLocked,
  expectPublicNotice,
  expectPublishedSelection,
  expectSegmentHeights,
  getPermissions,
  granted,
  publishAndMutate,
  renderModal,
  resetPermissions,
  savePermissions,
  searchCollaborators,
  sectionLabel,
  typeAndAdd,
  typeLookup,
};

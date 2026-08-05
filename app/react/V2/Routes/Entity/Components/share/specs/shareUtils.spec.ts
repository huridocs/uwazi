/**
 * @jest-environment node
 */
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { filterCollaboratorCandidates } from '../shareUtils.js';

describe('filterCollaboratorCandidates', () => {
  const user = {
    refId: 'u1',
    type: PermissionType.USER,
    label: 'alice',
    level: AccessLevels.READ,
  };
  const group = {
    refId: 'g1',
    type: PermissionType.GROUP,
    label: 'alice',
    level: AccessLevels.READ,
  };
  const prefixGroup = {
    refId: 'g2',
    type: PermissionType.GROUP,
    label: 'alice-team',
    level: AccessLevels.READ,
  };
  const publicMember = {
    refId: 'public',
    type: PermissionType.PUBLIC,
    label: 'Public',
    level: AccessLevels.READ,
  };

  it('keeps API-exact users even when term is an email (label is username)', () => {
    expect(filterCollaboratorCandidates('alice@example.com', [user], [])).toEqual([user]);
  });

  it('requires exact group label and drops prefix-only groups', () => {
    expect(filterCollaboratorCandidates('alice', [prefixGroup], [])).toEqual([]);
    expect(filterCollaboratorCandidates('alice', [group], [])).toEqual([group]);
  });

  it('drops public and already assigned members', () => {
    expect(filterCollaboratorCandidates('alice', [publicMember, user], [user])).toEqual([]);
  });

  it('can return both a user and an exact-named group', () => {
    expect(filterCollaboratorCandidates('alice', [user, group, prefixGroup], [])).toEqual([
      user,
      group,
    ]);
  });
});

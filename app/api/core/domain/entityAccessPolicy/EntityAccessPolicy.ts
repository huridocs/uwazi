import { AccessGrant, AccessGrantProps } from './AccessGrant.js';
import { AccessGrantSet } from './AccessGrantSet.js';
import { AccessLevel } from './AccessLevel.js';
import { GrantType } from './GrantType.js';

type Props = {
  sharedId: string;
  grants: AccessGrantProps[];
  isPublic: boolean;
};

class EntityAccessPolicy {
  readonly sharedId: string;

  private grantSet: AccessGrantSet;

  isPublic: boolean;

  constructor(props: Props) {
    this.sharedId = props.sharedId;
    this.grantSet = AccessGrantSet.create(props.grants);
    this.isPublic = props.isPublic;
  }

  // Factory: called when a new entity is created.
  // creatorId is only provided for non-privileged actors (collaborators).
  // Privileged actors (admin/editor) do not need an explicit grant.
  static createForNewEntity(sharedId: string, creatorId?: string): EntityAccessPolicy {
    const grants: AccessGrantProps[] = creatorId
      ? [{ refId: creatorId, type: GrantType.User, level: AccessLevel.Write }]
      : [];
    return new EntityAccessPolicy({ sharedId, grants, isPublic: false });
  }

  get grants(): AccessGrant[] {
    return this.grantSet.items;
  }

  // Replace the full grant set. Invariants enforced by AccessGrantSet.
  // Mixed-level resolution must have happened before calling this method.
  applyGrants(grants: AccessGrantProps[]): void {
    this.grantSet = AccessGrantSet.create(grants);
  }

  // Upsert grants by refId. Existing grants whose refId is not present in
  // incoming are preserved unchanged. Mixed-level resolution must have
  // happened before calling this method.
  mergeGrants(incoming: AccessGrantProps[]): void {
    const map = new Map<string, AccessGrantProps>(
      this.grantSet.items.map(g => [g.refId, { refId: g.refId, type: g.type, level: g.level }])
    );
    incoming.forEach(g => map.set(g.refId, g));
    this.grantSet = AccessGrantSet.create(Array.from(map.values()));
  }

  setPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  allowsUserWrite(userId: string, groupIds: string[]): boolean {
    const ids = new Set([userId, ...groupIds]);
    return this.grants.some(g => g.level === AccessLevel.Write && ids.has(g.refId));
  }

  allowsUserRead(userId: string, groupIds: string[]): boolean {
    if (this.isPublic) return true;
    const ids = new Set([userId, ...groupIds]);
    return this.grants.some(g => ids.has(g.refId));
  }

  allowsPublicRead(): boolean {
    return this.isPublic;
  }
}

export { EntityAccessPolicy };
export type { Props as EntityAccessPolicyProps };

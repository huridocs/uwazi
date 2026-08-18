import { DuplicateMemberIds } from './errors.js';

type Props = {
  id: string;
  name: string;
  memberIds?: string[];
};

type UpdateParams = {
  name: string;
  memberIds: string[];
};

class UserGroup {
  readonly id: string;

  readonly name: string;

  readonly memberIds: string[];

  constructor({ id, name, memberIds = [] }: Props) {
    if (new Set(memberIds).size !== memberIds.length) {
      throw new DuplicateMemberIds(memberIds);
    }

    this.id = id;
    this.name = name;
    this.memberIds = memberIds;
  }

  update({ name, memberIds }: UpdateParams): UserGroup {
    return new UserGroup({ id: this.id, name, memberIds });
  }
}

export { UserGroup };

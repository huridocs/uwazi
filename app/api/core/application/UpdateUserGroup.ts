import { AbstractUseCase } from '../libs/UseCase.js';
import { UserGroup } from '../domain/userGroup/UserGroup.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';

type Input = {
  id: string;
  name: string;
  memberIds: string[];
};

type Output = UserGroup;

type Deps = {
  userGroupsDS: UserGroupsDataSource;
};

class UpdateUserGroupUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    (await this.deps.userGroupsDS.checkUniqueName(input.name, input.id)).getDataOrThrow();

    const existing = (await this.deps.userGroupsDS.findById(input.id)).getDataOrThrow();

    const updated = existing.update({ name: input.name, memberIds: input.memberIds });

    return this.deps.userGroupsDS.update(updated);
  }
}

export { UpdateUserGroupUseCase };
export type { Input as UpdateUserGroupUseCaseInput };

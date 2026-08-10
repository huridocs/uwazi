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

    return this.deps.userGroupsDS.update(input.id, input.name, input.memberIds);
  }
}

export { UpdateUserGroupUseCase };
export type { Input as UpdateUserGroupUseCaseInput };

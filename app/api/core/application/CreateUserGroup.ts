import { AbstractUseCase } from '../libs/UseCase.js';
import { UserGroup } from '../domain/userGroup/UserGroup.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';

type Input = {
  name: string;
  memberIds: string[];
};

type Output = UserGroup;

type Deps = {
  userGroupsDS: UserGroupsDataSource;
};

class CreateUserGroupUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const duplicated = await this.deps.userGroupsDS.existsByName(input.name);
    if (duplicated) {
      throw new Error('duplicated_entry');
    }

    return this.deps.userGroupsDS.create(input.name, input.memberIds);
  }
}

export { CreateUserGroupUseCase };
export type { Input as CreateUserGroupUseCaseInput };

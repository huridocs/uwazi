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
    (await this.deps.userGroupsDS.checkUniqueName(input.name)).getDataOrThrow();

    const userGroup = new UserGroup({
      id: this.idGenerator.generate(),
      name: input.name,
      memberIds: input.memberIds,
    });

    return this.deps.userGroupsDS.create(userGroup);
  }
}

export { CreateUserGroupUseCase };
export type { Input as CreateUserGroupUseCaseInput };

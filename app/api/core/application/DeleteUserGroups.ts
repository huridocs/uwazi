import { AbstractUseCase } from '../libs/UseCase.js';
import { UserGroupsDataSource } from './contracts/UserGroupsDataSource.js';

type Input = {
  ids: string[];
};

type Output = boolean;

type Deps = {
  userGroupsDS: UserGroupsDataSource;
};

class DeleteUserGroupsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.deps.userGroupsDS.delete(input.ids);
    return true;
  }
}

export { DeleteUserGroupsUseCase };
export type { Input as DeleteUserGroupsUseCaseInput };

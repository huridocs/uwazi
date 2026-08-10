import { AbstractUseCase } from '../libs/UseCase.js';
import { UserGroupsDataSource, UserGroupWithMembers } from './contracts/UserGroupsDataSource.js';

type Output = UserGroupWithMembers[];

type Deps = {
  userGroupsDS: UserGroupsDataSource;
};

class GetUserGroupsUseCase extends AbstractUseCase<{}, Output, Deps> {
  async execute(): Promise<Output> {
    return this.deps.userGroupsDS.getAll();
  }
}

export { GetUserGroupsUseCase };

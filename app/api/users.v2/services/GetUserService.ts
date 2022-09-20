import { UserDataSource } from '../contracts/UserDataSource';

export class GetUserService {
  private userDS: UserDataSource;

  constructor(userDS: UserDataSource) {
    this.userDS = userDS;
  }

  async get(_id: string) {
    return this.userDS.get(_id);
  }
}

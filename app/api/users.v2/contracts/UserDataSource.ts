import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { User } from '../model/User';

export interface UserDataSource {
  get(_id: string): ResultSet<User>;
}

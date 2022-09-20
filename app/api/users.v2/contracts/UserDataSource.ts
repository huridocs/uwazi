import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { User } from '../model/User';

export interface UserDataSource extends Transactional {
  get(_id: string): ResultSet<User>;
}

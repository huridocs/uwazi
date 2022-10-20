import { DefaultUserDataSource } from '../database/data_source_defaults';
import { GetUserService as GenericGetUserService } from './GetUserService';

const GetUserService = () => new GenericGetUserService(DefaultUserDataSource());

export { GetUserService };

import { ATConfig } from '../model/ATConfig';
import { RawATConfig } from '../model/RawATConfig';

export interface ATConfigDataSource {
  get(): Promise<ATConfig>;
  update(config: RawATConfig): Promise<ATConfig>;
}

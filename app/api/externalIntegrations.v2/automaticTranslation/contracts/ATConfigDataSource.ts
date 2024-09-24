import { RawATConfig } from '../model/RawATConfig';

export interface ATConfigDataSource {
  get(): Promise<RawATConfig>;
  update(config: RawATConfig): Promise<RawATConfig>;
}

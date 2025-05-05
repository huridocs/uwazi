import { IXExtractor } from './IXExtractor';

export interface IXExtractorsDataSource {
  getById(id: string): Promise<IXExtractor | null>;
}

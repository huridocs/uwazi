import { ThesaurusSchema } from 'shared/types/thesaurusType';

export type ThesaurusValueInput = {
  label: string;
  values?: Array<{ label: string }>;
};

export interface ThesauriRepository {
  getById(thesaurusId: string): Promise<ThesaurusSchema>;
  appendValues(thesaurusId: string, values: ThesaurusValueInput[]): Promise<ThesaurusSchema>;
}

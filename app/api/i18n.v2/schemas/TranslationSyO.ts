import { TranslationDBO } from './TranslationDBO';

type TranslationSyO = Omit<TranslationDBO, '_id'> & { _id: string };

export type { TranslationSyO };

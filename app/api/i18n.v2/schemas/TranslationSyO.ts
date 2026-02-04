import { TranslationDBO } from './TranslationDBO.js';

type TranslationSyO = Omit<TranslationDBO, '_id'> & { _id: string };

export type { TranslationSyO };

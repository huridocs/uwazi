import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';

type TranslationSyO = Omit<TranslationDBO, '_id'> & { _id: string };

export type { TranslationSyO };

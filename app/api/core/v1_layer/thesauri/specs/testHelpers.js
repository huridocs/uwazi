import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import thesauri from '../thesauri.js';

export const saveThesauri = data => testingEnvironment.runWithContext(() => thesauri.save(data));

export const getThesaurusById = id => testingEnvironment.runWithContext(() => thesauri.getById(id));

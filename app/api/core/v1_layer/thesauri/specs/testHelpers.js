import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { thesauri } from '../thesauri.js';

export const saveThesauri = async data =>
  testingEnvironment.runWithContext(async () => thesauri.save(data));

export const getThesaurusById = async id =>
  testingEnvironment.runWithContext(async () => thesauri.getById(id));

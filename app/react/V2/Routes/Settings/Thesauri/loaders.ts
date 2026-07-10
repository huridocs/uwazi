import { httpServices } from '#V2/services/http/index.js';
import { createThesauriLoader } from './createThesauriLoader.js';
import { createEditThesaurusLoader } from './createEditThesaurusLoader.js';

const thesauriLoader = createThesauriLoader(httpServices);
const editThesaurusLoader = createEditThesaurusLoader(httpServices);

export { thesauriLoader, editThesaurusLoader };

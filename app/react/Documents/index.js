import helpers from './helpers';
import DocumentForm from './components/DocumentForm';
import DocumentsAPI from './DocumentsAPI';
import * as actions from './actions/actions';

export default {
  helpers,
  actions,
  api: DocumentsAPI
};

export {DocumentForm};

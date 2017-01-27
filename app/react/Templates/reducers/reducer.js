import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';

import ui from './uiReducer.js';
import templateCommonProperties from '../utils/templateCommonProperties';

export default combineReducers({
  data: modelReducer('template.data', {name: '', properties: [], commonProperties: templateCommonProperties.get()}),
  formState: formReducer('template.data'),
  uiState: ui
});

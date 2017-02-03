import {createSelector} from 'reselect';

export default {
  selectTemplates: createSelector(s => s.templates, t => t.toJS())
};

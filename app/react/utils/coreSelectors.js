import { createSelector } from 'reselect';

export const selectTemplates = createSelector(
  s => s.templates,
  t => t.toJS()
);

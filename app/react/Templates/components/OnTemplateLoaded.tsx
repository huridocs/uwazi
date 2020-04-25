import React from 'react';
import { createSelector } from 'reselect';
import { StateSelector } from 'app/Review/components/StateSelector';
import { IStore } from 'app/istore';

type Props = {
  children: React.ReactType;
};

const OnTemplateLoaded: React.FunctionComponent<Props> = ({ children }) => (
  <StateSelector
    templateLoaded={createSelector(
      (state: IStore) => state.template.data._id,
      templateId => Boolean(templateId)
    )}
  >
    {({ templateLoaded }: { templateLoaded: boolean }) => (templateLoaded ? children : false)}
  </StateSelector>
);

export { OnTemplateLoaded };

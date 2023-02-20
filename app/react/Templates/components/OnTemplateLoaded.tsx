import React from 'react';
import { createSelector } from 'reselect';
import { StateSelector } from 'app/Review/components/StateSelector';
import { IStore } from 'app/istore';

type Props = {
  children: React.ReactElement;
};

const OnTemplateLoaded: React.FunctionComponent<Props> = ({ children }) => (
  <StateSelector
    // @ts-expect-error
    templateLoaded={createSelector(
      (state: IStore) => state.template.data._id,
      templateId => Boolean(templateId)
    )}
  >
    {({ templateLoaded }: { templateLoaded: boolean }) => (templateLoaded ? children : false)}
  </StateSelector>
);

export { OnTemplateLoaded };

import React from 'react';
import { StateSelector } from 'app/Review/components/StateSelector';

type Props = {
  children: React.ReactElement;
};

const OnTemplateLoaded: React.FunctionComponent<Props> = ({ children }) => (
  <StateSelector>
    {({ templateLoaded }: { templateLoaded: boolean }) => (templateLoaded ? children : false)}
  </StateSelector>
);

export { OnTemplateLoaded };

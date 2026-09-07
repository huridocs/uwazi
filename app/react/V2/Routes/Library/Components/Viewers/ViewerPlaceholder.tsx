import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';

type ViewerPlaceholderProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

const ViewerPlaceholder = ({ icon, title, description }: ViewerPlaceholderProps) => (
  <BlankState
    icon={icon}
    title={title}
    description={
      typeof description === 'string' ? <Translate>{description}</Translate> : description
    }
  />
);

export type { ViewerPlaceholderProps };
export { ViewerPlaceholder };

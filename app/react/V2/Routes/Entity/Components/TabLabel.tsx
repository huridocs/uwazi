import React from 'react';
import { Translate } from 'app/I18N';

const TabLabel = ({ text, icon }: { text: string; icon: React.ReactElement }) => (
  <div className="px-2 flex items-center gap-2">
    <Translate className="sr-only sm:not-sr-only">{text}</Translate>
    <div className="sm:hidden" aria-hidden="true">
      {icon}
    </div>
  </div>
);

export { TabLabel };

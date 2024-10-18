import React from 'react';
import { Icon } from 'UI';
import { I18NLink, Translate } from 'app/I18N';

const SettingsHeader = ({ children, backUrl }: { children: React.ReactNode; backUrl?: string }) => (
  <div className="panel-heading">
    <I18NLink to={backUrl || 'settings/'} className="only-mobile">
      <Icon icon="arrow-left" />
      <span className="btn-label">
        <Translate>Back</Translate>
      </span>
    </I18NLink>
    {children}
  </div>
);

export { SettingsHeader };

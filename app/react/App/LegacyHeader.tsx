import React, { useState } from 'react';
import { Icon } from '#UI/index.js';
import { t } from '#app/I18N/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { RequestStatus } from '#V2/Components/UI/Notifications/RequestStatus.js';
import { Menu } from './Menu.js';
import { SiteName } from './SiteName.js';

const LegacyHeader = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMobileMenu = (visible: boolean) => {
    setShowMenu(visible);
  };

  const isMobile = useIsMobile(1024) || false;

  let MenuButtonIcon = 'bars';
  let navClass = 'menuNav';

  if (showMenu) {
    MenuButtonIcon = 'times';
    navClass += ' is-active';
  }

  return (
    <>
      <nav className="library-nav">
        <h1>
          <SiteName />
        </h1>
      </nav>
      <header>
        {isMobile && (
          <button
            className="menu-button"
            onClick={() => toggleMobileMenu(MenuButtonIcon === 'bars')}
            type="button"
            aria-label={t('System', 'Menu', null, false)}
          >
            <Icon icon={MenuButtonIcon} />
          </button>
        )}
        <h1 className="logotype">
          <div>
            <SiteName />
          </div>
        </h1>
        {isMobile && (
          <div
            className="tw-content"
            style={{
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              float: 'right',
              minWidth: '48px',
            }}
          >
            <RequestStatus />
          </div>
        )}
        <Menu toggleMobileMenu={toggleMobileMenu} className={navClass} isMobile={isMobile} />
      </header>
    </>
  );
};

export { LegacyHeader };

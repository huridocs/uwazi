import React, { useState } from 'react';
import { t } from '#app/I18N/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.jsx';
import { Menu } from '#app/App/Menu.jsx';
import { SiteName } from '#app/App/SiteName.jsx';
import { Icon } from '../UI';

const LegacyHeader = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMobileMenu = (visible: boolean) => {
    setShowMenu(visible);
  };

  const isMobile = useIsMobile(1024);

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
        <Menu toggleMobileMenu={toggleMobileMenu} className={navClass} />
        <div className="nprogress-container" />
      </header>
    </>
  );
};

export { LegacyHeader };

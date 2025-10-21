import React, { useState } from 'react';
import { Icon } from 'UI';
import { t } from 'app/I18N';
import { useIsMobile } from 'app/V2/CustomHooks/useIsMobile';
import { Menu } from './Menu';
import { SiteName } from './SiteName';

const LegacyHeader = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMobileMenu = (visible: boolean) => {
    setShowMenu(visible);
  };

  const isMobile = useIsMobile();

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

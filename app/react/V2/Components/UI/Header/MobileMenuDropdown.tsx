import React, { useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { BaseDropdown } from './BaseDropdown.js';
import { HeaderIcon, headerIconButtonClass, joinActive } from './headerIcons.js';

type HeaderLink = {
  id?: string;
  _id?: string;
  localId?: string;
  title: string;
  url?: string;
  type: 'link' | 'group';
  sublinks?: HeaderLink[];
};

type MobileMenuAction = {
  id: string;
  label: string;
  to: string;
  onClick?: () => void;
};

type FlatLink = HeaderLink & { level?: number; group?: boolean };

interface MobileMenuDropdownProps {
  links?: HeaderLink[];
  actions?: MobileMenuAction[];
}

const linkKey = (link: HeaderLink) => String(link.id ?? link._id ?? link.localId ?? link.title);

const roundedClass = (isFirst: boolean, isLast: boolean) => {
  if (isFirst && isLast) return 'rounded-md';
  if (isFirst) return 'rounded-t-md';
  if (isLast) return 'rounded-b-md';
  return '';
};

const flattenLinks = (linkList: HeaderLink[] = [], level = 0): FlatLink[] => {
  const flattened: FlatLink[] = [];
  linkList.forEach(link => {
    if (link.sublinks && link.sublinks.length > 0) {
      flattened.push({ ...link, group: true, level });
      flattened.push(...flattenLinks(link.sublinks, level + 1));
    } else {
      flattened.push({ ...link, level });
    }
  });
  return flattened;
};

const renderMobileLink = (
  link: FlatLink,
  roundedClasses: string,
  menu: { isOpen: boolean; close: () => void }
) => {
  const paddingLeft = (link.level ?? 0) > 0 ? 'pl-8' : 'pl-4';
  const url = link.url || '/';
  const itemClass = [
    'header-bar-panel-item block py-2.5 text-sm transition-colors',
    paddingLeft,
    roundedClasses,
  ].join(' ');

  if (link.group) {
    return (
      <li key={`mobile-group-${linkKey(link)}`} role="none">
        <div
          className={`header-bar-panel-group py-2 ${paddingLeft} text-[0.6875rem] font-semibold uppercase tracking-wider ${roundedClasses}`}
        >
          {t('Menu', link.title)}
        </div>
      </li>
    );
  }

  const row = url.startsWith('http') ? (
    <a
      href={url}
      className={itemClass}
      target="_blank"
      rel="noreferrer"
      onClick={menu.close}
      role="menuitem"
      tabIndex={menu.isOpen ? 0 : -1}
    >
      {t('Menu', link.title)}
    </a>
  ) : (
    <I18NLink
      to={url}
      className={itemClass}
      activeClassname="header-bar-panel-item-active"
      onClick={menu.close}
      role="menuitem"
      tabIndex={menu.isOpen ? 0 : -1}
    >
      {t('Menu', link.title)}
    </I18NLink>
  );

  return (
    <li key={`mobile-link-${linkKey(link)}`} role="none">
      {row}
    </li>
  );
};

const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({ links, actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const flatLinks = flattenLinks(links || []);

  const trigger = (
    <button
      type="button"
      className={joinActive(headerIconButtonClass, isOpen)}
      aria-expanded={isOpen}
      aria-label={t('System', 'Toggle navigation menu', null, false)}
    >
      <HeaderIcon name="menu" />
    </button>
  );

  const dropdownContent = (
    <>
      {actions.map(action => (
        <li key={action.id} role="none">
          <I18NLink
            to={action.to}
            className="header-bar-panel-item block py-2.5 pl-4 text-sm transition-colors"
            activeClassname="header-bar-panel-item-active"
            onClick={() => {
              action.onClick?.();
              setIsOpen(false);
            }}
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
          >
            <Translate>{action.label}</Translate>
          </I18NLink>
        </li>
      ))}
      {flatLinks.map((link, index) =>
        renderMobileLink(link, roundedClass(index === 0, index === flatLinks.length - 1), {
          isOpen,
          close: () => setIsOpen(false),
        })
      )}
    </>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      isOpen={isOpen}
      onToggle={setIsOpen}
      dropdownClassName="max-h-[80vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto py-1"
    >
      {dropdownContent}
    </BaseDropdown>
  );
};

export { MobileMenuDropdown };
export type { MobileMenuAction };

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Bars3BottomLeftIcon, Bars3BottomRightIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { availableLanguages } from '#shared/language/index.js';
import { localeAtom, settingsAtom } from '../../../atoms/index.js';
import { BaseDropdown } from './BaseDropdown.js';

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
      <div key={`mobile-group-${linkKey(link)}`}>
        <div
          className={`header-bar-panel-group py-2 ${paddingLeft} text-[0.6875rem] font-semibold uppercase tracking-wider ${roundedClasses}`}
        >
          {t('Menu', link.title)}
        </div>
      </div>
    );
  }

  if (url.startsWith('http')) {
    return (
      <div key={`mobile-link-${linkKey(link)}`}>
        <a
          href={url}
          className={itemClass}
          target="_blank"
          rel="noreferrer"
          onClick={menu.close}
          tabIndex={menu.isOpen ? 0 : -1}
        >
          {t('Menu', link.title)}
        </a>
      </div>
    );
  }

  return (
    <div key={`mobile-link-${linkKey(link)}`}>
      <I18NLink to={url} className={itemClass} onClick={menu.close} tabIndex={menu.isOpen ? 0 : -1}>
        {t('Menu', link.title)}
      </I18NLink>
    </div>
  );
};

const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({ links, actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useAtomValue(localeAtom);
  const { languages } = useAtomValue(settingsAtom);
  const currentLanguage = languages?.find(lang => lang.key === locale);
  const isRTL = currentLanguage
    ? availableLanguages.find(language => language.key === currentLanguage.key)?.rtl
    : false;
  const HamburgerIcon = isRTL ? Bars3BottomRightIcon : Bars3BottomLeftIcon;
  const flatLinks = flattenLinks(links || []);

  const trigger = (
    <button
      type="button"
      className="header-bar-icon-button flex h-9 w-9 items-center justify-center rounded-md transition-colors"
      aria-expanded={isOpen}
      aria-label="Toggle navigation menu"
    >
      <HamburgerIcon className="h-5 w-5" />
    </button>
  );

  const dropdownContent = (
    <div className="max-h-[80vh] overflow-y-auto py-1">
      {actions.map(action => (
        <div key={action.id}>
          <I18NLink
            to={action.to}
            className="header-bar-panel-item block py-2.5 pl-4 text-sm transition-colors"
            onClick={() => {
              action.onClick?.();
              setIsOpen(false);
            }}
            tabIndex={isOpen ? 0 : -1}
          >
            <Translate>{action.label}</Translate>
          </I18NLink>
        </div>
      ))}
      {flatLinks.map((link, index) =>
        renderMobileLink(link, roundedClass(index === 0, index === flatLinks.length - 1), {
          isOpen,
          close: () => setIsOpen(false),
        })
      )}
    </div>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      isOpen={isOpen}
      onToggle={setIsOpen}
      dropdownClassName="w-80 max-w-[calc(100vw-2rem)]"
    >
      {dropdownContent}
    </BaseDropdown>
  );
};

export { MobileMenuDropdown };
export type { MobileMenuAction };

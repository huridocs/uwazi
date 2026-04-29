import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Bars3BottomLeftIcon, Bars3BottomRightIcon } from '@heroicons/react/24/outline';
import { availableLanguages } from '#shared/language/index.js';
import { localeAtom, settingsAtom } from '../../../atoms/index.js';
import { BaseDropdown } from './BaseDropdown.js';

type HeaderLink = {
  _id?: string;
  localId?: string;
  title: string;
  url?: string;
  type: 'link' | 'group';
  sublinks?: HeaderLink[];
};

interface MobileMenuDropdownProps {
  links?: HeaderLink[];
}

const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useAtomValue(localeAtom);
  const { languages } = useAtomValue(settingsAtom);

  // Determine if current language is RTL
  const currentLanguage = languages?.find(lang => lang.key === locale);
  const isRTL = currentLanguage
    ? availableLanguages.find(l => l.key === currentLanguage.key)?.rtl
    : false;

  const HamburgerIcon = isRTL ? Bars3BottomRightIcon : Bars3BottomLeftIcon;

  const renderMobileLink = (
    link: HeaderLink & { level?: number; group?: boolean },
    level = 0,
    roundedClasses = ''
  ) => {
    if (!link) return null;

    const paddingLeft = level > 0 ? 'pl-8' : 'pl-4';
    const url = link.url || '/';
    const isExternal = url.startsWith('http');

    if (link.group) {
      const key = String(link._id ?? link.localId ?? link.title);
      return (
        <div key={`mobile-group-${key}`}>
          <div
            className={`header-bar-panel-group py-2 ${paddingLeft} text-[0.6875rem] font-semibold uppercase tracking-wider ${roundedClasses}`}
          >
            {t('Menu', link.title)}
          </div>
        </div>
      );
    }

    return (
      <div key={`mobile-link-${String(link._id ?? link.localId ?? link.title)}`}>
        {isExternal ? (
          <a
            href={url}
            className={[
              'header-bar-panel-item block py-2.5 text-sm transition-colors',
              paddingLeft,
              roundedClasses,
            ].join(' ')}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsOpen(false)}
            tabIndex={isOpen ? 0 : -1}
          >
            {t('Menu', link.title)}
          </a>
        ) : (
          <I18NLink
            to={url}
            className={[
              'header-bar-panel-item block py-2.5 text-sm transition-colors',
              paddingLeft,
              roundedClasses,
            ].join(' ')}
            onClick={() => setIsOpen(false)}
            tabIndex={isOpen ? 0 : -1}
          >
            {t('Menu', link.title)}
          </I18NLink>
        )}
      </div>
    );
  };

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

  const getRoundedClasses = (isFirst: boolean, isLast: boolean): string => {
    if (isFirst && isLast) return 'rounded-md';
    if (isFirst) return 'rounded-t-md';
    if (isLast) return 'rounded-b-md';
    return '';
  };

  // Flatten all links to apply rounded corners to first and last items
  const flattenLinks = (
    linkList: HeaderLink[] = [],
    level = 0
  ): (HeaderLink & { level?: number; group?: boolean })[] => {
    const flattened: (HeaderLink & { level?: number; group?: boolean })[] = [];
    linkList?.forEach(link => {
      if (link.sublinks && link.sublinks.length > 0) {
        flattened.push({ ...link, group: true, level });
        flattened.push(...flattenLinks(link.sublinks, level + 1));
      } else {
        flattened.push({ ...link, level });
      }
    });
    return flattened;
  };

  const flatLinks = flattenLinks(links || []);

  const dropdownContent = (
    <div className="max-h-[80vh] overflow-y-auto py-1">
      {flatLinks.map((link, index) => {
        const isFirst = index === 0;
        const isLast = index === flatLinks.length - 1;
        const roundedClasses = getRoundedClasses(isFirst, isLast);

        return renderMobileLink(link, link.level, roundedClasses);
      })}
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

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { t } from 'app/I18N';
import { I18NLink } from 'app/I18N/I18NLinkV2';
import { Bars3BottomLeftIcon, Bars3BottomRightIcon } from '@heroicons/react/24/outline';
import { availableLanguages } from 'shared/language';
import { localeAtom, settingsAtom } from '../../../atoms';
import { BaseDropdown } from './BaseDropdown';

interface MobileMenuDropdownProps {
  links: any[] | undefined;
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

  const renderMobileLink = (link: any, level = 0, roundedClasses = '') => {
    if (!link) return null;

    const paddingLeft = level > 0 ? 'pl-8' : 'pl-4';
    const url = link.url || '/';
    const isExternal = url.startsWith('http');

    // Check if this link has sublinks (groups/dropdowns)
    if (link.type === 'group') {
      return (
        <div key={`mobile-group-${link._id}`}>
          <div
            className={`py-3 ${paddingLeft} text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-100 ${roundedClasses}`}
          >
            {t('Menu', link.title)}
          </div>
        </div>
      );
    }

    return (
      <div key={`mobile-link-${link._id}`}>
        {isExternal ? (
          <a
            href={url}
            className={[
              'block py-3',
              paddingLeft,
              'text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100',
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
              'block py-3',
              paddingLeft,
              'text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100',
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
      className="flex items-center justify-center w-10 h-10 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
      aria-expanded={isOpen}
      aria-label="Toggle navigation menu"
    >
      <HamburgerIcon className="h-6 w-6" />
    </button>
  );

  const getRoundedClasses = (isFirst: boolean, isLast: boolean): string => {
    if (isFirst && isLast) return 'rounded-md';
    if (isFirst) return 'rounded-t-md';
    if (isLast) return 'rounded-b-md';
    return '';
  };

  // Flatten all links to apply rounded corners to first and last items
  const flattenLinks = (linkList: any[], level = 0): any[] => {
    const flattened: any[] = [];
    linkList?.forEach(link => {
      if (link.sublinks && link.sublinks.length > 0) {
        flattened.push({ ...link, type: 'group', level });
        flattened.push(...flattenLinks(link.sublinks, level + 1));
      } else {
        flattened.push({ ...link, level });
      }
    });
    return flattened;
  };

  const flatLinks = flattenLinks(links || []);

  const dropdownContent = (
    <div className="max-h-[80vh] overflow-y-auto">
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
      dropdownClassName="w-80 max-w-[calc(100vw-2rem)] mt-2"
    >
      {dropdownContent}
    </BaseDropdown>
  );
};

export { MobileMenuDropdown };

import React from 'react';
import { useAtomValue } from 'jotai';
import { t } from 'app/I18N';
import { I18NLink } from 'app/I18N/I18NLinkV2';
import { SiteName } from 'app/App/SiteName';
import { settingsAtom } from '../../../atoms';
import { Dropdown, DropdownItem } from './Dropdown';
import { MobileMenuDropdown } from './MobileMenuDropdown';
import { useIsMobile } from '../../../CustomHooks/useIsMobile';

const createDropdownItems = (link: any): DropdownItem[] => {
  const sublinks = link.sublinks || [];
  return sublinks.map((sublink: any) => ({
    title: t('Menu', sublink.title),
    url: sublink.url || '/',
    isExternal: (sublink.url || '/').startsWith('http'),
  }));
};

const linkContainerClasses = [
  'py-2',
  'border-b-2',
  'border-transparent',
  'hover:border-primary-600',
  'flex',
  'items-center',
].join(' ');

const linkInnerClasses = [
  'p-2',
  'text-gray-700',
  'hover:text-primary-600',
  'text-base',
  'font-medium',
  'transition-colors',
  'rounded-xs',
].join(' ');

// Use !important to ensure active border overrides base border-transparent
const activeClasses = '!border-primary-600 !text-primary-600';

const createSimpleLink = (link: any, url: string) => {
  if (url.startsWith('http')) {
    return (
      <div key={link._id} className={linkContainerClasses}>
        <a href={url} className={linkInnerClasses} target="_blank" rel="noreferrer">
          {t('Menu', link.title)}
        </a>
      </div>
    );
  }
  return (
    <div key={link._id} className={linkContainerClasses}>
      <I18NLink to={url} className={linkInnerClasses} activeClassname={activeClasses}>
        {t('Menu', link.title)}
      </I18NLink>
    </div>
  );
};

const createNavLink = (link: any) => {
  if (link === undefined) {
    return null;
  }
  const type = link.type || 'link';

  if (type === 'link') {
    const url = link.url || '/';
    return createSimpleLink(link, url);
  }

  const dropdownItems = createDropdownItems(link);
  return (
    <Dropdown key={`dropdown-${link._id}`} title={t('Menu', link.title)} items={dropdownItems} />
  );
};

const MenuLinks = () => {
  const { links } = useAtomValue(settingsAtom);
  const navLinks = links?.map(createNavLink)?.filter((v: any) => v !== null);
  const isMobile = useIsMobile();

  return (
    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-8'}`}>
      {isMobile && <MobileMenuDropdown links={links} />}
      <SiteName className="text-xl font-semibold p-2" />
      {!isMobile && (
        <nav className="flex items-center gap-1" aria-label="Primary">
          {navLinks}
        </nav>
      )}
    </div>
  );
};

export { MenuLinks };

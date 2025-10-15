import React from 'react';
import { useAtomValue } from 'jotai';
import { t } from 'app/I18N';
import { I18NLink } from 'app/I18N/I18NLinkV2';
import { settingsAtom } from '../../../atoms';
import { Dropdown, DropdownItem } from './Dropdown';

const createDropdownItems = (link: any): DropdownItem[] => {
  const sublinks = link.sublinks || [];
  return sublinks.map((sublink: any) => ({
    title: t('Menu', sublink.title),
    url: sublink.url || '/',
    isExternal: (sublink.url || '/').startsWith('http'),
  }));
};

const linkBaseClasses = [
  'text-gray-700',
  'hover:text-primary-600',
  'text-base',
  'font-medium',
  'transition-colors',
  'py-4',
  'px-2',
  'border-b-2',
  'border-transparent',
  'hover:border-primary-600',
  'focus-visible:outline',
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
].join(' ');

// Use !important to ensure active border overrides base border-transparent
const activeClasses = '!border-primary-600 !text-primary-600';

const createSimpleLink = (link: any, url: string) => {
  if (url.startsWith('http')) {
    return (
      <a key={link._id} href={url} className={linkBaseClasses} target="_blank" rel="noreferrer">
        {t('Menu', link.title)}
      </a>
    );
  }
  return (
    <I18NLink key={link._id} to={url} className={linkBaseClasses} activeClassname={activeClasses}>
      {t('Menu', link.title)}
    </I18NLink>
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

  return (
    <nav className="flex items-center gap-1" aria-label="Primary">
      {navLinks}
    </nav>
  );
};

export { MenuLinks };

import React from 'react';
import { t } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Dropdown, type DropdownItem } from './Dropdown.js';

type HeaderLink = {
  _id?: string;
  localId?: string;
  title: string;
  url?: string;
  type: 'link' | 'group';
  sublinks?: HeaderLink[];
};

type MenuLinksProps = {
  links?: HeaderLink[];
  className?: string;
};

const toDropdownItem = (sublink: HeaderLink): DropdownItem => {
  const url = sublink.url || '/';
  return {
    title: t('Menu', sublink.title),
    url,
    isExternal: url.startsWith('http'),
  };
};

const navButtonClasses =
  'header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors';

const activeClasses = 'header-bar-button-active';

const renderLink = (link: HeaderLink) => {
  const key = String(link._id ?? link.localId ?? link.title);
  if (link.type === 'group') {
    const items = (link.sublinks ?? []).map(toDropdownItem);
    if (items.length === 0) return null;
    return <Dropdown key={key} title={t('Menu', link.title)} items={items} />;
  }

  const url = link.url || '/';
  if (url.startsWith('http')) {
    return (
      <a key={key} href={url} className={navButtonClasses} target="_blank" rel="noreferrer">
        {t('Menu', link.title)}
      </a>
    );
  }

  return (
    <I18NLink key={key} to={url} className={navButtonClasses} activeClassname={activeClasses}>
      {t('Menu', link.title)}
    </I18NLink>
  );
};

const MenuLinks = ({ links = [], className = '' }: MenuLinksProps) => {
  const navLinks = links.map(renderLink).filter(Boolean);

  if (!navLinks.length) return null;

  return (
    <nav
      className={['flex items-center gap-2', className].filter(Boolean).join(' ')}
      aria-label="Primary"
    >
      {navLinks}
    </nav>
  );
};

export { MenuLinks };
export type { MenuLinksProps };

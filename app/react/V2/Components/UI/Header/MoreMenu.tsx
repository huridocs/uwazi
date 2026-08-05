import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { type DropdownItem } from './Dropdown.js';
import { BaseDropdown } from './BaseDropdown.js';
import type { HeaderLink } from './MenuLinks.js';

const navButtonClasses =
  'header-bar-button flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors';
const activeClasses = 'header-bar-button-active';

const linkKey = (link: HeaderLink) => String(link._id ?? link.localId ?? link.title);
const menuLabel = (title: string): string => t('Menu', title, null, false);

const toDropdownItem = (sublink: HeaderLink): DropdownItem => {
  const url = sublink.url || '/';
  return { title: menuLabel(sublink.title), url, isExternal: url.startsWith('http') };
};

const renderLinkItem = (item: DropdownItem, onNavigate: () => void, indented = false) => {
  const className = `header-bar-panel-item block ${
    indented ? 'ps-6 pe-3' : 'px-3'
  } py-2 text-xs font-medium transition-colors`;
  return item.isExternal ? (
    <a
      href={item.url}
      className={className}
      target="_blank"
      rel="noreferrer"
      role="menuitem"
      onClick={onNavigate}
    >
      {item.title}
    </a>
  ) : (
    <I18NLink to={item.url} className={className} role="menuitem" onClick={onNavigate}>
      {item.title}
    </I18NLink>
  );
};

const MoreMenu = ({ links }: { links: HeaderLink[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      className={`${navButtonClasses} ${isOpen ? activeClasses : ''}`}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      <Translate>More</Translate>
      <span className="text-ink-tertiary tabular-nums">{links.length}</span>
      <ChevronDownIcon
        className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <BaseDropdown trigger={trigger} isOpen={isOpen} onToggle={setIsOpen} align="right">
      {links.map(link => {
        if (link.type === 'group') {
          return (
            <li key={linkKey(link)} role="none">
              <span className="block px-3 pt-2 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-tertiary">
                {menuLabel(link.title)}
              </span>
              <ul role="none">
                {(link.sublinks ?? []).map(toDropdownItem).map(item => (
                  <li key={`${item.url}-${item.title}`} role="none">
                    {renderLinkItem(item, () => setIsOpen(false), true)}
                  </li>
                ))}
              </ul>
            </li>
          );
        }
        const url = link.url || '/';
        return (
          <li key={linkKey(link)} role="none">
            {renderLinkItem(
              { title: menuLabel(link.title), url, isExternal: url.startsWith('http') },
              () => setIsOpen(false)
            )}
          </li>
        );
      })}
    </BaseDropdown>
  );
};

export { MoreMenu };

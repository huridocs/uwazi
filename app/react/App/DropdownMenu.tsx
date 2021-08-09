import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import React, { useState } from 'react';

export type DropdownMenuProps = {
  link: any;
};

export function DropdownMenu({ link }: DropdownMenuProps) {
  const [showing, setShowing] = useState(false);

  const toggleDropdown = () => {
    setShowing(!showing);
  };

  return (
    <li className="menuNav-item" key={link.get('_id')} onBlur={toggleDropdown}>
      <a
        className="btn menuNav-btn menuNav-link dropdown-toggle"
        id="navbarDropdownMenuLink"
        data-toggle="dropdown"
        onClick={toggleDropdown}
        onBlur={toggleDropdown}
      >
        {link.get('title')}
        &nbsp; <Icon icon="caret-down" />
      </a>
      <ul
        key={link.get('_id')}
        className={`dropdown-menu ${showing ? 'show' : 'hide'}`}
        onBlur={toggleDropdown}
      >
        {link.get('sublinks').map((sublink: any, index: number) => {
          const url = sublink.get('url') || '/';
          if (url.startsWith('http')) {
            return (
              <li key={index}>
                <a href={url} className="btn dropdown-item" target="_blank" rel="noreferrer">
                  <span>{t('Menu', sublink.get('title'))}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={index}>
              <I18NLink to={url} className="btn dropdown-item">
                <span>{t('Menu', sublink.get('title'))}</span>
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

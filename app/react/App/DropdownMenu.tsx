import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import React, { MutableRefObject, useRef, useState } from 'react';

export type DropdownMenuProps = {
  link: any;
};

export function DropdownMenu({ link }: DropdownMenuProps) {
  const [showing, setShowing] = useState(false);
  const dropdownRef: MutableRefObject<HTMLInputElement | undefined> = useRef();
  const toggleDropdown = () => {
    setShowing(true);
  };

  return (
    <li
      className="menuNav-item"
      key={link.get('_id')}
      onBlur={e => {
        console.log(e.relatedTarget);
        if (e.relatedTarget === null) {
          setShowing(false);
        }
      }}
      tabIndex={-1}
      data-toggle="dropdown"
      onClick={toggleDropdown}
    >
      <a className="btn menuNav-btn menuNav-link dropdown-toggle" id="navbarDropdownMenuLink">
        {link.get('title')}
        &nbsp; <Icon icon="caret-down" />
      </a>
      <ul
        key={link.get('_id')}
        className={`dropdown-menu ${showing ? 'show' : 'hide'}`}
        // @ts-ignore
        ref={dropdownRef}
        onBlur={() => {
          console.log('second blur');
          // setShowing(false);
        }}
        tabIndex={-1}
      >
        {link.get('sublinks').map((sublink: any, index: number) => {
          const url = sublink.get('url') || '/';
          if (url.startsWith('http')) {
            return (
              <li key={index}>
                <a
                  href={url}
                  className="btn dropdown-item"
                  target="_blank"
                  rel="noreferrer"
                  onClick={toggleDropdown}
                >
                  <span>{t('Menu', sublink.get('title'))}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={index}>
              <I18NLink to={url} className="btn dropdown-item" onClick={toggleDropdown}>
                <span>{t('Menu', sublink.get('title'))}</span>
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

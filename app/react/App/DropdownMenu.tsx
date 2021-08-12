import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import React, { useRef, useState, useCallback } from 'react';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';

export type DropdownMenuProps = {
  link: any;
};

export function DropdownMenu({ link }: DropdownMenuProps) {
  const [showing, setShowing] = useState(false);
  const dropdownRef = useRef(null);
  const onClickOutside = useCallback(() => {
    setShowing(false);
  }, []);

  useOnClickOutsideElement<HTMLLIElement>(dropdownRef, onClickOutside);

  return (
    <li className="menuNav-item" key={link.get('_id')} ref={dropdownRef}>
      <a
        type="button"
        className="btn menuNav-btn menuNav-link dropdown-toggle"
        id="navbarDropdownMenuLink"
        onClick={() => setShowing(!showing)}
      >
        {t('Menu', link.get('title'))}
        &nbsp; <Icon icon="caret-down" />
      </a>
      <ul key={link.get('_id')} className={`dropdown-menu ${showing ? 'show' : ''} mobile`}>
        {link.get('sublinks').map((sublink: any, index: number) => {
          const url = sublink.get('url') || '/';
          if (url.startsWith('http')) {
            return (
              <li key={index}>
                <a href={url} className="btn dropdown-item" target="_blank" rel="noreferrer">
                  {t('Menu', sublink.get('title'))}
                </a>
              </li>
            );
          }
          return (
            <li key={index}>
              <I18NLink to={url} className="btn dropdown-item">
                {t('Menu', sublink.get('title'))}
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

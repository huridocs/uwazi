import { I18NLink, Translate } from 'app/I18N';
import { Icon } from 'UI';
import React, { useRef, useState, useCallback } from 'react';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { ILink, ISublink } from 'app/V2/shared/types';
import { IImmutable } from 'shared/types/Immutable';

export type DropdownMenuProps = {
  link: IImmutable<ILink>;
  position: number;
  hideMobileMenu: Function;
};

export const DropdownMenu = ({ link, position, hideMobileMenu }: DropdownMenuProps) => {
  const [showing, setShowing] = useState(false);
  const dropdownRef = useRef(null);
  const onClickOutside = useCallback(() => {
    setShowing(false);
  }, []);

  const toggleShowing = () => {
    setShowing(!showing);
  };

  const hideMenu = () => {
    setShowing(false);
    hideMobileMenu();
  };
  useOnClickOutsideElement<HTMLLIElement>(dropdownRef, onClickOutside);

  const menuOptions = () =>
    link
      .get('sublinks')
      .map((sublink?: IImmutable<ISublink>, index?: number) => {
        const url = sublink?.get('url') || '/';
        return url.startsWith('http') ? (
          <li key={index}>
            <a
              href={url}
              className="btn dropdown-item"
              target="_blank"
              rel="noreferrer"
              onClick={hideMenu}
            >
              <Translate context="Menu">{sublink?.get('title') as string}</Translate>
            </a>
          </li>
        ) : (
          <li key={index}>
            <I18NLink to={url} className="btn dropdown-item" onClick={hideMenu}>
              <Translate context="Menu">{sublink?.get('title') as string}</Translate>
            </I18NLink>
          </li>
        );
      })
      .toArray();

  return (
    <li className="menuNav-item" key={position} ref={dropdownRef}>
      <button
        type="button"
        className={`btn menuNav-btn menuNav-link dropdown-toggle ${showing ? 'expanded' : ''} `}
        id="navbarDropdownMenuLink"
        onClick={toggleShowing}
      >
        <Translate context="Menu">{link.get('title')}</Translate>
        &nbsp; <Icon icon="caret-down" />
      </button>
      <ul className={`dropdown-menu ${showing ? 'expanded' : ''} `}>{menuOptions()}</ul>
    </li>
  );
};

// @ts-expect-error TS(2307): Cannot find module '../../utils/useOnClickOutsideE... Remove this comment to see the full error message
import { useOnClickOutsideElement } from '../../utils/useOnClickOutsideElementHook.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { I18NLink, Translate } from '../../I18N/index.js';
import { Icon } from 'UI';
import React, { useRef, useState, useCallback } from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../shared/V2/shared/types.j... Remove this comment to see the full error message
import { ILink, ISublink } from 'shared/V2/shared/types.js';
import { IImmutable } from 'shared/types/Immutable.js';

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
    // @ts-expect-error TS(2533): Object is possibly 'null' or 'undefined'.
    link
      // @ts-expect-error TS(2339): Property 'get' does not exist on type 'string | nu... Remove this comment to see the full error message
      .get('sublinks')
      .map((sublink?: IImmutable<ISublink>, index?: number) => {
        // @ts-expect-error TS(2339): Property 'get' does not exist on type 'string | nu... Remove this comment to see the full error message
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
              // @ts-expect-error TS(2339): Property 'get' does not exist on type 'string | nu...
              Remove this comment to see the full error message
              <Translate context="Menu">{sublink?.get('title') as string}</Translate>
            </a>
          </li>
        ) : (
          <li key={index}>
            <I18NLink to={url} className="btn dropdown-item" onClick={hideMenu}>
              // @ts-expect-error TS(2339): Property 'get' does not exist on type 'string | nu...
              Remove this comment to see the full error message
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
        // @ts-expect-error TS(2533): Object is possibly 'null' or 'undefined'.
        <Translate context="Menu">{link.get('title')}</Translate>
        &nbsp; <Icon icon="caret-down" />
      </button>
      <ul className={`dropdown-menu ${showing ? 'expanded' : ''} `}>{menuOptions()}</ul>
    </li>
  );
};

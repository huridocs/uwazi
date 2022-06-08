import { I18NLink, Translate } from 'app/I18N';
import { Icon } from 'UI';
import React, { useRef, useState, useCallback } from 'react';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { IImmutable } from 'shared/types/Immutable';

export type ISublink = {
  title: string;
  url: string;
};

export type ILink = {
  title: string;
  url: string;
  sublinks: [ISublink];
  type: string;
};

export type DropdownMenuProps = {
  link: IImmutable<ILink>;
  position: number;
};

export function DropdownMenu({ link, position }: DropdownMenuProps) {
  const [showing, setShowing] = useState(false);
  const dropdownRef = useRef(null);
  const onClickOutside = useCallback(() => {
    setShowing(false);
  }, []);

  const toggleShowing = (e: { stopPropagation: () => void }) => {
    setShowing(!showing);
    e.stopPropagation();
  };

  useOnClickOutsideElement<HTMLLIElement>(dropdownRef, onClickOutside);

  return (
    <li className="menuNav-item" key={position} ref={dropdownRef}>
      <button
        type="button"
        className="btn menuNav-btn menuNav-link dropdown-toggle"
        id="navbarDropdownMenuLink"
        onClick={toggleShowing}
      >
        <Translate context="Menu">{link.get('title')}</Translate>
        &nbsp; <Icon icon="caret-down" />
      </button>
      <ul className={`dropdown-menu ${showing ? 'show' : ''} `}>
        {link.get('sublinks').map((sublink?: IImmutable<ISublink>, index?: number) => {
          const url = sublink?.get('url') || '/';
          if (url.startsWith('http')) {
            return (
              <li key={index}>
                <a href={url} className="btn dropdown-item" target="_blank" rel="noreferrer">
                  <Translate context="Menu">{sublink?.get('title') as string}</Translate>
                </a>
              </li>
            );
          }
          return (
            <li key={index}>
              <I18NLink to={url} className="btn dropdown-item">
                <Translate context="Menu">{sublink?.get('title') as string}</Translate>
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

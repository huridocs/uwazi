import { I18NLink, Translate } from 'app/I18N';
import { Icon } from 'UI';
import React, { useRef, useState, useCallback } from 'react';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { IImmutable } from 'shared/types/Immutable';
import { SettingsLinkSchema } from 'shared/types/settingsType';

export type ISublink = {
  title: string;
  url: string;
};

export type ILink = Omit<SettingsLinkSchema, 'sublinks'> & {
  title: string;
  sublinks: [ISublink];
};

export type DropdownMenuProps = {
  link: IImmutable<ILink>;
  position: number;
};

export const DropdownMenu = ({ link, position }: DropdownMenuProps) => {
  const [showing, setShowing] = useState(false);
  const dropdownRef = useRef(null);
  const onClickOutside = useCallback(() => {
    setShowing(false);
  }, []);

  const toggleShowingWithoutPropagation = (e: { stopPropagation: () => void }) => {
    setShowing(!showing);
    e.stopPropagation();
  };
  const toggleShowing = () => {
    setShowing(!showing);
  };

  useOnClickOutsideElement<HTMLLIElement>(dropdownRef, onClickOutside);

  return (
    <li className="menuNav-item" key={position} ref={dropdownRef}>
      <button
        type="button"
        className={`btn menuNav-btn menuNav-link dropdown-toggle ${showing ? 'expanded' : ''} `}
        id="navbarDropdownMenuLink"
        onClick={toggleShowingWithoutPropagation}
      >
        <Translate context="Menu">{link.get('title')}</Translate>
        &nbsp; <Icon icon="caret-down" />
      </button>
      <ul className={`dropdown-menu ${showing ? 'expanded' : ''} `}>
        {link.get('sublinks').map((sublink?: IImmutable<ISublink>, index?: number) => {
          const url = sublink?.get('url') || '/';
          if (url.startsWith('http')) {
            return (
              <li key={index}>
                <a
                  href={url}
                  className="btn dropdown-item"
                  target="_blank"
                  rel="noreferrer"
                  onClick={toggleShowing}
                >
                  <Translate context="Menu">{sublink?.get('title') as string}</Translate>
                </a>
              </li>
            );
          }
          return (
            <li key={index}>
              <I18NLink to={url} className="btn dropdown-item" onClick={toggleShowing}>
                <Translate context="Menu">{sublink?.get('title') as string}</Translate>
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
};

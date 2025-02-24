import React from 'react';
import { NavLinkProps, NavLink } from 'react-router';
import { useAtomValue } from 'jotai';
import { localeAtom } from 'V2/atoms';

type I18NLinkProps = NavLinkProps & { to: string; activeClassname?: string };

const I18NLink = (props: I18NLinkProps) => {
  const { to: link, className, activeClassname, ...rest } = props;
  const locale = useAtomValue(localeAtom);
  const parsedLink = link.startsWith('/') ? link.slice(1) : link;
  const to = locale ? `/${locale}/${parsedLink}` : `/${parsedLink}`;

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${className || ''} ${isActive ? activeClassname : ''}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
};

export { I18NLink };

import React from 'react';
import { NavLinkProps, NavLink } from 'react-router';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';

type I18NLinkProps = NavLinkProps & { to: string; activeClassname?: string; localized?: boolean };

const I18NLink = (props: I18NLinkProps) => {
  const { to: link, className, activeClassname, localized = true, ...rest } = props;
  const locale = useAtomValue(localeAtom);
  const parsedLink = link.startsWith('/') ? link.slice(1) : link;
  const to = locale && localized ? `/${locale}/${parsedLink}` : `/${parsedLink}`;

  const resolvedClassName: NavLinkProps['className'] =
    typeof className === 'function'
      ? className
      : ({ isActive }) => `${className ?? ''} ${isActive ? (activeClassname ?? '') : ''}`.trim();

  return (
    <NavLink
      to={to}
      className={resolvedClassName}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
};

export type { I18NLinkProps };
export { I18NLink };

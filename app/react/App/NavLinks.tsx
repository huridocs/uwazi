import { I18NLink, t } from 'app/I18N';
import React from 'react';
import { IImmutable } from 'shared/types/Immutable';
import { DropdownMenu, ILink } from './DropdownMenu';

type NavLinksProps = {
  links: IImmutable<ILink>[];
};

const NavLinks = ({ links }: NavLinksProps) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const widthRef = React.useRef(null);

  React.useEffect(() => {
    const el = widthRef.current;
    if (el.offsetWidth < el.scrollWidth) {
      setIsOverflowing(true);
    }
  }, []);

  const navLinks = links.map((link, index) => {
    const type = link.get('type') || 'link';

    if (type === 'link') {
      const url = link.get('url') || '/';
      if (url.startsWith('http')) {
        return (
          <li key={link.get('_id')?.toString()} className="menuNav-item">
            <a
              href={url}
              className="btn menuNav-btn"
              activeClassName="active-link"
              target="_blank"
              rel="noreferrer"
            >
              {t('Menu', link.get('title'))}
            </a>
          </li>
        );
      }
      return (
        <li key={link.get('_id')?.toString()} className="menuNav-item">
          <I18NLink to={url} className="btn menuNav-btn" activeClassName="active-link">
            {t('Menu', link.get('title'))}
          </I18NLink>
        </li>
      );
    }

    return <DropdownMenu link={link} position={index} key={index} />;
  });

  return (
    <>
      <ul className="menuNav-list" ref={widthRef}>
        {navLinks}
      </ul>
      {/* {isOverflowing ? <button type="button">...</button> : null} */}
    </>
  );
};

export { NavLinks };

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Dropdown, type DropdownItem } from './Dropdown.js';
import { BaseDropdown } from './BaseDropdown.js';

type HeaderLink = {
  _id?: string;
  localId?: string;
  title: string;
  url?: string;
  type: 'link' | 'group';
  sublinks?: HeaderLink[];
};

type MenuLinksProps = {
  links?: HeaderLink[];
  className?: string;
  endOverlapPx?: number;
};

const GAP = 8;

const navButtonClasses =
  'header-bar-button flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors';
const activeClasses = 'header-bar-button-active';
const labelClasses = 'max-w-[12rem] truncate';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const linkKey = (link: HeaderLink) => String(link._id ?? link.localId ?? link.title);
const hasContent = (link: HeaderLink) => link.type !== 'group' || (link.sublinks?.length ?? 0) > 0;
const menuLabel = (title: string): string => t('Menu', title, null, false);

const toDropdownItem = (sublink: HeaderLink): DropdownItem => {
  const url = sublink.url || '/';
  return { title: menuLabel(sublink.title), url, isExternal: url.startsWith('http') };
};

const renderLink = (link: HeaderLink) => {
  const label = menuLabel(link.title);
  if (link.type === 'group') {
    const items = (link.sublinks ?? []).map(toDropdownItem);
    return <Dropdown key={linkKey(link)} title={label} items={items} />;
  }

  const url = link.url || '/';
  if (url.startsWith('http')) {
    return (
      <a
        key={linkKey(link)}
        href={url}
        className={navButtonClasses}
        target="_blank"
        rel="noreferrer"
      >
        <span className={labelClasses} title={label}>
          {label}
        </span>
      </a>
    );
  }

  return (
    <I18NLink
      key={linkKey(link)}
      to={url}
      className={navButtonClasses}
      activeClassname={activeClasses}
    >
      <span className={labelClasses} title={label}>
        {label}
      </span>
    </I18NLink>
  );
};

const renderMeasure = (link: HeaderLink) => (
  <span key={linkKey(link)} className={navButtonClasses}>
    <span className={labelClasses}>{menuLabel(link.title)}</span>
    {link.type === 'group' && <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />}
  </span>
);

const MoreMenu = ({ links }: { links: HeaderLink[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      className={`${navButtonClasses} ${isOpen ? activeClasses : ''}`}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      <Translate>More</Translate>
      <span className="text-ink-tertiary tabular-nums">{links.length}</span>
      <ChevronDownIcon
        className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <BaseDropdown trigger={trigger} isOpen={isOpen} onToggle={setIsOpen} align="right">
      {links.map(link => {
        if (link.type === 'group') {
          return (
            <li key={linkKey(link)} role="none">
              <span className="block px-3 pt-2 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-tertiary">
                {menuLabel(link.title)}
              </span>
              <ul role="none">
                {(link.sublinks ?? []).map(toDropdownItem).map(item => (
                  <li key={`${item.url}-${item.title}`} role="none">
                    <LinkItem item={item} onNavigate={() => setIsOpen(false)} indented />
                  </li>
                ))}
              </ul>
            </li>
          );
        }
        const url = link.url || '/';
        return (
          <li key={linkKey(link)} role="none">
            <LinkItem
              item={{ title: menuLabel(link.title), url, isExternal: url.startsWith('http') }}
              onNavigate={() => setIsOpen(false)}
            />
          </li>
        );
      })}
    </BaseDropdown>
  );
};

const LinkItem = ({
  item,
  onNavigate,
  indented = false,
}: {
  item: DropdownItem;
  onNavigate: () => void;
  indented?: boolean;
}) => {
  const className = `header-bar-panel-item block ${
    indented ? 'ps-6 pe-3' : 'px-3'
  } py-2 text-xs font-medium transition-colors`;
  return item.isExternal ? (
    <a
      href={item.url}
      className={className}
      target="_blank"
      rel="noreferrer"
      role="menuitem"
      onClick={onNavigate}
    >
      {item.title}
    </a>
  ) : (
    <I18NLink to={item.url} className={className} role="menuitem" onClick={onNavigate}>
      {item.title}
    </I18NLink>
  );
};

const MenuLinks = ({ links = [], className = '', endOverlapPx = 0 }: MenuLinksProps) => {
  const valid = links.filter(hasContent);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasMeasured, setHasMeasured] = useState(false);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const widths = Array.from(measure.children)
      .slice(0, valid.length)
      .map(child => (child as HTMLElement).offsetWidth);
    const moreWidth = moreRef.current?.offsetWidth ?? 0;
    const available = container.clientWidth + endOverlapPx;

    const rowWidth = (count: number, includeMore: boolean) => {
      if (count === 0) return includeMore ? moreWidth : 0;
      const itemsWidth = widths
        .slice(0, count)
        .reduce((sum, width, index) => sum + width + (index > 0 ? GAP : 0), 0);
      return includeMore ? itemsWidth + GAP + moreWidth : itemsWidth;
    };

    let count = 0;
    for (let candidate = widths.length; candidate >= 0; candidate -= 1) {
      const needsMore = candidate < widths.length;
      if (rowWidth(candidate, needsMore) <= available) {
        count = candidate;
        break;
      }
    }

    setVisibleCount(count);
    setHasMeasured(true);
  }, [endOverlapPx, valid.length]);

  useIsomorphicLayoutEffect(() => {
    recompute();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [recompute, valid.length]);

  if (!valid.length) return null;

  const visible = hasMeasured ? valid.slice(0, visibleCount) : [];
  const overflow = hasMeasured ? valid.slice(visibleCount) : [];

  return (
    <nav
      ref={containerRef}
      className={['relative z-0 flex min-w-0 flex-1 items-center gap-2', className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Primary"
      aria-busy={!hasMeasured}
    >
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute -left-[9999px] top-0 flex items-center gap-2"
      >
        {valid.map(renderMeasure)}
        <span ref={moreRef} className={navButtonClasses}>
          <Translate>More</Translate>
          <span className="tabular-nums">99</span>
          <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />
        </span>
      </div>

      {visible.map(renderLink)}
      {overflow.length > 0 && <MoreMenu links={overflow} />}
    </nav>
  );
};

export { MenuLinks };
export type { MenuLinksProps };

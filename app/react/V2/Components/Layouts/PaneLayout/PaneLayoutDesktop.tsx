import React, { Fragment, useRef } from 'react';
import { t } from '#app/I18N/index.js';
import { flattenPanes } from './paneChildren.js';
import type { PaneLayoutProps } from './types.js';
import { useDesktopPaneLayout } from './useDesktopPaneLayout.js';

const PaneLayoutDesktop = ({
  children,
  className = '',
  localStorageKey,
  defaultRatios,
  minPaneRatios,
}: PaneLayoutProps) => {
  const panes = flattenPanes(children);
  const { containerRef, widths, onMouseDown, onTouchStart } = useDesktopPaneLayout(panes, {
    localStorageKey,
    defaultRatios,
    minPaneRatios,
  });
  const initialWidths = useRef(defaultRatios?.map(ratio => `${ratio * 100}%`));

  return (
    <div
      ref={containerRef}
      className={`flex h-full min-h-0 overflow-hidden bg-(--color-theme-surface-page) ${className}`}
    >
      {panes.map((child, index) => (
        <Fragment key={child.key ?? index}>
          <section
            style={{ width: widths.length > 0 ? widths[index] : initialWidths.current?.[index] }}
            className="h-full min-h-0"
          >
            <div className="h-full min-h-0 min-w-0 overflow-hidden">{child}</div>
          </section>
          {index < panes.length - 1 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={t('System', 'Resize panels', null, false)}
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="w-1 shrink-0 cursor-col-resize self-stretch border-0 bg-transparent p-0 touch-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-theme-action-primary)_30%,transparent)]"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export { PaneLayoutDesktop };

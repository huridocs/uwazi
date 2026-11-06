import React, { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';

const clampableType = (inheritedType?: string) =>
  inheritedType === 'text' || inheritedType === 'markdown';

const PreviewClamp = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef<string | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const next = ref.current?.textContent ?? '';
    if (seen.current !== undefined && seen.current !== next) {
      setExpanded(false);
    }
    seen.current = next;
  }, [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return undefined;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className="min-w-0">
      <div ref={ref} className={expanded ? 'min-w-0' : 'max-h-24 min-w-0 overflow-hidden'}>
        {children}
      </div>
      {overflows ? (
        <button
          type="button"
          onClick={() => setExpanded(current => !current)}
          className="mt-0.5 text-meta font-medium text-ink-secondary transition-colors hover:text-ink"
        >
          {expanded ? <Translate>Show less</Translate> : <Translate>Show more</Translate>}
        </button>
      ) : null}
    </div>
  );
};

const renderPreviewCell = (
  cell: ReactNode,
  inheritedType: string | undefined,
  preview: boolean
): ReactElement =>
  preview && clampableType(inheritedType) ? <PreviewClamp>{cell}</PreviewClamp> : <>{cell}</>;

export { renderPreviewCell };

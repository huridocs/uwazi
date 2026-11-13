import React, { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';

const clampableType = (inheritedType?: string) =>
  inheritedType === 'text' || inheritedType === 'markdown';

const PreviewClamp = ({ children }: { children: ReactNode }) => {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const seen = useRef<string | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const next = content.current?.textContent ?? '';
    if (seen.current !== undefined && seen.current !== next) {
      setExpanded(false);
    }
    seen.current = next;
  }, [children]);

  useEffect(() => {
    const box = frame.current;
    const inner = content.current;
    if (!box || !inner || expanded) return undefined;
    const measure = () =>
      setOverflows(
        inner.scrollHeight > box.clientHeight + 1 || inner.scrollWidth > box.clientWidth + 1
      );
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className="min-w-0">
      <div ref={frame} className={expanded ? 'min-w-0' : 'max-h-24 min-w-0 overflow-hidden'}>
        <div ref={content} className="min-w-0">
          {children}
        </div>
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

export { PreviewClamp, renderPreviewCell };

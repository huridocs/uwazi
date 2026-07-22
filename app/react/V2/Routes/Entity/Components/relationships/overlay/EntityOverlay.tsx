import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, t, Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import {
  useEntityOverlay,
  useEntityScopedEntity,
  useEntityRelationshipMarkers,
} from '#V2/Routes/Entity/Components/context/index.js';
import { EntityOverlayContent } from './EntityOverlayContent.js';
import { useOverlayEntity } from './useOverlayEntity.js';

const overlaySurfaceStyle = {
  backgroundColor: 'var(--color-theme-surface-raised, var(--color-theme-bg-surface, #ffffff))',
};

const EntityOverlay = () => {
  const { target, closeEntityOverlay } = useEntityOverlay();
  const selfEntity = useEntityScopedEntity();
  const sourceMarkers = useEntityRelationshipMarkers();
  const templates = useAtomValue(templatesAtom);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const { entity, loading, error } = useOverlayEntity(target?.sharedId ?? null);

  const referenceMarkers = useMemo(
    () =>
      target ? sourceMarkers.filter(marker => marker.target.sharedId === target.sharedId) : [],
    [sourceMarkers, target]
  );

  const isOpen = target !== null;
  const title = entity?.title ?? target?.title ?? '';
  const templateColor =
    templates.find(template => template._id === (entity?.template ?? target?.templateId))?.color ??
    '#6B7280';

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel || panel.contains(event.target as Node)) return;
      closeEntityOverlay();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEntityOverlay();
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeEntityOverlay, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        data-testid="entity-overlay-backdrop"
        className="absolute inset-0 z-20 transition-opacity duration-200"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
        }}
        onClick={closeEntityOverlay}
      />
      <div
        ref={panelRef}
        data-testid="entity-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute top-0 right-0 bottom-0 z-21 flex flex-col bg-(--color-theme-surface-raised) transition-transform duration-250 ease-out ${entered ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          ...overlaySurfaceStyle,
          width: 'calc(100% - 12px)',
          borderLeft: '1px solid var(--border-primary)',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="h-2 w-2 shrink-0 rounded-xs"
              style={{ backgroundColor: templateColor }}
            />
            <span id={titleId} className="truncate text-sm font-bold text-ink">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={closeEntityOverlay}
            className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
            aria-label={t('System', 'Close', null, false)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        {loading && (
          <div
            aria-live="polite"
            aria-busy="true"
            className="flex flex-1 items-center justify-center p-4 text-sm text-ink-tertiary"
          >
            <Translate>Loading</Translate>
          </div>
        )}
        {error && !loading && (
          <div
            aria-live="polite"
            className="flex flex-1 items-center justify-center p-4 text-sm text-ink-tertiary"
          >
            <Translate>NO DATA AVAILABLE</Translate>
          </div>
        )}
        {entity && !loading && (
          <ErrorBoundary>
            <EntityOverlayContent
              entity={entity}
              referenceMarkers={referenceMarkers}
              selfSharedId={selfEntity.sharedId}
            />
          </ErrorBoundary>
        )}
        <div
          className="flex h-12 shrink-0 items-center justify-between px-3"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <button
            type="button"
            onClick={closeEntityOverlay}
            className="cursor-pointer rounded-md bg-warm px-3 py-1.5 text-tab font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
          >
            <Translate>Close</Translate>
          </button>
          {target && (
            <I18NLinkV2
              to={`entityv2/${target.sharedId}`}
              onClick={closeEntityOverlay}
              className="cursor-pointer rounded-md px-3 py-1.5 text-tab font-medium text-parchment transition-colors"
              style={{ backgroundColor: 'var(--text-primary)' }}
            >
              <Translate>Open entity</Translate>
            </I18NLinkV2>
          )}
        </div>
      </div>
    </>
  );
};

export { EntityOverlay };

import React, { useEffect, useId, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, t, Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import { useEntityOverlay, useEnsureResolved } from '#V2/Routes/Entity/Components/context/index.js';
import { EntityOverlayContent } from './EntityOverlayContent.js';
import { useOverlayEntity } from './useOverlayEntity.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { getEntityViewerV2Path, isEntityViewerV2Enabled } from '#app/utils/entityViewerPaths.js';

const overlaySurfaceStyle = {
  backgroundColor: 'var(--color-theme-surface-raised, var(--color-theme-bg-surface, #ffffff))',
};

const useOverlayEnter = (isOpen: boolean, ensureResolved: () => Promise<unknown>) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return undefined;
    }
    ensureResolved().catch(() => undefined);
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [ensureResolved, isOpen]);
  return entered;
};

const useOverlayDismiss = (
  isOpen: boolean,
  closeEntityOverlay: () => void,
  panelRef: React.RefObject<HTMLDivElement | null>
) => {
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
  }, [closeEntityOverlay, isOpen, panelRef]);
};

const overlayHeading = (
  entity: { title?: string; template?: string } | null | undefined,
  target: { title?: string; templateId?: string } | null,
  templates: Array<{ _id: string; color?: string }>
) => ({
  title: entity?.title ?? target?.title ?? '',
  templateColor:
    templates.find(template => template._id === (entity?.template ?? target?.templateId))?.color ??
    '#6B7280',
});

const useEntityOverlayState = () => {
  const { target, closeEntityOverlay } = useEntityOverlay();
  const ensureResolved = useEnsureResolved();
  const templates = useAtomValue(templatesAtom);
  const settings = useAtomValue(settingsAtom);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { entity, loading, error } = useOverlayEntity(target?.sharedId ?? null);
  const entered = useOverlayEnter(target !== null, ensureResolved);
  useOverlayDismiss(target !== null, closeEntityOverlay, panelRef);
  return {
    target,
    closeEntityOverlay,
    settings,
    panelRef,
    titleId,
    entity,
    loading,
    error,
    isOpen: target !== null,
    entered,
    ...overlayHeading(entity, target, templates),
  };
};

const EntityOverlay = () => {
  const overlay = useEntityOverlayState();
  if (!overlay.isOpen) return null;
  const {
    target,
    closeEntityOverlay,
    settings,
    panelRef,
    titleId,
    entity,
    loading,
    error,
    entered,
    title,
    templateColor,
  } = overlay;

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
            <EntityOverlayContent entity={entity} />
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
              to={getEntityViewerV2Path(
                target.sharedId,
                isEntityViewerV2Enabled(settings.features)
              ).replace(/^\//, '')}
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

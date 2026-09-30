/* eslint-disable react/no-multi-comp */
import React, { useEffect, useId, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, t, Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { EntityOverlaySheet } from './EntityOverlaySheet.js';
import {
  useEntityOverlayActions,
  useEntityOverlayTarget,
  type OverlayTarget,
} from '../../context/EntityOverlayContext.js';
import { useEnsureResolved } from '../../context/RelationshipsQueryProvider.js';
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

const useOverlayChrome = () => ({
  settings: useAtomValue(settingsAtom),
  templates: useAtomValue(templatesAtom),
  titleId: useId(),
});

const useEntityOverlayState = (pinned?: OverlayTarget) => {
  const { target: top } = useEntityOverlayTarget();
  const { closeEntityOverlay } = useEntityOverlayActions();
  const target = pinned ?? top;
  const overlayEntity = useOverlayEntity(target?.sharedId ?? null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { settings, templates, titleId } = useOverlayChrome();
  return {
    ...overlayEntity,
    target,
    closeEntityOverlay,
    settings,
    panelRef,
    titleId,
    isOpen: target !== null,
    ...overlayHeading(overlayEntity.entity, target, templates),
  };
};

type EntityOverlayModel = ReturnType<typeof useEntityOverlayState>;

const EntityOverlayPanel = ({
  overlay,
  onBack,
}: {
  overlay: ReturnType<typeof useEntityOverlayState>;
  onBack?: () => void;
}) => {
  const {
    target,
    closeEntityOverlay,
    settings,
    panelRef,
    titleId,
    entity,
    loading,
    error,
    title,
    templateColor,
  } = overlay;
  const ensureResolved = useEnsureResolved();
  const entered = useOverlayEnter(overlay.isOpen, ensureResolved);
  useOverlayDismiss(overlay.isOpen, closeEntityOverlay, panelRef);

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
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={t('System', 'Back', null, false)}
                className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
              >
                <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </button>
            ) : null}
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
          className="flex h-12 shrink-0 items-center justify-end gap-2 px-3"
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
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-ink px-3 py-1.5 text-tab font-medium text-ink transition-colors hover:bg-warm"
            >
              <Translate>Open entity</Translate>
              <ArrowRightIcon className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </I18NLinkV2>
          )}
        </div>
      </div>
    </>
  );
};

const EntityOverlayLevel = ({
  target,
  level,
  onClose,
}: {
  target: OverlayTarget;
  level: number;
  onClose: () => void;
}) => {
  const overlay = useEntityOverlayState(target);
  return <EntityOverlaySheet overlay={overlay} onClose={onClose} level={level} />;
};

const EntityOverlayStack = () => {
  const { stack } = useEntityOverlayTarget();
  const { closeOverlayFrom } = useEntityOverlayActions();
  return stack.map((item, level) => (
    <EntityOverlayLevel
      key={item.id}
      target={item}
      level={level}
      onClose={() => closeOverlayFrom(level)}
    />
  ));
};

const EntityOverlayDesktop = () => {
  const overlay = useEntityOverlayState();
  const { stack } = useEntityOverlayTarget();
  const { closeOverlayFrom } = useEntityOverlayActions();
  if (!overlay.isOpen) return null;
  const onBack = stack.length > 1 ? () => closeOverlayFrom(stack.length - 1) : undefined;
  return <EntityOverlayPanel overlay={overlay} onBack={onBack} />;
};

const EntityOverlay = () => (useIsMobile() ? <EntityOverlayStack /> : <EntityOverlayDesktop />);

export type { EntityOverlayModel };
export { EntityOverlay };

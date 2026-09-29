import React, { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import { MobileBottomSheet } from '#V2/Components/Layouts/PaneLayout/MobileBottomSheet.js';
import { SHEET_OVERLAY_ORDER } from '#V2/Components/Layouts/PaneLayout/sheetStack.js';
import { getEntityViewerV2Path, isEntityViewerV2Enabled } from '#app/utils/entityViewerPaths.js';
import { EntityOverlayContent } from './EntityOverlayContent.js';
import type { EntityOverlayModel } from './EntityOverlay.js';

const ghost =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-tab font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink';

const entityHref = (overlay: EntityOverlayModel) =>
  overlay.target
    ? getEntityViewerV2Path(
        overlay.target.sharedId,
        isEntityViewerV2Enabled(overlay.settings.features)
      ).replace(/^\//, '')
    : '';

const EntityOverlaySheet = ({
  overlay,
  onClose,
  level,
}: {
  overlay: EntityOverlayModel;
  onClose: () => void;
  level: number;
}) => {
  const { closeEntityOverlay, titleId, entity, loading, error, title, templateColor, target } =
    overlay;
  const [painted, setPainted] = useState(false);
  useEffect(() => {
    setPainted(true);
  }, []);
  const showBody = painted && entity && !loading;

  return (
    <MobileBottomSheet
      open
      bare
      order={SHEET_OVERLAY_ORDER + level}
      ariaLabel={title || 'Entity'}
      defaultSnap="full"
      onClose={onClose}
    >
      {chrome => (
        <div className="flex h-full min-h-0 flex-col bg-(--color-theme-surface-raised)">
          <div
            className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            <div className="flex min-w-0 items-center gap-2">
              {chrome.back}
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
              onClick={chrome.close}
              data-part="close"
              aria-label={chrome.closeLabel}
              className="inline-flex shrink-0 items-center gap-1 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden />
              {chrome.stacked ? <span>{chrome.closeLabel}</span> : null}
            </button>
          </div>
          {!showBody && !error && (
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
          {showBody && entity && (
            <ErrorBoundary>
              <div className="min-h-0 flex-1 overflow-auto">
                <EntityOverlayContent entity={entity} />
              </div>
            </ErrorBoundary>
          )}
          <div
            className="flex h-12 shrink-0 items-center justify-end gap-2 px-3"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            {chrome.stacked ? (
              <button type="button" onClick={chrome.pop} className={ghost}>
                <ArrowLeftIcon className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                <Translate>Back</Translate>
              </button>
            ) : (
              <button type="button" onClick={onClose} className={ghost}>
                <Translate>Close</Translate>
              </button>
            )}
            {target && (
              <I18NLinkV2
                to={entityHref(overlay)}
                onClick={closeEntityOverlay}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-ink px-3 py-1.5 text-tab font-medium text-ink transition-colors hover:bg-warm"
              >
                <Translate>Open entity</Translate>
                <ArrowRightIcon className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
              </I18NLinkV2>
            )}
          </div>
        </div>
      )}
    </MobileBottomSheet>
  );
};

export { EntityOverlaySheet };

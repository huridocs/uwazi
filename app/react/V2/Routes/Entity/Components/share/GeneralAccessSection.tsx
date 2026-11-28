import React from 'react';
import { ExclamationTriangleIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import {
  SegmentedControlItem,
  SegmentedControlRoot,
} from '#V2/Components/UI/SegmentedControl/index.js';
import { isVisibility, shareSectionLabelClass, type Visibility } from './shareUtils.js';

type GeneralAccessSectionProps = {
  visibility: Visibility;
  disabled: boolean;
  showPublicTip: boolean;
  publicTipId: string;
  generalAccessRef: React.RefObject<HTMLDivElement | null>;
  onChange: (next: Visibility) => void;
};

const GeneralAccessSection = ({
  visibility,
  disabled,
  showPublicTip,
  publicTipId,
  generalAccessRef,
  onChange,
}: GeneralAccessSectionProps) => {
  const isPublished = visibility === 'published';

  return (
    <section className="space-y-2 border-b border-border/50 px-5 pt-3 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={shareSectionLabelClass}>
          <Translate>General access</Translate>
        </h4>
        <div ref={generalAccessRef} className="relative">
          <SegmentedControlRoot
            ariaLabel={t('System', 'General access', null, false)}
            disabled={disabled}
            size="md"
            value={visibility}
            onValueChange={next => {
              if (isVisibility(next)) onChange(next);
            }}
          >
            <SegmentedControlItem
              value="private"
              ariaLabel={t('System', 'Private', null, false)}
              className="gap-1.5 px-2.5"
            >
              <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">
                <Translate>Private</Translate>
              </span>
            </SegmentedControlItem>
            <SegmentedControlItem
              value="published"
              ariaLabel={t('System', 'Published', null, false)}
              ariaDescribedBy={showPublicTip ? publicTipId : undefined}
              className={`gap-1.5 px-2.5 ${
                isPublished ? 'bg-ink! text-parchment! [&_svg]:text-parchment!' : ''
              }`}
            >
              <GlobeAltIcon className="h-3 w-3 shrink-0" aria-hidden />
              <span className={`whitespace-nowrap ${isPublished ? 'text-parchment' : ''}`}>
                <Translate>Published</Translate>
              </span>
            </SegmentedControlItem>
          </SegmentedControlRoot>
          {showPublicTip ? (
            <div
              id={publicTipId}
              role="tooltip"
              className="pointer-events-none absolute inset-e-0 top-full z-20 mt-1.5 w-56 rounded-md border border-border bg-paper px-2.5 py-1.5 text-meta font-medium leading-snug text-ink shadow-sm"
            >
              <Translate translationKey="Public entities description">
                Caution: the selected entities will be public. Anyone will be able to see them.
              </Translate>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-4 items-center gap-2">
        {isPublished && !showPublicTip ? (
          <p className="flex items-center gap-1 text-meta leading-tight text-ink-secondary">
            <ExclamationTriangleIcon className="h-3 w-3 shrink-0 text-warning" aria-hidden />
            <Translate>Anyone can see this entity</Translate>
          </p>
        ) : null}
      </div>
    </section>
  );
};

export type { GeneralAccessSectionProps };
export { GeneralAccessSection };

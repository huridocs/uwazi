import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from './Button.js';

type CookieConsentBannerProps = {
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
  onRejectAll: () => void;
};

const CookieConsentBanner = ({
  onAcceptAll,
  onEssentialOnly,
  onRejectAll,
}: CookieConsentBannerProps) => (
  <div
    className="w-[min(24rem,100%)] rounded-lg border border-border bg-paper p-4 shadow-lg"
    role="dialog"
    aria-labelledby="cookie-consent-title"
    aria-live="polite"
    data-testid="cookie-consent-banner"
  >
    <div className="flex items-start gap-2.5">
      <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-supporting" aria-hidden />
      <p id="cookie-consent-title" className="text-xs leading-relaxed text-ink-secondary">
        <Translate>
          This site uses cookies for language preferences and analytics. Session cookies are only
          set when you log in.
        </Translate>
      </p>
    </div>
    <div className="mt-3 flex flex-wrap justify-end gap-1.5">
      <Button
        variant="ghost"
        size="small"
        onClick={onRejectAll}
        data-testid="cookie-consent-reject-all"
      >
        <Translate>Reject all</Translate>
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={onEssentialOnly}
        data-testid="cookie-consent-essential"
      >
        <Translate>Only essential</Translate>
      </Button>
      <Button
        variant="primary"
        size="small"
        onClick={onAcceptAll}
        data-testid="cookie-consent-accept-all"
      >
        <Translate>Accept all</Translate>
      </Button>
    </div>
  </div>
);

export { CookieConsentBanner };
export type { CookieConsentBannerProps };

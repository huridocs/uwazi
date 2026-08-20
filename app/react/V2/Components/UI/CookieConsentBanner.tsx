import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from './Button.js';

type CookieConsentBannerProps = {
  onAccept: () => void;
  onReject: () => void;
};

const CookieConsentBanner = ({ onAccept, onReject }: CookieConsentBannerProps) => (
  <div
    className="border-t border-border bg-paper shadow-[0_-4px_24px_var(--tw-shadow-color)]"
    role="dialog"
    aria-labelledby="cookie-consent-title"
    aria-live="polite"
    data-testid="cookie-consent-banner"
  >
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <InformationCircleIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-supporting"
          aria-hidden
        />
        <p id="cookie-consent-title" className="text-sm leading-relaxed text-ink-secondary">
          <Translate>
            This site uses cookies for language preferences and analytics. Session cookies are only
            set when you log in.
          </Translate>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          onClick={onReject}
          data-testid="cookie-consent-reject"
        >
          <Translate>Reject non-essential</Translate>
        </Button>
        <Button
          variant="primary"
          size="medium"
          onClick={onAccept}
          data-testid="cookie-consent-accept"
        >
          <Translate>Accept all</Translate>
        </Button>
      </div>
    </div>
  </div>
);

export { CookieConsentBanner };
export type { CookieConsentBannerProps };

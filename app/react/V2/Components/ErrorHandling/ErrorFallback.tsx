import React, { useId, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { RequestError } from '#V2/shared/errorUtils.js';

interface ErrorFallbackProps {
  error: Error | RequestError;
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const detailsToggleId = useId();
  const currentError = error as RequestError;
  const showRequestId = currentError.status === 500 && currentError.requestId;

  return (
    <div className="tw-content">
      <section className="h-full bg-white">
        <div className="max-w-(--breakpoint-xl) px-4 py-8 mx-auto lg:py-16 lg:px-6">
          <div className="max-w-(--breakpoint-sm) mx-auto text-center">
            {currentError.status && (
              <h1 className="mb-4 font-extrabold tracking-tight text-gray-500 text-7xl lg:text-9xl ">
                {currentError.status}
              </h1>
            )}
            <p className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl ">
              {error.name && <Translate>{currentError.name}</Translate>}
              {!error.name && <Translate>Well, this is awkward...</Translate>}
            </p>
            {error.message && (
              <p
                data-testid="errorInfo"
                className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400"
              >
                <Translate>{currentError.message}</Translate>
                {showRequestId && (
                  <span data-testid="requestId">
                    .&nbsp;<Translate>Request id #</Translate>
                    {currentError.requestId}
                  </span>
                )}
              </p>
            )}
            {currentError.stack && (
              <div className="mb-4 text-left grid justify-center">
                <button
                  type="button"
                  id={detailsToggleId}
                  aria-expanded={detailsOpen}
                  aria-controls={detailsId}
                  onClick={() => setDetailsOpen(open => !open)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                  {detailsOpen ? (
                    <Translate>Hide details</Translate>
                  ) : (
                    <Translate>Show details</Translate>
                  )}
                </button>
                {detailsOpen && (
                  <pre
                    id={detailsId}
                    aria-labelledby={detailsToggleId}
                    className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-gray-500 dark:text-gray-400"
                  >
                    {currentError.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

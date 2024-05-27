import React from 'react';
import { Translate } from 'app/I18N';
import type { RequestError } from 'V2/shared/errorUtils';

interface ErrorFallbackProps {
  error: Error | RequestError;
}
export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  const currentError = error as RequestError;
  const showRequestId = currentError.status === 500 && currentError.requestId;
  return (
    <div className="tw-content">
      <section className="bg-white">
        <div className="max-w-screen-xl px-4 py-8 mx-auto lg:py-16 lg:px-6">
          <div className="max-w-screen-sm mx-auto text-center">
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
          </div>
        </div>
      </section>
    </div>
  );
};

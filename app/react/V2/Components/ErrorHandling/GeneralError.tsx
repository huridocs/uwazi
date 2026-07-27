import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router';
import has from 'lodash/has.js';

import { Footer } from '#app/App/Footer.js';
import { searchParamsFromSearchParams } from '#app/utils/routeHelpers.js';
import { t } from '#app/I18N/index.js';
import { handledErrors } from '#V2/shared/errorUtils.js';
import { ErrorFallback } from './ErrorFallback.js';

const GeneralError = () => {
  const { errorCode } = useParams();
  const [searchParams] = useSearchParams();

  const { requestId } = searchParamsFromSearchParams(searchParams);
  const { status } =
    errorCode && has(handledErrors, errorCode) ? handledErrors[errorCode] : handledErrors[404];
  const safeRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(
    requestId
  );
  const error = handledErrors[status!];
  error.requestId = safeRequestId ? safeRequestId[0] : undefined;

  error.name = t('System', error.name, null, false);

  return (
    <div>
      <Helmet>
        <title>{error.name}</title>
      </Helmet>
      <ErrorFallback error={error} />
      <Footer />
    </div>
  );
};

export { GeneralError };

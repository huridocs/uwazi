import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router-dom';
import { has } from 'lodash';
import Footer from 'app/App/Footer';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { t } from 'app/I18N';
import { handledErrors } from 'V2/shared/errorUtils';
import { ErrorFallback } from './ErrorFallback';

const GeneralError = () => {
  const { errorCode } = useParams();
  const [searchParams] = useSearchParams();

  const { requestId } = searchParamsFromSearchParams(searchParams);
  const { status } =
    errorCode && has(handledErrors, errorCode) ? handledErrors[errorCode] : handledErrors[404];
  const safeRequestId = /^[0-9-]{4}$/.exec(requestId);
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

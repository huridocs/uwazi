import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router';
import { has } from 'lodash';
// @ts-expect-error TS(2307): Cannot find module '../../App/Footer.js' or its co... Remove this comment to see the full error message
import Footer from '../../App/Footer.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/routeHelpers.js' o... Remove this comment to see the full error message
import { searchParamsFromSearchParams } from '../../utils/routeHelpers.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { t } from '../../I18N/index.js';
import { handledErrors } from 'shared/errorUtils.js';
import { ErrorFallback } from './ErrorFallback.js';

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

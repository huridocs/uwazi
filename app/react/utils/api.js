import { redirect } from 'react-router-dom';
import { isClient } from 'app/utils';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import loadingBar from 'app/App/LoadingProgressBar';
import { t } from 'app/I18N';

import { APIURL } from '../config.js';
import request from '../../shared/JSONRequest';

let API_URL = APIURL;
let language;

const doneLoading = data => {
  loadingBar.done();
  return data;
};

const isNonUsualApiError = error => error.status && ![401, 404, 409, 500].includes(error.status);

const errorMessages = [
  {
    key: /PayloadTooLargeError: request entity too large/g,
    message: 'Request data too large. Please review text length in property values',
  },
  {
    key: /ERROR Failed to index documents: (.+)/g,
    message: 'Failed to index documents: {0} ',
  },
];

function extractMessageFromError(error) {
  let finalMessage = `An error has occurred, it has been logged with request id #${error.json.requestId}.`;
  if (!error.json.error) return finalMessage;

  const errorMessage = errorMessages.find(errorExpression =>
    error.json.error.match(errorExpression.key)
  );
  if (errorMessage) {
    const matches = errorMessage.key.exec(error.json.error);
    finalMessage = errorMessage.message;
    for (let i = 0; i < matches.length - 1; i += 1) {
      finalMessage = finalMessage.replace(`{${i}}`, matches[1]);
    }
  }
  return finalMessage;
}

function extractMessageFromValidation(error) {
  if (!error.json.validations) return error.json.error;
  return error.json.validations.reduce(
    (message, validationError) =>
      `${message} ${validationError.instancePath} ${validationError.message},`,
    `${error.json.error}: `
  );
}

// eslint-disable-next-line max-statements
const handleErrorStatus = error => {
  let errorMessage;
  switch (error.status || true) {
    case 400:
    case 422: {
      errorMessage = extractMessageFromValidation(error);
      store.dispatch(
        notify(t('System', extractMessageFromValidation(error), null, false), 'danger')
      );
      break;
    }

    case 401:
      redirect('/login');
      break;

    case 404:
      redirect('/404');
      break;

    case 409: {
      errorMessage = error.json.error;
      store.dispatch(notify(t('System', error.json.error, null, false), 'warning'));
      break;
    }
    case 500: {
      errorMessage = extractMessageFromError(error);
      store.dispatch(notify(t('System', extractMessageFromError(error), null, false), 'danger'));
      break;
    }
    case isNonUsualApiError(error): {
      errorMessage = error.json.prettyMessage || error.json.error;
      store.dispatch(
        notify(t('System', error.json.prettyMessage || error.json.error, null, false), 'danger')
      );
      break;
    }
    case error instanceof TypeError: {
      errorMessage = 'Could not reach server. Please try again later.';
      store.dispatch(
        notify(
          t('System', 'Could not reach server. Please try again later.', null, false),
          'danger'
        )
      );
      break;
    }
    default: {
      errorMessage = 'An error occurred';
      store.dispatch(notify(t('System', 'An error occurred', null, false), 'danger'));
    }
  }
  return errorMessage;
};

const handleError = (e, endpoint) => {
  const error = e;
  error.endpoint = endpoint;

  if (!isClient) {
    return Promise.reject(error);
  }

  doneLoading();

  const errorMessage = handleErrorStatus(error);
  return Promise.reject(new Error(errorMessage));
};

const _request = (url, req, method) => {
  loadingBar.start();
  return request[method](API_URL + url, req.data, {
    'Content-Language': language,
    ...req.headers,
    'X-Requested-With': 'XMLHttpRequest',
  })
    .then(doneLoading)
    .catch(e => handleError(e, { url, method }));
};

export default {
  get: (url, req = {}) => _request(url, req, 'get'),

  post: (url, req = {}) => _request(url, req, 'post'),

  put: (url, req = {}) => _request(url, req, 'put'),

  delete: (url, req = {}) => _request(url, req, 'delete'),

  cookie(c) {
    request.cookie(c);
  },

  locale(locale) {
    language = locale;
  },

  APIURL(url) {
    API_URL = url;
  },
};

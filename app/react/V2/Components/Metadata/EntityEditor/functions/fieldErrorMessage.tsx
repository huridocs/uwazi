import React from 'react';
import type { FieldError } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';

const getFieldErrorMessage = (error?: FieldError): React.ReactNode | undefined => {
  if (!error) {
    return undefined;
  }

  if (typeof error.message === 'string' && error.message.length > 0) {
    return <Translate>{error.message}</Translate>;
  }

  return <Translate>This field is required</Translate>;
};

export { getFieldErrorMessage };

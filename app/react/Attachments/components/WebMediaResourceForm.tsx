import { Field } from 'react-redux-form';
import { Icon } from 'UI';
import React, { useState } from 'react';
import { FormGroup } from 'app/Forms';
import { LocalForm } from 'app/Forms/Form';
import { Translate, t } from 'app/I18N';
import { isValidUrl, sanitizeUrl, isValidUrlLength } from 'shared/urlValidationUtils';

interface WebMediaResourceFormProps {
  handleSubmit: (args: any) => void;
  dispatch?: (dispatch: Function) => void;
  url?: string | null;
  hasName?: boolean;
}

const WebMediaResourceForm = ({
  handleSubmit,
  url,
  dispatch,
  hasName = false,
}: WebMediaResourceFormProps) => {
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const getInputClassName = () => {
    if (hasBeenTouched && !isUrlValid) {
      return 'form-control has-error web-attachment-url border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    if (hasBeenTouched && isUrlValid) {
      return 'form-control web-attachment-url border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    return 'form-control web-attachment-url border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  };

  const getButtonClassName = () => {
    if (hasBeenTouched && !isUrlValid) {
      return 'btn opacity-50 cursor-not-allowed';
    }
    return 'btn hover:bg-blue-600';
  };

  const handleFormSubmit = (formData: any) => {
    if (formData.url && typeof formData.url === 'string' && formData.url.trim() !== '') {
      const sanitized = sanitizeUrl(formData.url);
      const isValid = isValidUrl(sanitized) && isValidUrlLength(sanitized);

      if (!isValid) {
        setIsUrlValid(false);
        setHasBeenTouched(true);
        return;
      }

      const sanitizedFormData = {
        ...formData,
        url: sanitized,
      };
      handleSubmit(sanitizedFormData);
    } else {
      // Don't submit if URL is empty or invalid
      setIsUrlValid(false);
      setHasBeenTouched(true);
    }
  };

  const validators = {
    ...(hasName && { name: { required: (val: any) => !!val && val.trim() !== '' } }),
    url: {
      required: (val: any) => !!val && val.trim() !== '',
      validUrl: (val: any) => {
        if (!val || typeof val !== 'string') return false;
        const sanitized = sanitizeUrl(val);
        return isValidUrl(sanitized) && isValidUrlLength(sanitized);
      },
    },
  };

  return (
    <LocalForm
      onSubmit={handleFormSubmit}
      getDispatch={dispatch}
      model="urlForm"
      validators={validators}
      initialState={{ url }}
      className={!hasName ? 'select-from-link' : ''}
    >
      <FormGroup className="has-feedback" model=".url">
        <Field model=".url">
          <input
            type="text"
            className={getInputClassName()}
            placeholder={t('System', 'Paste URL here', null, false)}
            maxLength={2048}
          />
        </Field>
      </FormGroup>
      {hasName && (
        <FormGroup className="form-group" model=".name">
          <Field model=".name" className="field">
            <input
              type="text"
              className="form-control web-attachment-name"
              placeholder={t('System', 'Title', null, false)}
            />
          </Field>
        </FormGroup>
      )}
      <button
        type="submit"
        className={getButtonClassName()}
        disabled={hasBeenTouched && !isUrlValid}
      >
        <Icon icon="link" />
        &nbsp; <Translate>Add from URL</Translate>
      </button>
    </LocalForm>
  );
};

export { WebMediaResourceForm };

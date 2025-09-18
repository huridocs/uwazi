import { Field } from 'react-redux-form';
import { Icon } from 'UI';
import React, { useState } from 'react';
import { FormGroup } from 'app/Forms';
import { LocalForm } from 'app/Forms/Form';
import { Translate, t } from 'app/I18N';
import { isValidUrl, sanitizeUrl } from 'shared/urlValidationUtils';

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
  const [urlValue, setUrlValue] = useState(url || '');
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrlValue(value);
    setHasBeenTouched(true);

    if (value.trim() === '') {
      setIsUrlValid(true);
    } else {
      const sanitized = sanitizeUrl(value);
      const isValid = isValidUrl(sanitized);
      setIsUrlValid(isValid);
    }
  };

  const getInputClassName = () => {
    if (hasBeenTouched && !isUrlValid) {
      return 'form-control web-attachment-url border-red-500 focus:border-red-500 focus:ring-red-500';
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
    if (formData.url && typeof formData.url === 'string') {
      const sanitizedFormData = {
        ...formData,
        url: sanitizeUrl(formData.url),
      };
      handleSubmit(sanitizedFormData);
    } else {
      handleSubmit(formData);
    }
  };

  const validators = {
    ...(hasName && { name: { required: (val: any) => !!val && val.trim() !== '' } }),
    url: {
      required: (val: any) => !!val && val.trim() !== '',
      validUrl: (val: any) => {
        if (!val || typeof val !== 'string') return false;
        const sanitized = sanitizeUrl(val);
        return isValidUrl(sanitized);
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
            value={urlValue}
            onChange={e => handleUrlChange(e.target.value)}
            className={getInputClassName()}
            placeholder={t('System', 'Paste URL here', null, false)}
          />
        </Field>
        {hasBeenTouched && !isUrlValid && (
          <div className="mt-1 text-sm text-red-600 flex items-center">
            <Icon icon="exclamation-triangle" />
          </div>
        )}
        {hasBeenTouched && isUrlValid && urlValue.trim() !== '' && (
          <div className="mt-1 text-sm text-green-600 flex items-center">
            <Icon icon="check" />
          </div>
        )}
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

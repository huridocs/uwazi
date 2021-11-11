import { Field, LocalForm } from 'react-redux-form';
import Tip from 'app/Layout/Tip';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import React from 'react';
import { FormGroup } from 'app/Forms';

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
  const validators = {
    ...(hasName && { name: { required: (val: any) => !!val && val.trim() !== '' } }),
    url: { required: (val: any) => !!val && val.trim() !== '' },
  };

  return (
    <LocalForm
      onSubmit={handleSubmit}
      getDispatch={dispatch}
      model="urlForm"
      validators={validators}
      initialState={{ url }}
    >
      <FormGroup className="has-feedback" model=".url">
        <Field model=".url">
          <input
            type="text"
            className="form-control web-attachment-url"
            placeholder="Paste URL here"
          />
        </Field>
        <Tip icon="info-circle" position="right">
          <p>
            <Translate>To get resource from web:</Translate>
          </p>
          <p>
            <Translate>
              1. Right-click an image or video on the web and copy the image's URL. Altenatively
              websites offers share button whereyou can get URL.
            </Translate>
          </p>
          <p>
            <Translate>
              2. Return here and paste the URL in this field (Ctrl+V or Command+V)
            </Translate>
          </p>
        </Tip>
      </FormGroup>

      {hasName && (
        <FormGroup className="form-group" model=".name">
          <Field model=".name" className="field">
            <input type="text" className="form-control web-attachment-name" placeholder="Title" />
          </Field>
        </FormGroup>
      )}

      <button type="submit" className="btn btn-success">
        <Icon icon="link" />
        &nbsp; <Translate>Add resource</Translate>
      </button>
    </LocalForm>
  );
};

export { WebMediaResourceForm };

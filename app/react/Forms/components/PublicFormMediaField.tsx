import { Field, LocalForm } from 'react-redux-form';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import React from 'react';
import { FormGroup } from 'app/Forms';

interface PublicFormMediaFieldProps {
  handleSubmit: (args: any) => void;
  dispatch?: (dispatch: Function) => void;
  file?: any;
}

const FileInput = props => {
  return props ? <input type="file" value={value} /> : <></>;
};

const PublicFormMediaField = ({ handleSubmit, file, dispatch }: PublicFormMediaFieldProps) => (
  <LocalForm
    onSubmit={handleSubmit}
    getDispatch={dispatch}
    model="fileForm"
    initialState={{ file }}
  >
    <FormGroup className="has-feedback" model=".file">
      <Field model=".file" component={FileInput} />
    </FormGroup>

    <button type="submit" className="btn btn-success">
      <Icon icon="link" />
      &nbsp; <Translate>Add resource</Translate>
    </button>
  </LocalForm>
);

export { PublicFormMediaField };

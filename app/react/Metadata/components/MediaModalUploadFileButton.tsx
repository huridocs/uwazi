import { Icon } from 'app/UI';
import React from 'react';
import { Field } from 'react-redux-form';
import { Translate } from 'app/I18N';

type componentProps = {
  formModel: string;
  acceptedFileTypes: 'image/*' | 'video/*';
  inputFileRef: React.MutableRefObject<HTMLInputElement | null>;
  handleUploadButtonClicked: () => void;
  handleFileInPublicForm: (event: React.FormEvent<HTMLInputElement>) => void;
  handleInputFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export const MediaModalUploadFileButton = ({
  formModel,
  acceptedFileTypes,
  inputFileRef,
  handleFileInPublicForm,
  handleUploadButtonClicked,
  handleInputFileChange,
}: componentProps) => {
  if (formModel === 'publicform') {
    return (
      <Field
        aria-label="fileInput"
        model=".file"
        component="input"
        type="file"
        onChange={handleFileInPublicForm}
        accept={acceptedFileTypes}
      />
    );
  }

  return (
    <div className="upload-button">
      <button type="button" onClick={handleUploadButtonClicked} className="btn">
        <Icon icon="cloud-upload-alt" />
        &nbsp; <Translate>Select from computer</Translate>
      </button>
      <input
        aria-label="fileInput"
        type="file"
        onChange={handleInputFileChange}
        style={{ display: 'none' }}
        ref={inputFileRef}
        accept={acceptedFileTypes}
      />
    </div>
  );
};

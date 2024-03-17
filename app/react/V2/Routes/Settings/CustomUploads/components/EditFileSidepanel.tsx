/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { getFileNameAndExtension } from 'V2/shared/formatHelpers';
import { notificationAtom } from 'V2/atoms';
import { update } from 'V2/api/files';

type EditFileSidepanelProps = {
  showSidepanel: boolean;
  closeSidepanel: () => any;
  file?: FileType;
};

const EditFileSidepanel = ({ showSidepanel, closeSidepanel, file }: EditFileSidepanelProps) => {
  const { name, extension } = getFileNameAndExtension(file?.originalname);
  const revalidator = useRevalidator();
  const setNotifications = useSetRecoilState(notificationAtom);

  const notify = (response: FileType | FetchResponseError) => {
    const hasErrors = response instanceof FetchResponseError;

    if (!hasErrors) {
      setNotifications({
        type: 'success',
        text: <Translate>File updated</Translate>,
      });
    }

    if (hasErrors) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: response.message,
      });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {},
    values: { filename: name },
  });

  const save = async (data: { filename: string } | { filename: undefined }) => {
    const updatedFile: FileType = { ...file, originalname: `${data.filename}.${extension}` };
    const response = await update(updatedFile);
    closeSidepanel();
    notify(response);
    revalidator.revalidate();
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={isSubmitting ? () => {} : closeSidepanel}
      title={<Translate>Edit File</Translate>}
    >
      <form onSubmit={handleSubmit(save)} className="flex flex-col h-full" id="file-edit-form">
        <Sidepanel.Body>
          <Card title={<Translate>General Information</Translate>}>
            <div className="mb-4">
              <InputField
                label={<Translate className="block mb-1 font-semibold">File name</Translate>}
                id="filename"
                errorMessage={errors.filename?.type === 'required' && 'This field is required'}
                autoComplete="off"
                className="mb-1"
                {...register('filename', {
                  required: true,
                })}
              />
            </div>
          </Card>
        </Sidepanel.Body>
      </form>
      <Sidepanel.Footer>
        <div className="flex gap-2 w-full">
          <Button className="grow" styling="light" disabled={isSubmitting} onClick={closeSidepanel}>
            <Translate>Cancel</Translate>
          </Button>
          <Button className="grow" type="submit" disabled={isSubmitting} form="file-edit-form">
            <Translate>Save</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { EditFileSidepanel };

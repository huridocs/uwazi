import React, { useEffect } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import uniqueID from 'shared/uniqueID';

interface ThesauriGroupFormSidepanelProps {
  closePanel: () => void;
  value?: ThesaurusValueSchema;
  submit: SubmitHandler<ThesaurusValueSchema>;
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const ThesauriGroupFormSidepanel = ({
  submit,
  closePanel,
  value,
  showSidepanel,
  setShowSidepanel,
}: ThesauriGroupFormSidepanelProps) => {
  const {
    reset,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusValueSchema & { groupId: string }>({
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (value) {
      reset(value);
    } else {
      reset({ label: '', values: [{ label: '', id: uniqueID() }], id: uniqueID() });
    }
  }, [value]);

  const curateBeforeSubmit = (tValue: ThesaurusValueSchema) => {
    const filteredValues = tValue.values?.filter(fValue => fValue.label && fValue.label !== '');
    submit({ label: tValue.label, id: tValue.id, values: filteredValues });
  };

  const closeSidepanel = () => {
    reset({ label: '', values: [{ label: '', id: uniqueID() }], id: uniqueID() });
    setShowSidepanel(false);
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={value ? <Translate>Edit group</Translate> : <Translate>Add group</Translate>}
    >
      <form
        onSubmit={handleSubmit(curateBeforeSubmit)}
        id="group-thesauri-form"
        className="flex flex-col h-full"
      >
        <Sidepanel.Body>
          {!value && (
            <div className="p-4 mb-4 border rounded-md shadow-sm border-gray-50 bg-primary-100 text-primary-700">
              <div className="flex items-center w-full gap-1 text-base font-semibold">
                <div className="w-5 h-5 text-sm">
                  <CheckCircleIcon />
                </div>
                <Translate>Adding a group and its items.</Translate>
              </div>
              <div className="force-ltr">
                <Translate>You can add one or many items in this form.</Translate>
                <br />
                <Translate translationKey="thesauri new group desc">
                  Each item created will live inside this group. Once you type the first item name,
                  a new item form will appear underneath it, so you can keep on adding as many as
                  you want.
                </Translate>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(curateBeforeSubmit)} id="menu-form">
            <Card title={<Translate>Group</Translate>}>
              <div className="flex flex-col gap-4">
                <InputField
                  id="group-name"
                  data-testid="thesauri-form-item-name"
                  label={<Translate>Name</Translate>}
                  {...register('label', { required: true })}
                  hasErrors={!!errors.label}
                  clearFieldAction={() => setValue('label', '')}
                />
              </div>
            </Card>
          </form>
        </Sidepanel.Body>
        <Sidepanel.Footer className="bottom-0">
          <div className="flex gap-2">
            <Button
              styling="light"
              onClick={closePanel}
              className="grow"
              data-testid="menu-form-cancel"
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow" type="submit" data-testid="menu-form-submit">
              <Translate>Add</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};

export { ThesauriGroupFormSidepanel };

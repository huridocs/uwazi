import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { Checkbox, InputField, RadioSelect } from 'V2/Components/Forms';
import { ProcessParameters } from 'V2/api/ix/suggestions';
import { IXFilters } from '../types';

type FormData = {
  find: {
    shouldFind: boolean;
    types: Pick<IXFilters, 'nonProcessed' | 'obsolete' | 'error'>;
    amount: number;
  };
  accept: {
    shouldAccept: boolean;
    for: 'all' | 'previous';
    overwrite: 'blank_only' | 'overwrite_all';
  };
};

type ProcessExtractorModalProps = {
  close: () => void;
  onTrain: (data: Omit<ProcessParameters, 'extractorId'>) => Promise<void>;
};

const ProcessExtractorModal = ({ close, onTrain }: ProcessExtractorModalProps) => {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: {
      find: {
        shouldFind: true,
        types: { nonProcessed: true, obsolete: true, error: true },
        amount: 1000,
      },
      accept: { shouldAccept: true, for: 'previous', overwrite: 'blank_only' },
    },
  });

  const submit = async ({ find, accept }: FormData) => {
    const data: Omit<ProcessParameters, 'extractorId'> = {
      mode: 'process_extractor',
      find: {
        enabled: find.shouldFind,
        size: find.amount > 0 ? find.amount : 0,
        filters: { ...find.types },
      },
      autoAccept: {
        enabled: accept.shouldAccept,
        source: accept.for,
        overwriteMode: accept.overwrite,
      },
    };

    await onTrain(data);
    close();
  };

  const shouldFind = watch('find.shouldFind');
  const shouldAccept = watch('accept.shouldAccept');

  useEffect(() => {
    if (!shouldFind) {
      setValue('accept.for', 'all');
    }
  }, [setValue, shouldFind]);

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Process extractor</Translate>
        <Modal.CloseButton onClick={() => close()} />
      </Modal.Header>
      <Modal.Body>
        <form id="train-form" onSubmit={handleSubmit(submit)}>
          <div className="flex flex-col gap-2">
            <Controller
              name="find.shouldFind"
              control={control}
              render={({ field }) => (
                <Checkbox
                  name={field.name}
                  onChange={field.onChange}
                  label={<Translate>Find suggestions for</Translate>}
                  checked={field.value}
                />
              )}
            />
            <div className="px-2 flex flex-col gap-1">
              <Controller
                name="find.types.nonProcessed"
                control={control}
                render={({ field }) => (
                  <div>
                    <Checkbox
                      name={field.name}
                      onChange={field.onChange}
                      label={<Translate>Non Processed</Translate>}
                      checked={field.value}
                      disabled={!shouldFind}
                    />
                  </div>
                )}
              />
              <Controller
                name="find.types.obsolete"
                control={control}
                render={({ field }) => (
                  <div>
                    <Checkbox
                      name={field.name}
                      onChange={field.onChange}
                      label={<Translate>Obsolete</Translate>}
                      checked={field.value}
                      disabled={!shouldFind}
                    />
                  </div>
                )}
              />
              <Controller
                name="find.types.error"
                control={control}
                render={({ field }) => (
                  <div>
                    <Checkbox
                      name={field.name}
                      onChange={field.onChange}
                      label={<Translate>Error</Translate>}
                      checked={field.value}
                      disabled={!shouldFind}
                    />
                  </div>
                )}
              />
            </div>
            <Controller
              name="find.amount"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <label htmlFor={field.name} className="text-gray-900">
                    <Translate>Amount</Translate> :
                  </label>
                  <InputField
                    className="inset-2"
                    type="number"
                    name={field.name}
                    id={field.name}
                    onChange={field.onChange}
                    value={field.value}
                    disabled={!shouldFind}
                  />
                </div>
              )}
            />
          </div>
          <hr className="my-4" />
          <div className="flex flex-col gap-2">
            <Controller
              name="accept.shouldAccept"
              control={control}
              render={({ field }) => (
                <Checkbox
                  name={field.name}
                  onChange={field.onChange}
                  label={<Translate>Auto-accept suggestions</Translate>}
                  checked={field.value}
                />
              )}
            />
            <div className="pt-2 px-2">
              <Controller
                name="accept.for"
                control={control}
                defaultValue="previous"
                render={({ field }) => (
                  <RadioSelect
                    name={field.name}
                    onChange={field.onChange}
                    options={[
                      {
                        label: <Translate>From previous step</Translate>,
                        value: 'previous',
                        disabled: !shouldFind || !shouldAccept,
                        checked: field.value === 'previous',
                      },
                      {
                        label: <Translate>From all suggestions</Translate>,
                        value: 'all',
                        disabled: !shouldAccept,
                        checked: field.value === 'all',
                      },
                    ]}
                  />
                )}
              />
              <hr className="my-4" />
              <Controller
                name="accept.overwrite"
                control={control}
                defaultValue="blank_only"
                render={({ field }) => (
                  <RadioSelect
                    name={field.name}
                    onChange={field.onChange}
                    options={[
                      {
                        label: <Translate>For entities with blank values</Translate>,
                        value: 'blank_only',
                        disabled: !shouldAccept,
                        defaultChecked: true,
                      },
                      {
                        label: <Translate>For all entities</Translate>,
                        value: 'overwrite_all',
                        disabled: !shouldAccept,
                      },
                    ]}
                  />
                )}
              />
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="flex justify-between gap-2">
        <Button disabled={isSubmitting} onClick={() => close()} styling="outline" className="grow">
          <Translate>Cancel</Translate>
        </Button>
        <Button
          disabled={isSubmitting || (!shouldFind && !shouldAccept)}
          type="submit"
          form="train-form"
          className="grow"
        >
          <Translate>Process</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { ProcessExtractorModal };

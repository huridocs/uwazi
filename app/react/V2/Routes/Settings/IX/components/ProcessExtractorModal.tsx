/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { useEffect } from 'react';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { Checkbox, InputField, RadioSelect } from 'V2/Components/Forms';
import { ProcessParameters } from 'V2/api/ix/suggestions';
import { IXFilters } from '../types';

type FormData = {
  shouldFind: boolean;
  filters: Pick<IXFilters, 'nonProcessed' | 'obsolete' | 'error'>;
  amount: number;
  shouldAccept: boolean;
  acceptFor: 'all' | 'previous';
  overwrite: 'blank_only' | 'overwrite_all';
};

type ProcessExtractorModalProps = {
  close: () => void;
  onTrain: (data: Omit<ProcessParameters, 'extractorId'>) => Promise<void>;
  selected?: string[];
};

const ProcessForm = ({ submit }: { submit: (values: FormData) => Promise<void> }) => {
  const {
    watch,
    setValue,
    handleSubmit,
    control,
    formState: { errors },
  } = useFormContext<FormData>();

  const shouldFind = watch('shouldFind');
  const shouldAccept = watch('shouldAccept');
  const filters = watch('filters');
  const amount = watch('amount');

  useEffect(() => {
    if (!shouldFind || amount < 1) {
      setValue('acceptFor', 'all');
    }
  }, [setValue, shouldFind, amount]);

  useEffect(() => {
    const hasFilters = filters.error || filters.nonProcessed || filters.obsolete;
    if (!hasFilters) {
      setValue('shouldFind', false);
    }
  }, [setValue, filters.error, filters.obsolete, filters.nonProcessed]);

  return (
    <form id="train-form" onSubmit={handleSubmit(submit)}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4 flex-wrap items-center">
          <Controller
            name="shouldFind"
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
          <Controller
            name="amount"
            control={control}
            rules={{ min: 1 }}
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <label htmlFor={field.name} className="text-gray-900">
                  <Translate>Amount</Translate> :
                </label>
                <InputField
                  type="number"
                  name={field.name}
                  id={field.name}
                  onChange={field.onChange}
                  value={field.value}
                  disabled={!shouldFind}
                  hasErrors={errors.amount?.type === 'min'}
                />
              </div>
            )}
          />
        </div>
        <div className="px-2 flex flex-col gap-1">
          <Controller
            name="filters.nonProcessed"
            control={control}
            render={({ field }) => (
              <div>
                <Checkbox
                  name={field.name}
                  onChange={field.onChange}
                  label={<Translate>Non processed</Translate>}
                  checked={field.value}
                  disabled={!shouldFind}
                />
              </div>
            )}
          />
          <Controller
            name="filters.obsolete"
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
            name="filters.error"
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
      </div>
      <hr className="my-4" />
      <div className="flex flex-col gap-2">
        <Controller
          name="shouldAccept"
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
            name="acceptFor"
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
                    disabled: !shouldFind || !shouldAccept || amount < 1,
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
            name="overwrite"
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
  );
};

const ProcessSelectedForm = ({ submit }: { submit: (values: FormData) => Promise<void> }) => {
  const { watch, handleSubmit, control } = useFormContext<FormData>();

  const shouldFind = watch('shouldFind');
  const shouldAccept = watch('shouldAccept');

  return (
    <form id="train-form" onSubmit={handleSubmit(submit)}>
      <Controller
        name="shouldFind"
        control={control}
        render={({ field }) => (
          <Checkbox
            name={field.name}
            onChange={field.onChange}
            label={<Translate>Find suggestions for selected</Translate>}
            checked
            disabled
          />
        )}
      />
      <hr className="my-4" />
      <div className="flex flex-col gap-2">
        <Controller
          name="shouldAccept"
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
            name="acceptFor"
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
                ]}
              />
            )}
          />
          <hr className="my-4" />
          <Controller
            name="overwrite"
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
  );
};

const ProcessExtractorModal = ({ close, onTrain, selected }: ProcessExtractorModalProps) => {
  const formContext = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: {
      shouldFind: true,
      filters: { nonProcessed: true, obsolete: true, error: true },
      amount: 1000,
      shouldAccept: true,
      acceptFor: 'previous',
      overwrite: 'blank_only',
    },
  });

  const { isSubmitting } = formContext.formState;
  const shouldFind = formContext.watch('shouldFind');
  const shouldAccept = formContext.watch('shouldAccept');

  const submit = async (values: FormData) => {
    let size = values.shouldFind && values.amount > 0 ? values.amount : 0;

    if (selected?.length) {
      size = selected.length;
    }

    const data: Omit<ProcessParameters, 'extractorId'> = {
      mode: selected?.length ? 'process_selected' : 'process_extractor',
      find: {
        enabled: values.shouldFind,
        filters: { ...values.filters },
        size,
        ...(selected?.length && { selectedSharedIds: selected }),
      },
      autoAccept: {
        enabled: values.shouldAccept,
        source: values.acceptFor,
        overwriteMode: values.overwrite,
      },
    };

    await onTrain(data);
    close();
  };

  return (
    <Modal size="xl">
      <Modal.Header>
        {selected?.length ? (
          <Translate>Process selected</Translate>
        ) : (
          <Translate>Process extractor</Translate>
        )}
        <Modal.CloseButton onClick={() => close()} />
      </Modal.Header>
      <Modal.Body>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <FormProvider {...formContext}>
          {selected?.length ? (
            <ProcessSelectedForm submit={submit} />
          ) : (
            <ProcessForm submit={submit} />
          )}
        </FormProvider>
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

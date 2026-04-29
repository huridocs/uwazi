import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Modal, Button, Tooltip } from '#V2/Components/UI/index.js';
import { Checkbox, InputField, RadioSelect } from '#V2/Components/Forms/index.js';

type TrainModelModalProps = {
  close: () => void;
  onTrain: (
    findAmount: number,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ) => Promise<void>;
};

type FormData = {
  find: {
    shouldFind: boolean;
    amount: number;
    samplePolicy: 'only_marked' | 'marked_plus_labeled';
  };
};

const TrainModelModal = ({ close, onTrain }: TrainModelModalProps) => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: { find: { shouldFind: false, amount: 1000, samplePolicy: 'only_marked' } },
  });

  const submit = async ({ find }: FormData) => {
    const findAmount: number = find.shouldFind && find.amount > 0 ? find.amount : 0;
    await onTrain(findAmount, find.samplePolicy);
    close();
  };

  const disableAmountField = !watch('find.shouldFind');

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Train model</Translate>
        <Modal.CloseButton onClick={() => close()} />
      </Modal.Header>
      <Modal.Body>
        <div className="border p-4 [background-color:var(--color-theme-info-banner-bg)] [border-color:var(--color-theme-info-banner-border)] [color:var(--color-theme-info-banner-fg)]">
          <Translate translationKey="Train model description">
            Training machine learning models may take from minutes up to a couple of hours depending
            on the amount of labeled data and the difficulty of the task.
          </Translate>
        </div>
        <hr className="my-4" />
        <form id="train-form" onSubmit={handleSubmit(submit)}>
          <div>
            <Controller
              name="find.samplePolicy"
              control={control}
              render={({ field }) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="pb-4 [color:var(--color-theme-text-primary)]"
                  >
                    <Tooltip
                      content={
                        <div>
                          <Translate>Choose which data to use for training</Translate> :
                          <ul className="list-inside list-disc">
                            <li>
                              <Translate translationKey="marked for training">
                                Marked for training only: Uses only entries you marked as &quot;Use
                                for training&quot;, including those with empty values
                              </Translate>
                            </li>
                            <li>
                              <Translate translationKey="marked and labeled">
                                Marked for training + all labeled entries: Includes entries marked
                                for training plus any other entries that have values
                              </Translate>
                            </li>
                          </ul>
                        </div>
                      }
                    >
                      <div className="flex flex-row items-center gap-2">
                        <span>
                          <Translate>Training sample</Translate> :
                        </span>
                        <InformationCircleIcon className="w-4 h-4" />
                      </div>
                    </Tooltip>
                  </label>
                  <RadioSelect
                    name={field.name}
                    onChange={field.onChange}
                    options={[
                      {
                        label: <Translate>Marked for training only</Translate>,
                        value: 'only_marked',
                        checked: field.value === 'only_marked',
                      },
                      {
                        label: <Translate>Marked for training + all labeled entries</Translate>,
                        value: 'marked_plus_labeled',
                      },
                    ]}
                  />
                </div>
              )}
            />
          </div>
          <hr className="my-4" />
          <div className="flex gap-2 flex-wrap">
            <Controller
              name="find.shouldFind"
              control={control}
              render={({ field }) => (
                <Checkbox
                  name={field.name}
                  onChange={field.onChange}
                  label={<Translate>Find suggestions after training</Translate>}
                />
              )}
            />
            <Controller
              name="find.amount"
              control={control}
              disabled={disableAmountField}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <label htmlFor={field.name} className="[color:var(--color-theme-text-primary)]">
                    <Translate>Amount</Translate> :
                  </label>
                  <InputField
                    className="inset-2"
                    type="number"
                    name={field.name}
                    id={field.name}
                    onChange={field.onChange}
                    value={field.value}
                    disabled={disableAmountField}
                  />
                </div>
              )}
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="flex justify-between gap-2">
        <Button
          disabled={isSubmitting}
          onClick={() => close()}
          variant="secondary"
          className="grow"
        >
          <Translate>Cancel</Translate>
        </Button>
        <Button disabled={isSubmitting} type="submit" form="train-form" className="grow">
          <Translate>Train</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { TrainModelModal };

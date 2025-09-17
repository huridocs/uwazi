import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { Checkbox, InputField } from 'V2/Components/Forms';

type TrainModelModalProps = {
  close: () => void;
  onTrain: (findAmount: number) => Promise<void>;
};

type FormData = {
  find: { shouldFind: boolean; amount: number };
};

const TrainModelModal = ({ close, onTrain }: TrainModelModalProps) => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: { find: { shouldFind: false, amount: 1000 } },
  });

  const submit = async ({ find }: FormData) => {
    const findAmount: number = find.shouldFind && find.amount > 0 ? find.amount : 0;
    await onTrain(findAmount);
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
        <div className="text-primary-700 border-primary-300 bg-primary-100 p-4">
          <Translate translationKey="Train model description">
            Training machine learning models may take from minutes up to a couple of hours depending
            on the amount of labeled data and the difficulty of the task.
          </Translate>
        </div>
        <hr className="my-4" />
        <form id="train-form" onSubmit={handleSubmit(submit)}>
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
                    disabled={disableAmountField}
                  />
                </div>
              )}
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="flex justify-between gap-2">
        <Button disabled={isSubmitting} onClick={() => close()} styling="outline" className="grow">
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

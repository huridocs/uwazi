import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { Checkbox, InputField, RadioSelect } from 'V2/Components/Forms';

type TrainModelModalProps = {
  close: () => void;
  onTrain: () => Promise<void>;
  onTestRun: () => Promise<void>;
};

type FormData = {
  action: 'none' | 'train' | 'test-run';
  find: { shouldFind: boolean; amount: number };
};

const TrainModelModal = ({ close, onTrain, onTestRun }: TrainModelModalProps) => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: { action: 'test-run', find: { shouldFind: false, amount: 1000 } },
  });

  const submit = async ({ action, find }: FormData) => {
    console.log('find: ', find);
    switch (action) {
      case 'train':
        await onTrain();
        break;
      case 'test-run':
        await onTestRun();
        break;
      default:
        break;
    }

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
          <Controller
            name="action"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <RadioSelect
                className="py-4"
                name="action"
                legend={
                  <Translate
                    className={
                      errors.action?.type === 'required' ? 'text-error-900' : 'text-gray-900'
                    }
                  >
                    Action
                  </Translate>
                }
                options={[
                  {
                    id: 'train',
                    label: <Translate>Train</Translate>,
                    value: 'train',
                  },
                  {
                    id: 'test-run',
                    label: <Translate>Test Run</Translate>,
                    value: 'test-run',
                    defaultChecked: true,
                  },
                ]}
                onChange={field.onChange}
              />
            )}
          />
          <hr className="my-4" />
          <div className="flex gap-2">
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
                  <span className="text-gray-900">
                    <Translate>Amount</Translate> :
                  </span>
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
        {errors.action?.type === 'required' && <Translate>This field is requiered</Translate>}
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

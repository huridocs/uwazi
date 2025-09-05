import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { RadioSelect } from 'V2/Components/Forms';

type TrainModalProps = {
  close: () => void;
  onTrain: () => Promise<void>;
  onTestRun: () => Promise<void>;
};

type FormData = { action: 'none' | 'train' | 'test-run' };

const TrainModal = ({ close, onTrain, onTestRun }: TrainModalProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: 'onSubmit',
  });

  const submit = async ({ action }: FormData) => {
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

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Train model</Translate>
        <Modal.CloseButton onClick={() => close()} />
      </Modal.Header>
      <Modal.Body>
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
                  },
                ]}
                onChange={field.onChange}
              />
            )}
          />
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

export { TrainModal };

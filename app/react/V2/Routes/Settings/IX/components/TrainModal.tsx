import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';

type TrainModalProps = {
  close: () => void;
  onTrain: () => void;
  onTestRun: () => void;
  isTraining: boolean;
};

const TrainModal = ({ close, onTrain, onTestRun, isTraining }: TrainModalProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<{ action: 'none' | 'train' | 'test-run' }>({
    mode: 'onSubmit',
  });

  return (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Train model</Translate>
        <Modal.CloseButton onClick={() => close()} />
      </Modal.Header>
      <Modal.Body className="pt-0">
        <form id="train-form" onSubmit={handleSubmit}></form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-between gap-2">
          <Button onClick={() => close()} styling="outline">
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" form="train-form">
            <Translate>Train</Translate>
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { TrainModal };

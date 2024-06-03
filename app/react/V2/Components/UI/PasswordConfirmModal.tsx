import React, { useState } from 'react';
import { Translate, t } from 'app/I18N';
import { Button, Modal } from '../UI';
import { modalSizeType } from './Modal';

type PasswordConfirmModalType = {
  size?: modalSizeType;
  onAcceptClick?: () => void;
  onCancelClick?: () => void;
};

const PasswordConfirmModal = ({
  onAcceptClick,
  onCancelClick,
  size = 'md',
}: PasswordConfirmModalType) => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal size={size}>
      <Modal.Header className="border-b-0">
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Confirm changes</Translate>
        </h1>
        <Modal.CloseButton onClick={onCancelClick} />
      </Modal.Header>
      <Modal.Body>
        <span className="text-gray-500 whitespace-nowrap dark:text-gray-400">
          <Translate>Enter your current password to confirm</Translate>
        </span>

        <div className="py-4">
          <label>
            <span className="block mb-2">
              <Translate>Password</Translate>:
            </span>
            <input
              id="confirm-input"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              type="password"
              onChange={e => setConfirmed(e.currentTarget.value.length > 0)}
              data-testid="confirm-input"
            />
          </label>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button styling="light" onClick={onCancelClick} className="grow">
          <Translate>Cancel</Translate>
        </Button>
        <Button onClick={onAcceptClick} disabled={!confirmed} color="primary" className="grow">
          <Translate>Accept</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { PasswordConfirmModal };

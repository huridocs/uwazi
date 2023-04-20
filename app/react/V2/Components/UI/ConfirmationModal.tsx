import React from 'react';
import { Translate } from 'app/I18N';
import { Button, Modal } from '../UI';
import { modalSizeType } from './Modal';

type confirmationModalType = {
  size: modalSizeType;
  header?: string | React.ReactNode;
  body?: string | React.ReactNode;
  onAcceptClick?: () => {};
  onCancelClick?: () => {};
  acceptButton?: string | React.ReactNode;
  cancelButton?: string | React.ReactNode;
  warningText?: string;
  confirmWord?: string;
};

const ConfirmationModal = ({
  header,
  body,
  onAcceptClick,
  onCancelClick,
  acceptButton,
  cancelButton,
  warningText,
  confirmWord,
  size,
}: confirmationModalType) => (
  <Modal size={size}>
    <div className="relative bg-white rounded-lg shadow">
      <Modal.Header className="border-b-0">
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>{header}</Translate>
        </h1>
        <Modal.CloseButton onClick={onCancelClick} />
      </Modal.Header>
      {warningText && (
        <div
          className="p-4 mb-4 text-sm text-red-800 border-t border-b border-red-300 top--3 bg-red-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <Translate>{warningText}</Translate>
        </div>
      )}
      <div className="px-6 pb-6" data-testid="modal-body">
        <span className="text-gray-500 p- whitespace-nowrap dark:text-gray-400">
          <Translate>{body}</Translate>
        </span>
        {confirmWord && (
          <div className="py-4">
            <span className="block mb-2 font-medium text-gray-900 text-md dark:text-white">
              <Translate>Please type in</Translate>&nbsp;
              <Translate>{confirmWord}</Translate>:
            </span>
            <input
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              type="text"
            />
          </div>
        )}
      </div>
      <Modal.Footer>
        <Button buttonStyle="tertiary" onClick={onCancelClick}>
          <Translate>{cancelButton}</Translate>
        </Button>
        <Button onClick={onAcceptClick}>
          <Translate>{acceptButton}</Translate>
        </Button>
      </Modal.Footer>
    </div>
  </Modal>
);

export { ConfirmationModal };

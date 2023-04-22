import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { isString } from 'lodash';
import { Button, Modal } from '../UI';
import { modalSizeType } from './Modal';

type confirmationModalType = {
  size: modalSizeType;
  header?: string | React.ReactNode;
  body?: string | React.ReactNode;
  onAcceptClick?: () => void;
  onCancelClick?: () => void;
  acceptButton?: string | React.ReactNode;
  cancelButton?: string | React.ReactNode;
  warningText?: string | React.ReactNode;
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
}: confirmationModalType) => {
  const [confirmed, setConfirmed] = useState(confirmWord === undefined);

  const renderChild = (child: string | React.ReactNode) =>
    isString(child) ? <Translate>{child}</Translate> : child;

  return (
    <Modal size={size}>
      <div className="relative bg-white rounded-lg shadow">
        <Modal.Header className="border-b-0">
          <h1 className="text-xl font-medium text-gray-900">{renderChild(header)}</h1>
          <Modal.CloseButton onClick={onCancelClick} />
        </Modal.Header>
        {warningText && (
          <div
            className="p-4 mb-4 text-sm text-red-800 border-t border-b border-red-300 top--3 bg-red-50 dark:bg-gray-800 dark:text-red-400"
            role="alert"
          >
            {renderChild(warningText)}
          </div>
        )}
        <div className="px-6 pb-6" data-testid="modal-body">
          <span className="text-gray-500 p- whitespace-nowrap dark:text-gray-400">
            {renderChild(body)}
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
                onKeyUp={e => setConfirmed(e.currentTarget.value === confirmWord)}
              />
            </div>
          )}
        </div>
        <Modal.Footer>
          <Button buttonStyle="tertiary" onClick={onCancelClick} className="grow">
            {renderChild(cancelButton)}
          </Button>
          <Button
            onClick={onAcceptClick}
            disabled={!confirmed}
            buttonStyle={!warningText ? 'primary' : 'danger'}
            className="grow"
          >
            {renderChild(acceptButton)}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export { ConfirmationModal };

import React, { useState } from 'react';
import { Translate, t } from 'app/I18N';
import { isString } from 'lodash';
import { Button, Modal } from '../UI';
import { modalSizeType } from './Modal';

type confirmationModalType = {
  size?: modalSizeType;
  header?: string | React.ReactNode;
  body?: string | React.ReactNode;
  onAcceptClick?: () => void;
  onCancelClick?: () => void;
  acceptButton?: string | React.ReactNode;
  cancelButton?: string | React.ReactNode;
  warningText?: string | React.ReactNode;
  confirmWord?: string;
  dangerStyle?: boolean;
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
  size = 'md',
  dangerStyle = false,
}: confirmationModalType) => {
  const [confirmed, setConfirmed] = useState(confirmWord === undefined);

  const renderChild = (child: string | React.ReactNode) =>
    isString(child) ? <Translate>{child}</Translate> : child;

  const wordForConfirmation = t('System', confirmWord, null, false);

  return (
    <Modal size={size}>
      <Modal.Header className="border-b-0">
        <h1 className="text-xl font-medium text-gray-900">{renderChild(header)}</h1>
        <Modal.CloseButton onClick={onCancelClick} />
      </Modal.Header>
      {warningText && (
        <div
          className="p-4 text-sm border-t border-b border-error-300 text-error-800 bg-error-50 top--3 dark:bg-gray-800 dark:text-error-400"
          role="alert"
        >
          {renderChild(warningText)}
        </div>
      )}
      <Modal.Body>
        <span className="text-gray-500 whitespace-nowrap dark:text-gray-400">
          {renderChild(body)}
        </span>
        {confirmWord && (
          <div className="py-4">
            <span className="block mb-2 font-medium text-gray-900 text-md dark:text-white">
              <label htmlFor="confirm-input">
                <Translate>Please type in</Translate>&nbsp;
              </label>
              {wordForConfirmation}:
            </span>
            <input
              id="confirm-input"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              type="text"
              onChange={e => setConfirmed(e.currentTarget.value === wordForConfirmation)}
              data-testid="confirm-input"
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          styling="light"
          onClick={onCancelClick}
          className="grow"
          data-testid="cancel-button"
        >
          {renderChild(cancelButton || 'Cancel')}
        </Button>
        <Button
          onClick={onAcceptClick}
          disabled={!confirmed}
          color={!warningText && !dangerStyle ? 'primary' : 'error'}
          className="grow"
          data-testid="accept-button"
        >
          {renderChild(acceptButton || 'Accept')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { ConfirmationModal };

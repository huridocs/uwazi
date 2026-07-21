import React, { useState } from 'react';
import { Translate, t } from '#app/I18N/index.js';
import isString from 'lodash/isString.js';

import { Button, Modal } from '../UI/index.js';
import { modalSizeType } from './Modal.js';

type confirmationModalType = {
  size?: modalSizeType;
  header?: string | React.ReactNode;
  body?: string | React.ReactNode;
  onAcceptClick?: (value: string) => void;
  onCancelClick?: () => void;
  acceptButton?: string | React.ReactNode;
  cancelButton?: string | React.ReactNode;
  warningText?: string | React.ReactNode;
  confirmWord?: string;
  usePassword?: boolean;
  dangerStyle?: boolean;
  disabled?: boolean;
};

type FeedbackStyle = React.CSSProperties;

const confirmFieldClass = [
  'block w-full rounded-lg border p-2.5 text-sm',
  'bg-(--color-theme-control-bg)',
  'border-(--color-theme-control-border)',
  'text-(--color-theme-control-text)',
  'focus:border-(--color-theme-control-border-focus)',
  'focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]',
  'focus:outline-hidden',
].join(' ');

const ConfirmationModal = ({
  header,
  body,
  onAcceptClick,
  onCancelClick,
  acceptButton,
  cancelButton,
  warningText,
  confirmWord,
  usePassword,
  size = 'md',
  dangerStyle = false,
  disabled = false,
}: confirmationModalType) => {
  const [inputValue, setInputValue] = useState('');
  const [confirmed, setConfirmed] = useState(!(confirmWord || usePassword));
  const warningEdge =
    'color-mix(in srgb, var(--color-theme-feedback-danger, var(--color-theme-danger)) 35%, transparent)';
  const warningStyle: FeedbackStyle = {
    backgroundColor: 'var(--color-theme-feedback-danger-tint, var(--color-theme-danger-light))',
    borderTopColor: warningEdge,
    borderBottomColor: warningEdge,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--color-theme-feedback-danger, var(--color-theme-danger))',
    color: 'var(--color-theme-text-primary)',
  };

  const renderChild = (child: string | React.ReactNode) =>
    isString(child) ? <Translate>{child}</Translate> : child;

  const wordForConfirmation = t('System', confirmWord, null, false);

  return (
    <Modal size={size}>
      <Modal.Header className="border-b-0">
        <h1 className="text-xl font-medium text-ink">{renderChild(header)}</h1>
        <Modal.CloseButton onClick={onCancelClick} disabled={disabled} />
      </Modal.Header>
      {warningText && (
        <div className="top--3 border-b border-t p-4 text-sm" role="alert" style={warningStyle}>
          {renderChild(warningText)}
        </div>
      )}
      <Modal.Body>
        <span className="text-ink-secondary">{renderChild(body)}</span>
        {confirmWord && (
          <div className="py-4">
            <span className="block mb-2 text-md font-medium text-ink">
              <label htmlFor="confirm-input">
                <Translate>Please type in</Translate>&nbsp;
              </label>
              {wordForConfirmation}:
            </span>
            <input
              id="confirm-input"
              className={confirmFieldClass}
              type="text"
              onChange={e => setConfirmed(e.currentTarget.value === wordForConfirmation)}
              data-testid="confirm-input"
            />
          </div>
        )}

        {usePassword && (
          <div className="py-4">
            <span className="block mb-2 text-md font-medium text-ink">
              <label htmlFor="confirm-password">
                <Translate>Enter your current password to confirm</Translate>&nbsp;
              </label>
            </span>
            <input
              id="confirm-password"
              className={confirmFieldClass}
              type="password"
              autoComplete="off"
              onChange={e => {
                setInputValue(e.currentTarget.value);
                setConfirmed(e.currentTarget.value.length > 0);
              }}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="ghost"
          onClick={onCancelClick}
          className="grow"
          data-testid="cancel-button"
          disabled={disabled}
        >
          {renderChild(cancelButton || 'Cancel')}
        </Button>
        <Button
          onClick={onAcceptClick ? () => onAcceptClick(inputValue || '') : undefined}
          disabled={!confirmed || disabled}
          variant={!warningText && !dangerStyle ? 'primary' : 'danger'}
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

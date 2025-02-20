import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'app/V2/atoms';
import { useRevalidator } from 'react-router';
import { ConfirmationModal } from 'app/V2/Components/UI';
import { pxActions } from '../pxConfig';

type ExtractorOperation = keyof typeof pxActions;

type PXActionProps<ActionParams> = {
  action: ExtractorOperation;
  actionParams?: ActionParams;
  shouldNotify?: boolean;
};

const usePXActionModal = <ActionParams extends unknown>({
  action,
  actionParams,
  shouldNotify = true,
}: PXActionProps<ActionParams>) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const actionConfig = pxActions[action];
  const {
    service,
    successText,
    errorText,
    header,
    warningText,
    acceptButtonText,
    cancelButtonText,
  } = actionConfig;
  const [showModal, setShowModal] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string, error?: any) => {
    if (shouldNotify) {
      setNotifications({
        type,
        text: <Translate>{message}</Translate>,
        details: error?.json?.prettyMessage,
      });
    }
  };

  const handleError = (error: any) => {
    // eslint-disable-next-line no-console
    console.log(error);
    showNotification('error', errorText, error);
  };

  const executeAction = async () => {
    try {
      await service(actionParams);
      await revalidator.revalidate();
      showNotification('success', successText);
      setShowModal(false);
    } catch (error: any) {
      handleError(error);
    }
  };

  const Modal = ({
    setIsProcessing,
    onSuccess,
  }: {
    setIsProcessing: (value: boolean) => void;
    onSuccess: () => void;
  }) =>
    showModal && (
      <ConfirmationModal
        header={<Translate>{header}</Translate>}
        warningText={<Translate>{warningText}</Translate>}
        onAcceptClick={async () => {
          setIsProcessing(true);
          await executeAction();
          onSuccess();
          setIsProcessing(false);
        }}
        onCancelClick={() => {
          setShowModal(false);
        }}
        acceptButton={<Translate>{acceptButtonText}</Translate>}
        cancelButton={<Translate>{cancelButtonText}</Translate>}
      />
    );

  return {
    Modal,
    setShowModal,
  };
};

export { usePXActionModal };

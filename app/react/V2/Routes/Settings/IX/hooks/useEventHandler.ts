import { useEffect } from 'react';
import { useRevalidator } from 'react-router';
import { socket } from 'app/socket';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'V2/atoms';
import { t } from 'app/I18N';
import { ModelEvents, SuggestionEvents } from '../events';
import type {
  IXModelStatusCallback,
  IXErrorTrainingModelCallback,
  AcceptSuggestionSuccessCallback,
  AcceptSuggestionErrorCallback,
} from '../events';
import { ixStatus } from '../types';

type useEventHandlerProps = {
  extractorId: string;
  updateStatus: (status: ixStatus, data?: { processed: number; total: number }) => void;
  fetchAggregations: () => Promise<void>;
};

const useEventHandler = ({
  extractorId,
  updateStatus,
  fetchAggregations,
}: useEventHandlerProps) => {
  const setNotifications = useSetAtom(notificationAtom);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const handleModelStatus: IXModelStatusCallback = async (
      eventExtractorId,
      modelStatus,
      _message,
      data
    ) => {
      if (eventExtractorId === extractorId) {
        updateStatus(modelStatus, data);
        await revalidate();
        if ((data && data.total === data.processed) || modelStatus === ixStatus.ready) {
          updateStatus(ixStatus.ready);
        }
      }
    };

    const handleModelError: IXErrorTrainingModelCallback = ({ message }) => {
      updateStatus(ixStatus.error);
      setNotifications({
        type: 'error',
        text: t('System', 'An error occurred', null, false),
        details: message,
      });
    };

    const handleSuggestionSuccess: AcceptSuggestionSuccessCallback = async () => {
      await fetchAggregations();
      setNotifications({
        type: 'success',
        text: t('System', 'Suggestions have been updated', null, false),
      });
    };

    const handleSuggestionError: AcceptSuggestionErrorCallback = message => {
      setNotifications({
        type: 'error',
        text: t('System', 'An error occurred', null, false),
        details: message,
      });
    };

    socket.on(ModelEvents.MODEL_STATUS, handleModelStatus);
    socket.on(ModelEvents.MODEL_ERROR, handleModelError);
    socket.on(SuggestionEvents.ACCEPT_SUGGESTION_SUCCESS, handleSuggestionSuccess);
    socket.on(SuggestionEvents.ACCEPT_SUGGESTION_ERROR, handleSuggestionError);

    return () => {
      socket.off(ModelEvents.MODEL_STATUS);
      socket.off(ModelEvents.MODEL_ERROR);
      socket.off(SuggestionEvents.ACCEPT_SUGGESTION_SUCCESS);
      socket.off(SuggestionEvents.ACCEPT_SUGGESTION_ERROR);
    };
  }, [extractorId]);
};

export { useEventHandler };

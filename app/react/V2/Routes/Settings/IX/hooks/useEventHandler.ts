/* eslint-disable max-statements */
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
import { acceptedSuggestions } from '../components/atoms/acceptedSuggestions';

type useEventHandlerProps = {
  extractorId: string;
  updateStatus: (status: ixStatus, data?: { processed: number; total: number }) => void;
};

const useEventHandler = ({ extractorId, updateStatus }: useEventHandlerProps) => {
  const setNotifications = useSetAtom(notificationAtom);
  const setAcceptedSuggestionsAtom = useSetAtom(acceptedSuggestions);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const handleModelStatus: IXModelStatusCallback = async (
      eventExtractorId,
      modelStatus,
      _message,
      data
    ) => {
      if (eventExtractorId === extractorId) {
        if (data?.processed === data?.total) {
          updateStatus(ixStatus.ready);
        } else {
          updateStatus(modelStatus, data);
        }
        await revalidate();
        setAcceptedSuggestionsAtom(new Set());
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
      await revalidate();
      setNotifications({
        type: 'success',
        text: t('System', 'Suggestions have been updated', null, false),
      });
    };

    const handleSuggestionError: AcceptSuggestionErrorCallback = async message => {
      await revalidate();
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

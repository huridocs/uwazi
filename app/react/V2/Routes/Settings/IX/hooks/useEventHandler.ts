/* eslint-disable max-statements */
import { useEffect } from 'react';
import { useRevalidator } from 'react-router';
import { socket } from '#app/socket.js';
import { t } from '#app/I18N/index.js';
import { ModelEvents, SuggestionEvents } from '../events.js';
import type {
  IXModelStatusCallback,
  IXErrorTrainingModelCallback,
  AcceptSuggestionSuccessCallback,
  AcceptSuggestionErrorCallback,
} from '../events.js';
import { ixStatus } from '../types.js';
import { acceptedSuggestions } from '../components/atoms/acceptedSuggestions.js';
import { useSetAtom } from 'jotai';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

type useEventHandlerProps = {
  extractorId: string;
  updateStatus: (status: ixStatus, data?: { processed: number; total: number }) => void;
};

const useEventHandler = ({ extractorId, updateStatus }: useEventHandlerProps) => {
  const { notify } = useRequestStatus();
  const setAcceptedSuggestionsAtom = useSetAtom(acceptedSuggestions);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const handleModelStatus: IXModelStatusCallback = async (
      eventExtractorId,
      modelStatus,
      message,
      data
    ) => {
      if (eventExtractorId !== extractorId) return;

      const isCompleted = message === 'Completed';

      const autoAcceptCount = Boolean(
        ixStatus.processing_auto_accept && data?.total && data?.processed
      );

      if (modelStatus === ixStatus.processing_model) {
        updateStatus(ixStatus.processing_model);
      } else if (modelStatus === ixStatus.processing_suggestions) {
        updateStatus(ixStatus.processing_suggestions, {
          processed: Number(data?.processed),
          total: Number(data?.total),
        });
      } else if (autoAcceptCount) {
        updateStatus(ixStatus.processing_auto_accept, {
          processed: Number(data?.processed),
          total: Number(data?.total),
        });
      } else if (modelStatus === ixStatus.processing_auto_accept) {
        updateStatus(ixStatus.processing_auto_accept);
      } else if (isCompleted) {
        updateStatus(ixStatus.ready);
      } else {
        updateStatus(ixStatus.ready);
      }

      setAcceptedSuggestionsAtom(new Set());
      await revalidate();
    };

    const handleModelError: IXErrorTrainingModelCallback = ({ message }) => {
      updateStatus(ixStatus.error);
      notify('error', t('System', 'An error occurred', null, false), undefined, message);
    };

    const handleSuggestionSuccess: AcceptSuggestionSuccessCallback = async () => {
      await revalidate();
      notify('success', t('System', 'Suggestions have been updated', null, false));
    };

    const handleSuggestionError: AcceptSuggestionErrorCallback = async message => {
      await revalidate();
      notify('error', t('System', 'An error occurred', null, false), undefined, message);
    };

    socket.on(ModelEvents.MODEL_STATUS, handleModelStatus);
    socket.on(ModelEvents.MODEL_ERROR, handleModelError);
    socket.on(SuggestionEvents.ACCEPT_SUGGESTION_SUCCESS, handleSuggestionSuccess);
    socket.on(SuggestionEvents.ACCEPT_SUGGESTION_ERROR, handleSuggestionError);

    return () => {
      socket.off(ModelEvents.MODEL_STATUS, handleModelStatus);
      socket.off(ModelEvents.MODEL_ERROR, handleModelError);
      socket.off(SuggestionEvents.ACCEPT_SUGGESTION_SUCCESS, handleSuggestionSuccess);
      socket.off(SuggestionEvents.ACCEPT_SUGGESTION_ERROR, handleSuggestionError);
    };
  }, [extractorId, revalidate, setAcceptedSuggestionsAtom, notify, updateStatus]);
};

export { useEventHandler };

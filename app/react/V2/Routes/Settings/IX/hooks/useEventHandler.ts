import { useEffect } from 'react';
import { socket } from 'app/socket';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'V2/atoms';
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
  statusUpdater: (status: ixStatus, data?: { processed: number; total: number }) => void;
  revalidator: () => Promise<void>;
  fetchAggregations: () => Promise<void>;
};

const useEventHandler = ({
  extractorId,
  statusUpdater,
  revalidator,
  fetchAggregations,
}: useEventHandlerProps) => {
  const setNotifications = useSetAtom(notificationAtom);

  useEffect(() => {
    const handleModelStatus: IXModelStatusCallback = async (
      eventExtractorId,
      modelStatus,
      _,
      data
    ) => {
      if (eventExtractorId === extractorId) {
        statusUpdater(modelStatus as ixStatus, data);
        await revalidator();
        if ((data && data.total === data.processed) || modelStatus === ixStatus.ready) {
          statusUpdater(ixStatus.ready);
        }
      }
    };

    const handleModelError: IXErrorTrainingModelCallback = ({ message }) => {
      statusUpdater(ixStatus.error);
      setNotifications({
        type: 'error',
        text: 'An error occurred',
        details: message,
      });
    };

    const handleSuggestionSuccess: AcceptSuggestionSuccessCallback = async () => {
      await fetchAggregations();
      setNotifications({
        type: 'success',
        text: 'Suggestions have been updated',
      });
    };

    const handleSuggestionError: AcceptSuggestionErrorCallback = message => {
      setNotifications({
        type: 'error',
        text: 'An error occurred',
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

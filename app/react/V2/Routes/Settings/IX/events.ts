import { ixStatus } from './types';

type IXModelStatusData = {
  processed: number;
  total: number;
};

type IXModelStatusCallback = (
  extractorId: string,
  modelStatus: ixStatus,
  message: string,
  data?: IXModelStatusData
) => void;

type IXErrorTrainingModelCallback = ({ message }: { message: string }) => void;

type AcceptSuggestionSuccessCallback = () => void;

type AcceptSuggestionErrorCallback = (message: string) => void;

const ModelEvents = {
  MODEL_STATUS: 'ix_model_status',
  MODEL_ERROR: 'ix:error_training_model',
};

const SuggestionEvents = {
  ACCEPT_SUGGESTION_SUCCESS: 'ACCEPT_SUGGESTION_SUCCESS',
  ACCEPT_SUGGESTION_ERROR: 'ACCEPT_SUGGESTION_ERROR',
};

export { ModelEvents, SuggestionEvents };
export type {
  IXModelStatusData,
  IXModelStatusCallback,
  IXErrorTrainingModelCallback,
  AcceptSuggestionSuccessCallback,
  AcceptSuggestionErrorCallback,
};

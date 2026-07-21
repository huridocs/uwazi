import { socket } from '#app/socket.js';
import { TaskListenerSetup } from '#V2/atoms/requestStatusAtom.js';
import { ModelEvents } from './events.js';
import type {
  IXModelStatusCallback,
  IXErrorTrainingModelCallback,
  IXModelStatusData,
} from './events.js';
import { ixStatus } from './types.js';

type IXTaskLabels = {
  trainingModel: string;
  findingSuggestions: string;
  acceptingSuggestions: string;
};

type IXTaskType = 'train' | 'process';

type CreateIXTaskListenerSetupParams = {
  extractorId: string;
  extractorName: string;
  taskType: IXTaskType;
  labels: IXTaskLabels;
};

const getProgress = (data?: IXModelStatusData): number | undefined => {
  if (!data?.total) return undefined;
  return Math.round((data.processed / data.total) * 100);
};

const initialTaskLabel = ({
  taskType,
  extractorName,
  labels,
}: Omit<CreateIXTaskListenerSetupParams, 'extractorId'>): string => {
  const prefix = taskType === 'train' ? labels.trainingModel : labels.findingSuggestions;
  return `${prefix}: ${extractorName}`;
};

const createIXTaskListenerSetup =
  ({
    extractorId,
    extractorName,
    taskType,
    labels,
  }: CreateIXTaskListenerSetupParams): TaskListenerSetup =>
  (update, complete, fail) => {
    const handleStatus: IXModelStatusCallback = (evtId, modelStatus, _message, data) => {
      if (evtId !== extractorId) return;

      if (taskType === 'train' && modelStatus === ixStatus.processing_model) {
        update({ label: `${labels.trainingModel}: ${extractorName}` });
        return;
      }

      if (modelStatus === ixStatus.processing_suggestions) {
        update({
          label: `${labels.findingSuggestions}: ${extractorName}`,
          progress: getProgress(data) ?? 0,
        });
        return;
      }

      if (modelStatus === ixStatus.processing_auto_accept) {
        const progress = getProgress(data);
        update({
          label: `${labels.acceptingSuggestions}: ${extractorName}`,
          ...(progress !== undefined && { progress }),
        });
        return;
      }

      if (modelStatus === ixStatus.ready) {
        complete();
      }
    };

    const handleError: IXErrorTrainingModelCallback = ({ message }) => {
      fail(message);
    };

    socket.on(ModelEvents.MODEL_STATUS, handleStatus);
    socket.on(ModelEvents.MODEL_ERROR, handleError);

    return () => {
      socket.off(ModelEvents.MODEL_STATUS, handleStatus);
      socket.off(ModelEvents.MODEL_ERROR, handleError);
    };
  };

export type { IXTaskLabels, IXTaskType, CreateIXTaskListenerSetupParams };
export { createIXTaskListenerSetup, initialTaskLabel };

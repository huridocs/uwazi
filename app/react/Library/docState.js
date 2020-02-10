import { createSelector } from 'reselect';

const docState = createSelector(
  (state, props) => state.progress.get(props.doc.get('sharedId')),
  (_state, props) => props.doc.get('uploaded'),
  (_state, props) => props.doc.get('processed'),
  (_state, props) => !props.doc.get('file'),
  (_state, props) => props.doc.get('template'),
  (progress, uploaded, processed, isEntity, template) => {
    if (!uploaded && !isEntity && (progress || progress === 0)) {
      return {
        progress,
        status: 'processing',
        message: 'Uploading...',
      };
    }

    if (typeof processed === 'undefined' && !isEntity && uploaded) {
      return {
        progress: 100,
        status: 'processing',
        message: 'Processing...',
      };
    }

    if (!template && (processed || isEntity)) {
      return {
        progress,
        status: 'warning',
        message: 'No type selected',
      };
    }

    if (!uploaded && !isEntity && typeof progress === 'undefined') {
      return {
        progress,
        status: 'danger',
        message: 'Upload failed',
      };
    }

    if (processed === false && !isEntity) {
      return {
        status: 'danger',
        message: 'Conversion failed',
      };
    }

    return {};
  }
);

export default docState;

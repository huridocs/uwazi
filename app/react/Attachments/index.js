import loadable from '@loadable/component';
import AttachmentsList from './components/AttachmentsList';
import { AttachmentsModal } from './components/AttachmentsModal';
import UploadAttachment from './components/UploadAttachment';
import manageAttachmentsReducer from './reducers/manageAttachmentsReducer';
import reducer from './reducers/reducer';

const RenderAttachment = loadable(async () =>
  import(/* webpackChunkName: "LazyLoadMarkdownMedia" */ './components/RenderAttachment')
);

export {
  AttachmentsList,
  AttachmentsModal,
  UploadAttachment,
  manageAttachmentsReducer,
  reducer,
  RenderAttachment,
};

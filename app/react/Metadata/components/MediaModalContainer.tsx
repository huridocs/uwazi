import { IStore } from 'app/istore';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators } from 'redux';
import { get } from 'lodash';
import { MediaModalComponent, MediaModalProps } from 'app/Metadata/components/MediaModal';
import React from 'react';
import { uploadLocalAttachment } from 'app/Metadata/actions/supportingFilesActions';
import { actions as formActions } from 'react-redux-form';

type MediaModalContainerProps = MediaModalProps & {
  value?: string | null;
};

const mapStateToProps = (state: IStore, ownProps: MediaModalProps) => {
  const model = ownProps.formModel;
  return {
    localAttachments: get(state, `${model}.attachments`),
    entity: get(state, model),
  };
};

const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators({ uploadLocalAttachment, change: formActions.change }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MediaModalContainerProps & mappedProps;

const MediaModalContainer = (props: ComponentProps) => <MediaModalComponent {...props} />;

const container = connector(MediaModalContainer);
export { container as MediaModal };

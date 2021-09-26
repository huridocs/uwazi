import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { IStore } from 'app/istore';
import { AttachmentsList } from 'app/Attachments';

const mapStateToProps = (state: IStore) => ({
  inEntityViewEdit: state.entityView.entityForm,
  inSidePanelEdit: state.library.sidepanel.metadata,
});

const connector = connect(mapStateToProps);

type MetadataFormSupportingFilesProps = {
  storeKey: string;
};
type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MetadataFormSupportingFilesProps & mappedProps;

const MetadataFormSupportingFiles = ({
  inEntityViewEdit,
  inSidePanelEdit,
  storeKey,
}: ComponentProps) => {
  const { attachments } =
    Object.keys(inEntityViewEdit).length === 0 ? inSidePanelEdit : inEntityViewEdit;

  return (
    <AttachmentsList
      attachments={attachments}
      // isTargetDoc={isTargetDoc}
      isDocumentAttachments={false}
      // parentId="614c9c9c9bfe6673f2a4d859"
      parentSharedId={null}
      storeKey={storeKey}
      // entity={jsDoc}
    />
  );
};

const container = connector(MetadataFormSupportingFiles);
export { container as MetadataFormSupportingFiles };

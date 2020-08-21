import React from 'react';
import Doc from 'app/Library/components/Doc';
import { RowList } from './Lists';
import { CollectionViewerProps } from './CollectionViewerProps';

export class TilesViewer extends React.Component<CollectionViewerProps> {
  render() {
    return (
      <RowList zoomLevel={this.props.rowListZoomLevel}>
        {this.props.documents.get('rows').map((doc, index) => (
          <Doc
            doc={doc}
            storeKey={this.props.storeKey}
            key={index}
            onClick={this.props.clickOnDocument}
            onSnippetClick={this.props.onSnippetClick}
            deleteConnection={this.props.deleteConnection}
            searchParams={this.props.search}
          />
        ))}
      </RowList>
    );
  }
}

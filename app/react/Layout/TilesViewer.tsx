import React from 'react';
import { connect } from 'react-redux';
import { IStore } from 'app/istore';
import Doc from 'app/Library/components/Doc';
import { CollectionViewerProps } from './CollectionViewerProps';
import { RowList } from './Lists';

export interface TilesViewerProps extends CollectionViewerProps {
  search: any;
}

class TilesViewerComponent extends React.Component<TilesViewerProps> {
  render() {
    return (
      <RowList zoomLevel={this.props.rowListZoomLevel}>
        {this.props.documents.get('rows').map(doc => (
          <Doc
            doc={doc}
            storeKey={this.props.storeKey}
            key={doc?.get('_id')}
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

const mapStateToProps = (state: IStore, props: TilesViewerProps) => ({
  documents: state[props.storeKey].documents,
  search: state[props.storeKey].search,
});

export const TilesViewer = connect(mapStateToProps)(TilesViewerComponent);

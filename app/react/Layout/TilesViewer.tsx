import React from "react";
import { RowList } from "./Lists";
import Doc from 'app/Library/components/Doc';

export interface DocumentViewerProps {
  rowListZoomLevel: number,
  documents: any,
  storeKey: 'library' | 'uploads',
  clickOnDocument: (...args: any[]) => any,
  onSnippetClick: (...args: any[]) => any,
  deleteConnection: (...args: any[]) => any,
  search: any,
}

export class TilesViewer extends React.Component<DocumentViewerProps> {
  render() {
    return <RowList zoomLevel={this.props.rowListZoomLevel}>
      {this.props.documents.get('rows').map((doc: any, index: number) => (
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
      </RowList>;
  } 
}

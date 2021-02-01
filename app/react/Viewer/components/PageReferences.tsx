import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IStore } from 'app/istore';
import { ConnectionSchema } from 'shared/types/connectionType';
import { createSelector } from 'reselect';
import { Highlight } from 'react-pdf-handler';
import { unique } from 'shared/filterUnique';

export interface PageReferencesProps {
  references: { [key: string]: ConnectionSchema[] | undefined };
  page: string;
  activeReference: string;
  onClick: (c: ConnectionSchema) => {};
}

export class PageReferencesComponent extends Component<PageReferencesProps> {
  onClick(connection: ConnectionSchema) {
    this.props.onClick(connection);
  }

  render() {
    /* @ts-ignore */
    return (
      <>
        {(this.props.references[this.props.page] || []).map((r: ConnectionSchema) => {
          const color = r._id === this.props.activeReference ? '#ffd84b' : '#feeeb4';

          if (!r.reference) {
            return false;
          }

          return (
            <div
              data-id={r._id}
              key={r._id?.toString()}
              className="reference"
              onClick={this.onClick.bind(this, r)}
            >
              <Highlight
                regionId={this.props.page.toString()}
                highlight={r.reference}
                color={color}
              />
            </div>
          );
        })}
      </>
    );
  }
}

const indexdReferencesByPage = createSelector(
  (state: IStore) =>
    state.documentViewer.targetDocReferences.size
      ? state.documentViewer.targetDocReferences
      : state.documentViewer.references,
  (state: IStore) =>
    state.documentViewer.targetDoc.get('_id')
      ? state.documentViewer.targetDoc
      : state.documentViewer.doc,
  (references, doc) =>
    references
      .toJS()
      .reduce(
        (mappedReferences: { [key: string]: ConnectionSchema[] }, connection: ConnectionSchema) => {
          if (doc.get('sharedId') !== connection.entity) {
            return mappedReferences;
          }

          const pages = (connection.reference?.selectionRectangles || [])
            .map(selection => selection.page)
            .filter(unique);

          pages.forEach(page => {
            if (!page) {
              return;
            }

            if (!mappedReferences[page]) {
              // eslint-disable-next-line no-param-reassign
              mappedReferences[page] = [];
            }

            mappedReferences[page].push(connection);
          });

          return mappedReferences;
        },
        {}
      )
);

const mapStateToProps = (state: IStore) => {
  return {
    references: indexdReferencesByPage(state),
    activeReference: state.documentViewer.uiState.get('activeReference'),
  };
};

export const PageReferences = connect(mapStateToProps)(PageReferencesComponent);

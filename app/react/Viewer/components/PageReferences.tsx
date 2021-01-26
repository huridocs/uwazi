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
    return (
      <>
        {(this.props.references[this.props.page] || []).map((r: ConnectionSchema) => {
          const color = r._id === this.props.activeReference ? '#ffd84b' : '#feeeb4';

          return (
            <div
              data-id={r._id}
              key={r._id}
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

const indexdReferences = createSelector(
  (state: IStore) => state.documentViewer.references,
  references =>
    references
      .toJS()
      .reduce(
        (mappedReferences: { [key: string]: ConnectionSchema[] }, connection: ConnectionSchema) => {
          const regionIds = (connection.reference?.selectionRectangles || [])
            .map(selection => selection.regionId)
            .filter(unique);

          regionIds.forEach(regionId => {
            if (!regionId) {
              return;
            }

            if (!mappedReferences[regionId]) {
              // eslint-disable-next-line no-param-reassign
              mappedReferences[regionId] = [];
            }

            mappedReferences[regionId].push(connection);
          });

          return mappedReferences;
        },
        {}
      )
);

const mapStateToProps = (state: IStore) => {
  return {
    references: indexdReferences(state),
    activeReference: state.documentViewer.uiState.get('activeReference'),
  };
};

export const PageReferences = connect(mapStateToProps)(PageReferencesComponent);

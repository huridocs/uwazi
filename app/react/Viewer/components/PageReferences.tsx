import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { IStore } from 'app/istore';
import { ConnectionSchema } from 'shared/types/connectionType';
import { createSelector } from 'reselect';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { unique } from 'shared/filterUnique';

export interface PageReferencesProps {
  references: { [key: string]: ConnectionSchema[] | undefined };
  page: string;
  activeReference: string;
  onClick: (c: ConnectionSchema) => {};
}

export const PageReferencesComponent: FunctionComponent<PageReferencesProps> = (
  props: PageReferencesProps
) => (
  <>
    {(props.references[props.page] || []).map((r: ConnectionSchema) => {
      const color = r._id === props.activeReference ? '#ffd84b' : '#feeeb4';

      if (!r.reference) {
        return false;
      }
      const selectionRectangles = r.reference.selectionRectangles.map(
        ({ page, ...otherProps }) => ({ regionId: page, ...otherProps })
      );
      const highlight = { ...r.reference, selectionRectangles };

      return (
        <div
          data-id={r._id}
          key={r._id?.toString()}
          className="reference"
          onClick={props.onClick.bind(null, r)}
        >
          <Highlight textSelection={highlight} color={color} />
        </div>
      );
    })}
  </>
);

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

          if (connection.reference) {
            const pages = connection.reference.selectionRectangles
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
          }
          return mappedReferences;
        },
        {}
      )
);

const mapStateToProps = (state: IStore) => ({
  references: indexdReferencesByPage(state),
  activeReference: state.documentViewer.uiState.get('activeReference'),
});

export const PageReferences = connect(mapStateToProps)(PageReferencesComponent);

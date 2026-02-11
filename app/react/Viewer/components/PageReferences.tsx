import React, { FunctionComponent, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import { useAtomValue } from 'jotai';
import { IStore } from '#app/istore.js';
import { ConnectionSchema } from '#shared/types/connectionType.js';
import { createSelector } from 'reselect';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { unique } from '#shared/filterUnique.js';
import { SelectionRectangleSchema } from '#shared/types/commonTypes.js';
import { pdfScaleAtom } from '#V2/atoms/index.js';
import { selectionHandlers } from '#V2/Components/PDFViewer/index.js';

type ReferenceGroup = {
  _id: string;
  length: number;
  start: SelectionRectangleSchema;
  end: SelectionRectangleSchema;
}[];

interface PageReferencesProps {
  references: { [key: string]: ConnectionSchema[] | undefined };
  groupedReferences: ReferenceGroup[];
  page: string;
  activeReference: string;
  onClick: (c: ConnectionSchema, groupedReferences: string[]) => {};
  enableClickAction?: boolean;
}

const PageReferencesComponent: FunctionComponent<PageReferencesProps> = (
  props: PageReferencesProps
) => {
  const referenceGroup = useRef<string[]>();
  const pdfScaleFactor = useAtomValue(pdfScaleAtom);

  const handleClick = useCallback(
    (reference: ConnectionSchema) =>
      props.enableClickAction
        ? props.onClick.bind(null, reference, referenceGroup.current || [])
        : undefined,
    [props.enableClickAction, props.onClick]
  );

  return (
    <>
      {(props.references[props.page] || []).map((reference: ConnectionSchema) => {
        const color = reference._id === props.activeReference ? '#ffd84b' : '#feeeb4';

        if (!reference.reference) {
          return false;
        }

        const selectionRectangles = reference.reference.selectionRectangles.map(
          ({ page, ...otherProps }) => ({ regionId: page, ...otherProps })
        );

        const highlight = selectionHandlers.adjustSelectionsToScale(
          { ...reference.reference, selectionRectangles },
          pdfScaleFactor
        );

        if (props.groupedReferences && reference._id) {
          props.groupedReferences.forEach(group => {
            const belongingGroup = group.find(ref => ref._id === reference._id);
            if (belongingGroup) {
              referenceGroup.current = group.map(ref => ref._id);
            }
          });
        }

        return (
          <div
            data-id={reference._id}
            key={reference._id?.toString()}
            className="reference"
            style={{ cursor: props.enableClickAction ? 'pointer' : 'auto' }}
            onClick={handleClick(reference)}
          >
            <div style={{ pointerEvents: props.enableClickAction ? 'auto' : 'none' }}>
              <Highlight textSelection={highlight} color={color} />
            </div>
          </div>
        );
      })}
    </>
  );
};

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

type RefMap = { get(key: string): unknown };
type RectList = {
  size: number;
  get(i: number): { get(k: string): unknown; toJS(): SelectionRectangleSchema };
};

const groupByRectangle = createSelector(
  (state: IStore) => state.documentViewer.references,
  references =>
    references.reduce((groups, reference) => {
      if (!groups) return [];
      const ref = reference as RefMap;
      if (ref?.get('template') || !ref) return groups;
      const rects = (ref.get('reference') as RefMap | undefined)?.get('selectionRectangles') as
        | RectList
        | undefined;
      if (!rects?.size) return groups;

      const hasGroup = groups?.some(refGroups =>
        refGroups.some(refGroup => {
          if (
            refGroup.length === rects.size &&
            refGroup.start.page === rects.get(0).get('page') &&
            refGroup.start.width === rects.get(0).get('width') &&
            refGroup.end.page === rects.get(rects.size - 1).get('page') &&
            refGroup.end.width === rects.get(rects.size - 1).get('width')
          ) {
            refGroups.push({
              _id: ref.get('_id')!.toString(),
              length: rects.size,
              start: rects.get(0).toJS(),
              end: rects.get(rects.size - 1).toJS(),
            });
            return true;
          }
          return false;
        })
      );

      if (hasGroup) return groups;

      groups.push([
        {
          _id: ref.get('_id')!.toString(),
          length: rects.size,
          start: rects.get(0).toJS(),
          end: rects.get(rects.size - 1).toJS(),
        },
      ]);

      return groups;
    }, [] as ReferenceGroup[])
);

const mapStateToProps = (state: IStore) => ({
  references: indexdReferencesByPage(state),
  groupedReferences: groupByRectangle(state),
  activeReference: state.documentViewer.uiState.get('activeReference'),
  enableClickAction: state.documentViewer.uiState.get('enableClickAction'),
});

const PageReferences = connect(mapStateToProps)(PageReferencesComponent);

export { PageReferences, PageReferencesComponent, groupByRectangle };
export type { PageReferencesProps };

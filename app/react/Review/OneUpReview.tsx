import React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { withContext, withRouter } from 'app/componentWrappers';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { Loader } from 'app/components/Elements/Loader';
import * as uiActions from 'app/Entities/actions/uiActions';
import { OneUpState } from 'app/istore';
import { store } from 'app/store';
import { setDocuments, unsetDocuments } from 'app/Library/actions/libraryActions';
import { processQuery } from 'app/Library/helpers/requestState';
import { wrapDispatch } from 'app/Multireducer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as reviewActions from 'app/Review/actions/actions';
import { OneUpEntityViewer } from 'app/Review/components/OneUpEntityViewer';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import { propertyTypes } from 'shared/propertyTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

type OneUpReviewProps = {
  entity?: IImmutable<EntitySchema>;
  oneUpState?: IImmutable<OneUpState>;
  location?: { search: { q?: string } };
  mainContext: { confirm: Function };
};

function buildInitialOneUpState(
  documentsRequest: RequestParams<{ filters: any }>,
  numDocuments: number,
  thesauri: ThesaurusSchema[],
  templates: TemplateSchema[]
): OneUpState {
  const thesaurusValues = [] as string[];
  const thesauriKeys = Object.keys(documentsRequest.data?.filters ?? {}).reduce((res, k) => {
    const propName = k.startsWith('__') ? k.substring(2) : k;
    if (k.startsWith('__')) {
      thesaurusValues.push(
        ...documentsRequest.data!.filters[k].values.filter(
          (v: string) => v && !['any', 'missing'].includes(v)
        )
      );
    }
    return {
      ...res,
      ...templates.reduce((res2, tmpl) => {
        const prop = (tmpl.properties || []).find(p => p.name === propName);
        if (
          !prop ||
          !prop.content ||
          (prop.type !== propertyTypes.select && prop.type !== propertyTypes.multiselect)
        ) {
          return res2;
        }
        return { ...res2, [prop.content]: true };
      }, {}),
    };
  }, {});
  const thesaurus =
    Object.keys(thesauriKeys).length === 1
      ? thesauri.find(t => t._id!.toString() === Object.keys(thesauriKeys)[0])
      : null;
  thesauri.forEach(t => {
    (t.values || []).forEach(tv => {
      const i = thesaurusValues.findIndex(v => v === tv.id);
      if (i >= 0) {
        thesaurusValues[i] = tv.label;
      }
    });
  });
  return {
    loaded: true,
    fullEdit: false,
    loadConnections: false,
    indexInDocs: 0,
    totalDocs: numDocuments,
    maxTotalDocs: 5001,
    requestHeaders: documentsRequest.headers,
    reviewThesaurusName: thesaurus ? thesaurus.name : '',
    reviewThesaurusId: thesaurus ? thesaurus._id!.toString() : '',
    reviewThesaurusValues: thesaurusValues,
  };
}

class OneUpReviewBase extends RouteHandler {
  static async requestState(requestParams: RequestParams, state: any) {
    const documentsRequest = requestParams.set({
      ...processQuery(requestParams.data, state),
      limit: 5001,
      select: ['sharedId'],
      unpublished: !!requestParams.data.unpublished,
      includeUnpublished: !!requestParams.data.includeUnpublished,
      includeReviewAggregations: true,
    });

    const [templates, thesauri, relationTypes, documents] = await Promise.all([
      TemplatesAPI.get(requestParams.onlyHeaders()),
      ThesauriAPI.getThesauri(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
      api.search(documentsRequest),
    ]);

    const firstSharedId = documents.rows.length ? documents.rows[0].sharedId : '';

    return [
      actions.set('relationTypes', relationTypes),
      (dispatch: any) => wrapDispatch(dispatch, 'library')(unsetDocuments()),
      (dispatch: any) => wrapDispatch(dispatch, 'library')(setDocuments(documents)),
      actions.set(
        'oneUpReview.state',
        buildInitialOneUpState(documentsRequest, documents.rows.length, thesauri, templates)
      ),
      ...(firstSharedId
        ? await reviewActions.getAndLoadEntity(
            requestParams.set({ sharedId: firstSharedId }),
            templates,
            state,
            false
          )
        : []),
    ];
  }

  urlHasChanged(nextProps: any) {
    const nextSearchParams = new URLSearchParams(nextProps.location.search);
    const currentSearchParams = new URLSearchParams(this.props.location.search);
    return nextSearchParams.get('q') !== currentSearchParams.get('q');
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentDidMount() {
    store?.dispatch(uiActions.showTab('info'));
  }

  emptyState() {
    wrapDispatch(store?.dispatch, 'library')(unsetDocuments());
    store?.dispatch(setReferences([]));
    store?.dispatch(actions.unset('entityView/entity'));
    store?.dispatch(formActions.reset('entityView.entityForm'));
    store?.dispatch(relationships.emptyState());
    actions.set('oneUpReview.state', {});
  }

  render() {
    const { entity, oneUpState } = this.props as OneUpReviewProps;
    if (
      !oneUpState ||
      !oneUpState.get('loaded') ||
      (oneUpState.get('totalDocs') && (!entity || !entity.get('_id')))
    ) {
      return <Loader />;
    }
    return <OneUpEntityViewer mainContext={this.props.mainContext} />;
  }
}

interface OneUpReviewStore {
  entityView: {
    entity?: IImmutable<EntitySchema>;
  };
  oneUpReview: {
    state?: IImmutable<OneUpState>;
  };
}

const mapStateToProps = (state: OneUpReviewStore) =>
  ({
    entity: state.entityView.entity,
    oneUpState: state.oneUpReview.state,
  }) as OneUpReviewProps;

export type { OneUpReviewProps };
export { OneUpReviewBase };
//@ts-ignore
export default connect(mapStateToProps)(withRouter(withContext(OneUpReviewBase)));

import { Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from '#app/UI/index.js';

import { debounce } from '#app/utils/index.js';
import { libraryHelpers as libraryHelper, prepareDefaultFilters } from '#app/Library/helpers/libraryFilters.js';
import { searchDocuments } from '#app/Library/actions/libraryActions.js';
import { Translate } from '#app/I18N/index.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { FilterTocGeneration } from '#app/ToggledFeatures/tocGeneration/index.js';
import { TemplatesFilter } from '#app/Library/components/TemplatesFilter.js';
import { AssigneeFilter } from '#app/Library/components/AssigneeFilter.js';
import { withRouter } from '#app/componentWrappers.js';
import { PermissionsFilter } from './PermissionsFilter.js';
import { PublishedFilters } from './PublishedFilters.js';
import { FiltersFromProperties } from './FiltersFromProperties.js';

class FiltersForm extends Component {
  constructor(props) {
    super(props);
    this.search = debounce(() => {
      this.props.searchDocuments({
        location: this.props.location,
        navigate: this.props.navigate,
      });
    }, 300);

    this.submit = this.submit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.activateAutoSearch = () => {
      this.autoSearch = true;
    };

    this.state = { documentTypeFromFilters: true };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !Immutable.is(this.props.fields, nextProps.fields) ||
      !Immutable.is(this.props.aggregations, nextProps.aggregations) ||
      !Immutable.is(this.props.documentTypes, nextProps.documentTypes) ||
      !Immutable.is(this.state.documentTypeFromFilters, nextState.documentTypeFromFilters)
    );
  }

  onChange() {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.search();
    }
  }

  submit() {
    this.props.searchDocuments({ location: this.props.location, navigate: this.props.navigate });
  }

  render() {
    const { templates, documentTypes } = this.props;
    const aggregations = (this.props.aggregations || Immutable.Map()).toJS();
    const translationContext =
      documentTypes.get(0) || (templates.get(0) || Immutable.fromJS({})).get('_id') || 'System';
    const allFields = this.props.fields.toJS();
    const showNoValueOnFilters = allFields.size;
    let fields = libraryHelper
      .parseWithAggregations(allFields.slice(0), aggregations, showNoValueOnFilters)
      .filter(field => !field.options || field.options.length);

    if (!documentTypes.size) {
      fields = prepareDefaultFilters(fields);
    }

    const model = `${this.props.storeKey}.search`;

    return (
      <div className="filters-box">
        <Form model={model} id="filtersForm" onSubmit={this.submit} onChange={this.onChange}>
          <PublishedFilters onChange={this.activateAutoSearch} aggregations={aggregations} />
          <PermissionsFilter onChange={this.activateAutoSearch} aggregations={aggregations} />
          <TemplatesFilter />
          <FiltersFromProperties
            onChange={this.activateAutoSearch}
            properties={fields}
            translationContext={translationContext}
            storeKey={this.props.storeKey}
            templates={this.props.templates ? this.props.templates.toJS() : []}
            aggregations={this.props.aggregations || Immutable.Map()}
          />

          <FilterTocGeneration onChange={this.activateAutoSearch} aggregations={aggregations} />
          <AssigneeFilter onChange={this.activateAutoSearch} aggregations={aggregations} />
        </Form>

        {(() => {
          const activeTypes = templates.filter(template =>
            documentTypes.includes(template.get('_id'))
          );
          if (activeTypes.size > 0 && fields.length === 0) {
            return (
              <div className="blank-state">
                <Icon icon="times" />
                <h4>
                  <Translate>No common filters</Translate>
                </h4>
                <p>
                  <Translate translationKey="no filters for templates">
                    The combination of entity types doesn&#39;t have any filters in common.
                  </Translate>
                </p>
                <a
                  href="https://github.com/huridocs/uwazi/wiki/Filter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Translate>Learn more</Translate>
                </a>
              </div>
            );
          }

          return null;
        })()}
      </div>
    );
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  aggregations: PropTypes.instanceOf(Immutable.Map).isRequired,
  fields: PropTypes.instanceOf(Immutable.List).isRequired,
  searchDocuments: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  documentTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  storeKey: PropTypes.string.isRequired,
};

function mapStateToProps(state, props) {
  const store = state[props.storeKey] || {};
  const filters = store.filters || Immutable.fromJS({ properties: [], documentTypes: [] });
  const get = key => (filters.get ? filters.get(key) : undefined);
  return {
    fields: get('properties') || Immutable.List(),
    aggregations: store.aggregations || Immutable.Map(),
    templates: state.templates || Immutable.List(),
    documentTypes: get('documentTypes') || Immutable.List(),
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ searchDocuments }, wrapDispatch(dispatch, props.storeKey));
}

const FiltersFormConnected = connect(mapStateToProps, mapDispatchToProps)(withRouter(FiltersForm));
export { FiltersForm as FiltersFormView, FiltersFormConnected as FiltersForm, mapStateToProps };

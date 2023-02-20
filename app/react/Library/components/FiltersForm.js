import { Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable, { is, fromJS } from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import debounce from 'app/utils/debounce';
import libraryHelper, { prepareDefaultFilters } from 'app/Library/helpers/libraryFilters';
import { searchDocuments } from 'app/Library/actions/libraryActions';
import { Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { FilterTocGeneration } from 'app/ToggledFeatures/tocGeneration';
import { TemplatesFilter } from 'app/Library/components/TemplatesFilter';
import { AssigneeFilter } from 'app/Library/components/AssigneeFilter';
import { withRouter } from 'app/componentWrappers';
import { PermissionsFilter } from './PermissionsFilter';
import { PublishedFilters } from './PublishedFilters';
import Filters from './FiltersFromProperties';

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
      !is(this.props.fields, nextProps.fields) ||
      !is(this.props.aggregations, nextProps.aggregations) ||
      !is(this.props.documentTypes, nextProps.documentTypes) ||
      !is(this.state.documentTypeFromFilters, nextState.documentTypeFromFilters)
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
    const aggregations = this.props.aggregations.toJS();
    const translationContext =
      documentTypes.get(0) || (templates.get(0) || fromJS({})).get('_id') || 'System';
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
          <Filters
            onChange={this.activateAutoSearch}
            properties={fields}
            translationContext={translationContext}
            storeKey={this.props.storeKey}
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
  return {
    fields: state[props.storeKey].filters.get('properties'),
    aggregations: state[props.storeKey].aggregations,
    templates: state.templates,
    documentTypes: state[props.storeKey].filters.get('documentTypes'),
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ searchDocuments }, wrapDispatch(dispatch, props.storeKey));
}

export { FiltersForm, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(FiltersForm));

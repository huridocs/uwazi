import { Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable, { is, fromJS } from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';

import { searchDocuments } from 'app/Library/actions/libraryActions';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import debounce from 'app/utils/debounce';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import { FilterTocGeneration } from 'app/ToggledFeatures/tocGeneration';
import { NeedAuthorization } from 'app/Auth';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import SelectFilter from 'app/Library/components/SelectFilter';

import Filters from './FiltersFromProperties';

const filteredAggregation = (aggregations, key) => {
  const bucket = (aggregations?.all?.permissions?.buckets || []).find(a => a.key === key) || {
    filtered: { doc_count: 0 },
  };
  return bucket.filtered.doc_count;
};

const options = (aggregations) => [
  {
    label: t('System', 'Write'),
    value: 'write',
    results: filteredAggregation(aggregations, 'write'),
  },
  {
    label: t('System', 'Read'),
    value: 'read',
    results: filteredAggregation(aggregations, 'read'),
  },
];

export class FiltersForm extends Component {
  constructor(props) {
    super(props);
    this.search = debounce(search => {
      this.props.searchDocuments({ search }, this.props.storeKey);
    }, 300);

    this.submit = this.submit.bind(this);
    this.onChange = this.onChange.bind(this);

    this.activateAutoSearch = () => {
      this.autoSearch = true;
    };
  }

  shouldComponentUpdate(nextProps) {
    return (
      !is(this.props.fields, nextProps.fields) ||
      !is(this.props.aggregations, nextProps.aggregations) ||
      !is(this.props.documentTypes, nextProps.documentTypes)
    );
  }

  onChange(search) {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.search(search, this.props.storeKey);
    }
  }

  submit(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { templates, documentTypes } = this.props;

    const aggregations = this.props.aggregations.toJS();
    const translationContext =
      documentTypes.get(0) || (templates.get(0) || fromJS({})).get('_id') || 'System';
    const allFields = this.props.fields.toJS();
    const showNoValueOnFilters = allFields.size;
    const fields = libraryHelper
      .parseWithAggregations(allFields.slice(0), aggregations, showNoValueOnFilters)
      .filter(field => !field.options || field.options.length);
    const model = `${this.props.storeKey}.search`;

    return (
      <div className="filters-box">
        {(() => {
          const activeTypes = templates.filter(template =>
            documentTypes.includes(template.get('_id'))
          );
          if (activeTypes.size > 0 && fields.length === 0) {
            return (
              <div className="blank-state">
                <Icon icon="times" />
                <h4>{t('System', 'No common filters')}</h4>
                <p>
                  The combination of document and entity types doesn&#39;t have any filters in
                  common.
                </p>
                <a
                  href="https://github.com/huridocs/uwazi/wiki/Filter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </div>
            );
          }

          return null;
        })()}

        <Form model={model} id="filtersForm" onSubmit={this.submit} onChange={this.onChange}>

          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <FormGroup key="permissions.level" className="admin-filter">
              <SelectFilter
                model=".customFilters['permissions.level']"
                prefix="permissions.level"
                label={t('System', 'permissions')}
                onChange={this.activateAutoSearch}
                options={options(aggregations)}
                showBoolSwitch={false}
              />
            </FormGroup>
          </NeedAuthorization>

          <Filters
            onChange={this.activateAutoSearch}
            properties={fields}
            translationContext={translationContext}
            storeKey={this.props.storeKey}
          />
          <FilterTocGeneration onChange={this.activateAutoSearch} aggregations={aggregations} />
        </Form>
      </div>
    );
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  aggregations: PropTypes.instanceOf(Immutable.Map).isRequired,
  fields: PropTypes.instanceOf(Immutable.List).isRequired,
  searchDocuments: PropTypes.func.isRequired,
  search: PropTypes.object,
  documentTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  storeKey: PropTypes.string.isRequired,
};

export function mapStateToProps(state, props) {
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

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { connect } from 'react-redux';
import ShowIf from 'app/App/ShowIf';
import { is } from 'immutable';
import { t } from 'app/I18N';

import { filterDocumentTypes } from 'app/Library/actions/filterActions';

export class DocumentTypesList extends Component {
  constructor(props) {
    super(props);
    let items = this.props.settings.collection.toJS().filters || [];
    if (!items.length || this.props.storeKey === 'uploads') {
      items = props.templates.toJS().map(tpl => ({ id: tpl._id, name: tpl.name }));
    }

    if (this.props.storeKey === 'uploads') {
      items.unshift({ id: 'missing', name: t('System', 'No type') });
    }
    this.state = {
      items,
      ui: {}
    };
  }

  checked(item) {
    if (item.items) {
      return item.items.reduce((result, _item) => result && this.checked(_item), item.items.length > 0);
    }

    return this.props.libraryFilters.toJS().documentTypes.includes(item.id);
  }

  changeAll(item, e) {
    const selectedItems = this.props.libraryFilters.toJS().documentTypes || [];
    if (e.target.checked) {
      item.items.forEach((_item) => {
        if (!this.checked(_item)) {
          selectedItems.push(_item.id);
        }
      });
    }

    if (!e.target.checked) {
      item.items.forEach((_item) => {
        if (this.checked(_item)) {
          const index = selectedItems.indexOf(_item.id);
          selectedItems.splice(index, 1);
        }
      });
    }

    this.setState({ selectedItems });
    this.props.filterDocumentTypes(selectedItems, this.props.storeKey);
  }

  change(item) {
    const selectedItems = this.props.libraryFilters.toJS().documentTypes || [];

    if (selectedItems.includes(item.id)) {
      const index = selectedItems.indexOf(item.id);
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item.id);
    }

    this.setState({ selectedItems });
    this.props.filterDocumentTypes(selectedItems, this.props.storeKey);
  }

  toggleOptions(item, e) {
    e.preventDefault();
    if (!this.checked(item) && item.items.find(itm => this.checked(itm))) {
      return;
    }
    const ui = this.state.ui;
    ui[item.id] = !ui[item.id];
    this.setState({ ui });
  }

  aggregations(item) {
    const aggregations = this.aggs;
    const buckets = aggregations.all && aggregations.all.types ? aggregations.all.types.buckets : [];
    const found = buckets.find(agg => agg.key === item.id);
    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => result + this.aggregations(_item), 0);
    }

    return 0;
  }

  showSubOptions(parent) {
    const toggled = this.state.ui[parent.id];
    return !!(toggled || !!(!this.checked(parent) && parent.items.find(itm => this.checked(itm))));
  }

  renderSingleType(item, index) {
    return (<li className="multiselectItem" key={index} title={item.name}>
      <input
        type="checkbox"
        className="multiselectItem-input"
        value={item.id}
        id={item.id}
        onChange={this.change.bind(this, item)}
        checked={this.checked(item)}
      />
      <label
        className="multiselectItem-label"
        htmlFor={item.id}
      >
        <i className="multiselectItem-icon fa fa-square-o" />
        <i className="multiselectItem-icon fa fa-check" />
        <span className="multiselectItem-name">{t(item.id, item.name)}</span>
      </label>
      <span className="multiselectItem-results">
        {this.aggregations(item)}
      </span>
            </li>);
  }

  renderGroupType(item, index) {
    return (<li key={index}>
      <div className="multiselectItem">
        <input
          type="checkbox"
          className="form-control multiselectItem-input"
          id={item.id}
          onChange={this.changeAll.bind(this, item)}
          checked={this.checked(item)}
        />
        <label htmlFor={item.id} className="multiselectItem-label">
          <i className="multiselectItem-icon fa fa-square-o" />
          <i className="multiselectItem-icon fa fa-check" />
          <span className="multiselectItem-name"><b>{t('Filters', item.name)}</b></span>
        </label>
        <span className="multiselectItem-results">
          <span>{this.aggregations(item)}</span>
          <span className="multiselectItem-action" onClick={this.toggleOptions.bind(this, item)}>
            <i className={this.state.ui[item.id] ? 'fa fa-caret-up' : 'fa fa-caret-down'} />
          </span>
        </span>
      </div>
      <ShowIf if={this.showSubOptions(item)}>
        <ul className="multiselectChild is-active">
          {item.items.map((_item, i) => this.renderSingleType(_item, i))}
        </ul>
      </ShowIf>
    </li>);
  }

  stateChanged(nextState) {
    return Object.keys(nextState.ui).length === Object.keys(this.state.ui).length ||
           Object.keys(nextState.ui).reduce((result, key) => result || nextState.ui[key] === this.state.ui[key], false);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props.libraryFilters, nextProps.libraryFilters) ||
           !is(this.props.settings, nextProps.settings) ||
           !is(this.props.aggregations, nextProps.aggregations) ||
           this.stateChanged(nextState);
  }

  render() {
    this.aggs = this.props.aggregations.toJS();
    return (
      <ul className="multiselect is-active">
        {this.state.items.map((item, index) => {
          if (item.items) {
            return this.renderGroupType(item, index);
          }
          return this.renderSingleType(item, index);
        })}
      </ul>
    );
  }
}

DocumentTypesList.propTypes = {
  libraryFilters: PropTypes.object,
  settings: PropTypes.object,
  templates: PropTypes.object,
  filterDocumentTypes: PropTypes.func,
  aggregations: PropTypes.object,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    libraryFilters: state[props.storeKey].filters,
    settings: state.settings,
    templates: state.templates,
    aggregations: state[props.storeKey].aggregations
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ filterDocumentTypes }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);

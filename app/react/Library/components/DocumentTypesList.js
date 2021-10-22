import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable, { is } from 'immutable';
import ShowIf from 'app/App/ShowIf';
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';

import { filterDocumentTypes } from 'app/Library/actions/filterActions';

const getItemsToShow = (fromFilters, templates, settings) => {
  let items = fromFilters ? settings.collection.toJS().filters : [];
  if (!items?.length) {
    items = templates.toJS().map(tpl => ({
      id: tpl._id,
      name: tpl.name,
    }));
  }
  return items;
};

export class DocumentTypesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ui: {},
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !is(this.props.selectedTemplates, nextProps.selectedTemplates) ||
      !is(this.props.settings, nextProps.settings) ||
      !is(this.props.aggregations, nextProps.aggregations) ||
      this.stateChanged(nextState)
    );
  }

  changeAll(item, e) {
    const { selectedTemplates: selectedItems } = this.props;
    if (e.target.checked) {
      item.items.forEach(_item => {
        if (!this.checked(_item)) {
          selectedItems.push(_item.id);
        }
      });
    }

    if (!e.target.checked) {
      item.items.forEach(_item => {
        if (this.checked(_item)) {
          const index = selectedItems.indexOf(_item.id);
          selectedItems.splice(index, 1);
        }
      });
    }

    this.props.filterDocumentTypes(selectedItems);
  }

  change(item) {
    const { selectedTemplates: selectedItems } = this.props;

    if (selectedItems.includes(item.id)) {
      const index = selectedItems.indexOf(item.id);
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item.id);
    }

    this.props.filterDocumentTypes(selectedItems);
  }

  toggleOptions(item, e) {
    e.preventDefault();
    if (!this.checked(item) && item.items.find(itm => this.checked(itm))) {
      return;
    }
    const { ui } = this.state;
    ui[item.id] = !ui[item.id];
    this.setState({ ui });
  }

  aggregations(item) {
    const aggregations = this.aggs;
    const buckets =
      aggregations.all && aggregations.all._types ? aggregations.all._types.buckets : [];
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

  checked(item) {
    if (item.items) {
      return item.items.reduce(
        (result, _item) => result && this.checked(_item),
        item.items.length > 0
      );
    }

    return this.props.selectedTemplates.includes(item.id);
  }

  stateChanged(nextState) {
    return (
      Object.keys(nextState.ui).length === Object.keys(this.state.ui).length ||
      Object.keys(nextState.ui).reduce(
        (result, key) => result || nextState.ui[key] === this.state.ui[key],
        false
      )
    );
  }

  renderSingleType(item, index) {
    const context = item.id === 'missing' ? 'System' : item.id;
    return (
      <li className="multiselectItem" key={index} title={item.name}>
        <input
          type="checkbox"
          className="multiselectItem-input"
          value={item.id}
          id={item.id}
          onChange={this.change.bind(this, item)}
          checked={this.checked(item)}
        />
        <label className="multiselectItem-label" htmlFor={item.id}>
          <span className="multiselectItem-icon">
            <Icon icon={['far', 'square']} className="checkbox-empty" />
            <Icon icon="check" className="checkbox-checked" />
          </span>
          <span className="multiselectItem-name">
            <Translate context={context}>{item.name}</Translate>
          </span>
        </label>
        <span className="multiselectItem-results">{this.aggregations(item)}</span>
      </li>
    );
  }

  renderGroupType(item, index) {
    return (
      <li key={index}>
        <div className="multiselectItem">
          <input
            type="checkbox"
            className="form-control multiselectItem-input"
            id={item.id}
            onChange={this.changeAll.bind(this, item)}
            checked={this.checked(item)}
          />
          <label htmlFor={item.id} className="multiselectItem-label">
            <span className="multiselectItem-icon">
              <Icon icon={['far', 'square']} className="checkbox-empty" />
              <Icon icon="check" className="checkbox-checked" />
            </span>
            <span className="multiselectItem-name">
              <b>{t('Filters', item.name)}</b>
            </span>
          </label>
          <span className="multiselectItem-results">
            <span>{this.aggregations(item)}</span>
            <span className="multiselectItem-action" onClick={this.toggleOptions.bind(this, item)}>
              <Icon icon={this.state.ui[item.id] ? 'caret-up' : 'caret-down'} />
            </span>
          </span>
        </div>
        <ShowIf if={this.showSubOptions(item)}>
          <ul className="multiselectChild is-active">
            {item.items.map((_item, i) => this.renderSingleType(_item, i))}
          </ul>
        </ShowIf>
      </li>
    );
  }

  render() {
    const { fromFilters, templates, settings } = this.props;
    const items = getItemsToShow(fromFilters, templates, settings);
    this.aggs = this.props.aggregations.toJS();
    return (
      <ul className="multiselect is-active">
        {items.map((item, index) => {
          if (item.items) {
            return this.renderGroupType(item, index);
          }
          return this.renderSingleType(item, index);
        })}
      </ul>
    );
  }
}

DocumentTypesList.defaultProps = {
  fromFilters: true,
  templates: Immutable.fromJS([]),
  settings: {},
  aggregations: Immutable.fromJS({}),
  selectedTemplates: [],
  filterDocumentTypes: {},
};

DocumentTypesList.propTypes = {
  selectedTemplates: PropTypes.instanceOf(Array),
  settings: PropTypes.instanceOf(Object),
  templates: PropTypes.instanceOf(Immutable.List),
  filterDocumentTypes: PropTypes.func,
  aggregations: PropTypes.instanceOf(Immutable.Map),
  fromFilters: PropTypes.bool,
};

export function mapStateToProps(state) {
  return {
    settings: state.settings,
    templates: state.templates,
    aggregations: state.library.aggregations,
  };
}

//parent ts component requires ownProps to inferring types
function mapDispatchToProps(dispatch, _ownProps) {
  return bindActionCreators({ filterDocumentTypes }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);

import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {is, fromJS as Immutable} from 'immutable';

import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import {Item} from 'app/Layout';
import {t, I18NLink} from 'app/I18N';
import {advancedSort} from 'app/utils/advancedSort';

import {setFilter} from '../actions/actions';

export class ReferencesGroup extends Component {

  toggleExpandGroup() {
    this.setState({expanded: !this.state.expanded});
  }

  toggleSelectGroup() {
    const {group} = this.props;
    const selectedItems = !this.state.selected ? group.get('templates').map(i => group.get('key') + i.get('_id')) : Immutable([]);

    this.setGroupFilter(selectedItems);
    this.setState({selected: !this.state.selected, selectedItems});
  }

  toggleSelectItem(item) {
    let selectedItems;
    let groupSelected;

    if (this.state.selectedItems.includes(item)) {
      groupSelected = false;
      selectedItems = this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
    }

    if (!this.state.selectedItems.includes(item)) {
      selectedItems = this.state.selectedItems.push(item);
      groupSelected = selectedItems.size === this.props.group.get('templates').size;
    }

    this.setGroupFilter(selectedItems);
    this.setState({selectedItems, selected: groupSelected});
  }

  setGroupFilter(selectedItems) {
    const newFilter = {};
    newFilter[this.props.group.get('key')] = selectedItems;
    this.props.setFilter(newFilter);
  }

  componentWillMount() {
    this.setState({expanded: false});
    this.setState({selected: false});
    this.setState({selectedItems: Immutable([])});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props.group, nextProps.group) ||
           !is(this.props.sort, nextProps.sort) ||
           this.state.expanded !== nextState.expanded ||
           this.state.selected !== nextState.selected ||
           this.state.selectedItems.size !== nextState.selectedItems.size;
  }

  render() {
    const group = this.props.group.toJS();
    const {connectionType, connectionLabel, templates} = group;

    // const sortValues = this.props.sort.toJS();
    // const sortOptions = {
    //   property: ['doc'].concat(sortValues.sort.split('.')),
    //   order: sortValues.order,
    //   treatAs: sortValues.treatAs
    // };

    // const refs = advancedSort(group.refs.map(reference => {
    //   return {
    //     reference,
    //     doc: {
    //       sharedId: reference.connectedDocument,
    //       type: reference.connectedDocumentType,
    //       title: reference.connectedDocumentTitle,
    //       icon: reference.connectedDocumentIcon,
    //       template: reference.connectedDocumentTemplate,
    //       metadata: reference.connectedDocumentMetadata,
    //       published: reference.connectedDocumentPublished,
    //       creationDate: reference.connectedDocumentCreationDate
    //     }
    //   };
    // }), sortOptions);

    return (
      <li>
        <div className="multiselectItem">
          <input
            type='checkbox'
            className="form-control"
            id={'group' + group.key}
            className="multiselectItem-input"
            onChange={this.toggleSelectGroup.bind(this)}
            checked={this.state.selected}
          />
          <label htmlFor={'group' + group.key} className="multiselectItem-label">
            <i className="multiselectItem-icon fa fa-square-o"></i>
            <i className="multiselectItem-icon fa fa-check"></i>
            <span className="multiselectItem-name">
              <b>{connectionType === 'metadata' ?
                  t(group.context, connectionLabel) + ' ' + t('System', 'in') + '...' :
                  t(group.context, connectionLabel)}</b>
            </span>
          </label>
          <span className="multiselectItem-results">
            <span>{group.templates.reduce((size, i) => size + i.count, 0)}</span>
            <span className="multiselectItem-action" onClick={this.toggleExpandGroup.bind(this)}>
              <i className={this.state.expanded ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
            </span>
          </span>
        </div>
        <ShowIf if={this.state.expanded}>
          <ul className="multiselectChild is-active">
            {templates.map((template, index) => {
              // const reference = data.reference;
              // const doc = data.doc;

              // console.log('Reference:', reference);
              // console.log('doc:', doc);
              return (
                <li className="multiselectItem" key={index} title={template.label}>
                  <input
                    type='checkbox'
                    className="multiselectItem-input"
                    value={group.key + template._id}
                    id={group.key + template._id}
                    onChange={this.toggleSelectItem.bind(this, group.key + template._id)}
                    checked={this.state.selectedItems.includes(group.key + template._id)}
                  />
                  <label
                    className="multiselectItem-label"
                    htmlFor={group.key + template._id}>
                      <i className="multiselectItem-icon fa fa-square-o"></i>
                      <i className="multiselectItem-icon fa fa-check"></i>
                      <span className="multiselectItem-name">{t(template._id, template.label)}</span>
                  </label>
                  <span className="multiselectItem-results">
                    {template.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </ShowIf>
      </li>
    );
  }
}

ReferencesGroup.propTypes = {
  group: PropTypes.object,
  deleteReference: PropTypes.func,
  setFilter: PropTypes.func,
  sort: PropTypes.object,
  filter: PropTypes.object
};

export const mapStateToProps = ({entityView}) => {
  return {sort: Immutable(entityView.sort), filter: entityView.filter};
};

export const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setFilter
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(ReferencesGroup);

import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DragAndDropContainer} from 'app/Layout/DragAndDrop';
import ID from 'shared/uniqueID';

export class FiltersForm extends Component {

  constructor(props) {
    super(props);
    let activeFilters = props.settings.filters || [];
    let inactiveFilters = props.templates.toJS().filter((tpl) => {
      return !activeFilters.find((filt) => filt.id === tpl._id);
    }).map((tpl) => {
      return {id: tpl._id, name: tpl.name};
    });

    this.state = {activeFilters, inactiveFilters};
  }

  renderItem(item) {
    if (item.items) {
      let onChange = (items) => {
        item.items = items;
        this.setState(this.state);
      };

      let nameChange = (e) => {
        let name = e.target.value;
        item.name = name;
        this.setState(this.state);
      };

      return <div>
              <input type="text" value={item.name} onChange={nameChange.bind(this)} />
              <DragAndDropContainer id={item.id} onChange={onChange.bind(this)} renderItem={this.renderItem.bind(this)} items={item.items}/>
            </div>;
    }
    return <div>
            <span>{item.name}</span>
          </div>;
  }

  activesChange(items) {
    this.setState({activeFilters: items});
  }

  unactivesChange(items) {
    this.setState({inactiveFilters: items});
  }

  addGroup() {
    this.state.activeFilters.push({
      id: ID(),
      name: 'New group',
      items: []
    });

    this.setState({activeFilters: this.state.activeFilters});
  }

  render() {
    return <div className="panel panel-default">
              <div className="panel-heading">
                Filtrable types
                <button onClick={this.addGroup.bind(this)} className="pull-right btn btn-xs btn-default">Create group</button>
              </div>
              <DragAndDropContainer id="active" onChange={this.activesChange.bind(this)} renderItem={this.renderItem.bind(this)} items={this.state.activeFilters}/>
              <div className="panel-heading">
                Not filtrable types
              </div>
              <DragAndDropContainer id="inactive" onChange={this.unactivesChange.bind(this)} renderItem={this.renderItem.bind(this)} items={this.state.inactiveFilters}/>
          </div>;
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.object,
  settings: PropTypes.object
};

const mapStateToProps = (state) => {
  return {
    templates: state.templates,
    settings: state.settings.filters
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);

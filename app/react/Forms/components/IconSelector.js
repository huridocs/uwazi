import React, {Component, PropTypes} from 'react';

import fontawesomeIcons from 'app/utils/fontawesomeIcons';
import countries from 'world-countries';
import Flag from 'react-flags';

import DropdownList from './DropdownList';

const style = {display: 'inline-block', width: '25px'};

export class ListItem extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.item._id !== nextProps.item._id;
  }

  render() {
    const {item} = this.props;
    let icon;
    if (item.type === 'Icons') {
      icon = <span style={style}>
               <i className={`fa fa-${item._id}`}></i>
             </span>;
    }

    if (item.type === 'Flags') {
      icon = <span style={style}>
               <Flag name={item._id}
                     format="png"
                     pngSize={16}
                     shiny={true}
                     alt={`${item.label} flag`}
                     basePath="/flag-images"/>
             </span>;
    }

    return (
      <span>
        {icon}
        {item.label}
      </span>
    );
  }
}

export class IconSelector extends Component {
  componentWillMount() {
    const listOptions = fontawesomeIcons.map(icon => {
      return {_id: icon, type: 'Icons', label: icon};
    }).concat(countries.map(country => {
      return {_id: country.cca3, type: 'Flags', label: country.name.common};
    }));

    this.setState({listOptions});
  }

  render() {
    return (
      <DropdownList valueField="_id"
                    textField="label"
                    data={this.state.listOptions}
                    valueComponent={ListItem}
                    itemComponent={ListItem}
                    defaultValue={{}}
                    filter="contains"
                    groupBy="type"
                    {... this.props}/>
    );
  }
}

ListItem.propTypes = {
  item: PropTypes.object
};

export default IconSelector;

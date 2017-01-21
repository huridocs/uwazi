import WidgetsDropdownList from 'react-widgets/lib/DropdownList';

export default class DropdownList extends WidgetsDropdownList {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }
}

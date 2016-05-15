import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import UTCToLocal from 'app/Layout/UTCToLocal';

import {setPreviewDoc} from 'app/Library/actions/libraryActions';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

export class Doc extends Component {

  preview() {
    this.props.setPreviewDoc(this.props._id);
  }

  render() {
    let {title, _id, creationDate, template} = this.props;
    let documentViewUrl = '/document/' + _id;
    let type = this.props.templates.toJS().find((templ) => {
      return templ._id === template;
    }).name;
    return (
      <RowList.Item>
        <ItemName><Link to={documentViewUrl} className="item-name">{title}</Link></ItemName>
        <ItemFooter>
          <ItemFooter.Label>{type}</ItemFooter.Label>
          <ItemFooter.Label><UTCToLocal utc={creationDate}/></ItemFooter.Label>
          <Link to={documentViewUrl} className="item-shortcut"><i className="fa fa-file-o"></i></Link>
        </ItemFooter>
      </RowList.Item>
    );
  }
}

Doc.propTypes = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  template: PropTypes.string.isRequired,
  previewDoc: PropTypes.string,
  setPreviewDoc: PropTypes.func.isRequired,
  creationDate: PropTypes.number,
  templates: PropTypes.object
};


export function mapStateToProps(state) {
  return {
    previewDoc: state.library.ui.get('previewDoc'),
    templates: state.library.filters.get('templates')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setPreviewDoc}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);

import React, {Component, PropTypes} from 'react';
//import scroller from 'app/Viewer/utils/Scroller';
import {connect} from 'react-redux';
import {scrollTo} from 'app/Viewer/actions/uiActions';

export class ShowToc extends Component {

  scrollTo(tocElement, e) {
    e.preventDefault();
    this.props.scrollTo(tocElement, this.props.pdfInfo.toJS(), 'span');
    //scroller.to(`.document-viewer span[data-id="${tocElement._id}"]`, '.document-viewer');
  }

  render() {
    const {toc} = this.props;
    return (
      <div className="toc">
        <ul className="toc-view">
          {toc.map((tocElement, index) => {
            return (
              <li className={`toc-indent-${tocElement.indentation}`} key={index}>
                <a className="toc-view-link" href="#" onClick={this.scrollTo.bind(this, tocElement)}>{tocElement.label}</a>
              </li>
              );
          })}
        </ul>
      </div>
    );
  }
}

ShowToc.propTypes = {
  toc: PropTypes.array,
  pdfInfo: PropTypes.object,
  scrollTo: PropTypes.func
};

export const mapStateToProps = ({documentViewer}) => {
  return {
    pdfInfo: documentViewer.doc.get('pdfInfo')
  };
};

function mapDispatchToProps() {
  return {scrollTo};
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowToc);

import React, {Component, PropTypes} from 'react';
import scroller from 'app/Viewer/utils/Scroller';

export class ShowToc extends Component {

  scrollTo(tocElement, e) {
    e.preventDefault();
    scroller.to(`.document-viewer span[data-id="${tocElement._id}"]`, '.document-viewer');
  }

  render() {
    const {toc} = this.props;
    return (
      <div className="toc">
        <ul className="toc-view">
          {toc.map((tocElement, index) => {
            return (
              <li className="toc-indent-1" key={index}>
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
  toc: PropTypes.array
};

export default ShowToc;

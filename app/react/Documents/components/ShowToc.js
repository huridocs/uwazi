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
      <div className="side-panel-content">
        <ul className="view">
          {toc.map((tocElement, index) => {
            return (
              <li key={index}>
                <a href="#" onClick={this.scrollTo.bind(this, tocElement)}>{tocElement.label}</a>
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

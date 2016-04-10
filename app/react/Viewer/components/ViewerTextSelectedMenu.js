import React, {Component} from 'react';

export class ViewerTextSelectedMenu extends Component {
  render() {
    return (
      <div>
        <div className="float-btn__sec"><span>Reference to a document</span><i className="fa fa-file-o"></i></div>
        <div className="float-btn__sec"><span>Reference to a paragraph</span><i className="fa fa-file-text-o"></i></div>
        <div className="float-btn__sec"><span>Write a comment</span><i className="fa fa-comment"></i></div>
        <div className="float-btn__sec"><span>Add to bookmarks</span><i className="fa fa-bookmark"></i></div>
        <div className="float-btn__main"><i className="fa fa-plus"></i></div>
      </div>
    );
  }
}

ViewerTextSelectedMenu.propTypes = {
};

export default ViewerTextSelectedMenu;

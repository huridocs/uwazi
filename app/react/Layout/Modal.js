import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactModal from 'react-modal';

export default class Modal extends Component {
  render() {
    const style = { overlay: { zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.75)' } };
    const type = this.props.type || 'success';
    return (
      <ReactModal
        style={style}
        className={`modal-dialog modal-${type}`}
        isOpen={this.props.isOpen}
        contentLabel=""
        ariaHideApp={false}
      >
        <div className="modal-content">{this.props.children}</div>
      </ReactModal>
    );
  }
}

const childrenType = PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]);

Modal.propTypes = {
  isOpen: PropTypes.bool,
  type: PropTypes.string,
  children: childrenType,
};

const Body = ({ children }) => <div className="modal-body">{children}</div>;
Body.propTypes = { children: childrenType };

const Header = ({ children }) => <div className="modal-header">{children}</div>;
Header.propTypes = { children: childrenType };

const Footer = ({ children }) => <div className="modal-footer">{children}</div>;
Footer.propTypes = { children: childrenType };

const Title = ({ children }) => <h4 className="modal-title">{children}</h4>;
Title.propTypes = { children: childrenType };

const Close = ({ onClick }) => (
  <button type="button" className="close" onClick={onClick}>
    <span aria-hidden="true">&times;</span>
    <span className="sr-only">Close</span>
  </button>
);
Close.propTypes = { onClick: PropTypes.func };

Modal.Body = Body;
Modal.Header = Header;
Modal.Footer = Footer;
Modal.Title = Title;
Modal.Close = Close;

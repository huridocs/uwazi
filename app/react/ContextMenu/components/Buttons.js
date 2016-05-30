import React, {PropTypes} from 'react';

let Main = ({children, onClick, disabled}) => {
  return (
    <div className={'float-btn__main cta ' + (disabled ? 'disabled' : '')} onClick={onClick}>
      {children}
    </div>
  );
};


let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array,
  PropTypes.string
]);

Main.propTypes = {children: childrenType, onClick: PropTypes.func, disabled: PropTypes.bool};

export {Main};

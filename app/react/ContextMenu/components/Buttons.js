import React, {PropTypes} from 'react';

let Main = ({children, onClick}) => {
  return (
    <div className="float-btn__main cta" onClick={onClick}>
      {children}
    </div>
  );
};


let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array,
  PropTypes.string
]);

Main.propTypes = {children: childrenType, onClick: PropTypes.func};

export {Main};

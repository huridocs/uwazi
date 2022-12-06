/* eslint-disable react/no-multi-comp */
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const withRouter = Component => (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  return (
    <Component {...props} navigate={navigate} location={location} params={props.params || params} />
  );
};

export { withRouter };

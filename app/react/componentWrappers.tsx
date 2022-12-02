/* eslint-disable react/no-multi-comp */
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const withRouter = Component => {
  const ComponentWithRouterProp = props => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    return <Component {...props} router={{ location, navigate, params }} />;
  };

  return ComponentWithRouterProp;
};

const withRequestState = Component => (props: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  return <Component {...props} navigate={navigate} location={location} params={params} />;
};

export { withRouter, withRequestState };

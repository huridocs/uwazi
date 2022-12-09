/* eslint-disable react/no-multi-comp */
import React, { useContext } from 'react';
import { useLocation, useMatches, useNavigate, useParams } from 'react-router-dom';
import { AppMainContext } from './App/AppMainContext';

const withRouter = (Component: React.ComponentType) => (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const matches = useMatches();
  return (
    <Component
      {...props}
      navigate={navigate}
      location={location}
      params={{ ...params, ...props.params }}
      matches={matches}
    />
  );
};

const withContext = (Component: React.ComponentType) => (props: any) => {
  const mainContext = useContext(AppMainContext);
  return <Component {...props} mainContext={mainContext} />;
};

export { withRouter, withContext };

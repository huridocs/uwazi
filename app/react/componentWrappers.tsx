/* eslint-disable comma-spacing */
/* eslint-disable react/no-multi-comp */
import React, { useContext } from 'react';
import { useLocation, useMatches, useNavigate, useOutlet, useParams } from 'react-router-dom';
import { AppMainContext } from './App/AppMainContext';

const withRouter =
  <T,>(Component: React.ComponentClass<T & { params?: any }, any>) =>
  (props: T & { params?: any }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const matches = useMatches();
    return (
      <Component
        {...props}
        navigate={navigate}
        location={location}
        params={{ ...params, ...(props.params ? props.params : {}) }}
        matches={matches}
      />
    );
  };

const withContext =
  <T,>(Component: React.ComponentClass<T, any>) =>
  (props: T) => {
    const mainContext = useContext(AppMainContext);
    return <Component {...props} mainContext={mainContext} />;
  };

const withOutlet =
  <T,>(Component: React.ComponentClass<T, any>) =>
  (props: T) => {
    const outlet = useOutlet(AppMainContext);
    return <Component {...props} outlet={outlet} />;
  };
export { withRouter, withContext, withOutlet };

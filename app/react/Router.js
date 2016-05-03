import React from 'react';
import ReactDOM from 'react-dom';
import {renderToStaticMarkup} from 'react-dom/server';
import {browserHistory} from 'react-router';
import {Router, match, RouterContext} from 'react-router';
import Helmet from 'react-helmet';
import Routes from './Routes';
import {Provider} from 'react-redux';
import CustomProvider from './controllers/App/Provider';
import Root from './controllers/App/Root';
import NoMatch from './controllers/App/NoMatch';
import {isClient, getPropsFromRoute} from './utils';
import store from './store';
import api from 'app/utils/api';

if (isClient) {
  ReactDOM.render(
    <Provider store={store()}>
      <CustomProvider>
        <Router history={browserHistory}>{Routes}</Router>
      </CustomProvider>
    </Provider>,
    document.getElementById('root')
  );
}

function serialize(obj) {
  let str = [];

  for (let p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  }

  return str.join('&');
}

function renderComponentWithRoot(Component, componentProps, initialData, user, isRedux = false) {
  let componentHtml;

  let initialStore = store({});

  if (isRedux) {
    initialStore = store(initialData);
  }

  try {
    componentHtml = renderToStaticMarkup(
      <Provider store={initialStore}>
        <CustomProvider initialData={initialData} user={user}>
          <Component {...componentProps} />
        </CustomProvider>
      </Provider>
    );
  } catch (e) {
    // console.log(e);
  }

  const head = Helmet.rewind();

  let reduxData = {};
  let data = initialData;

  if (isRedux) {
    reduxData = initialData;
    data = {};
  }

  return '<!doctype html>\n' + renderToStaticMarkup(
    <Root content={componentHtml} initialData={data} head={head} user={user} reduxData={reduxData}/>
  );
}

function handle404(res) {
  const wholeHtml = renderComponentWithRoot(NoMatch);
  res.status(404).send(wholeHtml);
}

function handleError(res, error) {
  res.status(500).send(error.message);
}

function handleRedirect(res, redirectLocation) {
  res.redirect(302, redirectLocation.pathname + redirectLocation.search);
}

function handleRoute(res, renderProps, req) {
  //const isDeveloping = process.env.NODE_ENV !== 'production';

  const routeProps = getPropsFromRoute(renderProps, ['requestState', '__redux']);

  function renderPage(initialData, isRedux) {
    try {
      const wholeHtml = renderComponentWithRoot(RouterContext, renderProps, initialData, req.user, isRedux);
      res.status(200).send(wholeHtml);
    } catch (error) {
      console.trace(error);
    }
  }

  let cookie;

  if (req.cookies) {
    cookie = serialize(req.cookies);
  }

  if (routeProps.__redux) {
    api.authorize(cookie);
    return routeProps.requestState(renderProps.params).then((initialData) => {
      renderPage(initialData, true);
    }).catch(console.log);
  }
  if (routeProps.requestState) {
    //return routeProps.requestState(renderProps.params, instanceApi(cookie)).then(renderPage).catch(console.log);
  }
  renderPage();
}

function ServerRouter(req, res) {
  let userRoutes = ['/uploads', '/my_account'];
  if (!req.user && userRoutes.includes(req.url)) {
    res.redirect(302, '/login');
  }

  match({routes: Routes, location: req.url}, (error, redirectLocation, renderProps) => {
    if (error) {
      handleError(error);
    } else if (redirectLocation) {
      handleRedirect(res, redirectLocation);
    } else if (renderProps) {
      handleRoute(res, renderProps, req);
    } else {
      handle404(res);
    }
  });
}

export default ServerRouter;

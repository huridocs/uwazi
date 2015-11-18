var React = require("react");

var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;

// Components
var layout = require("./layout.jsx");
var login = require("./login.jsx");

var routes = (
  <Router>
    <Route path="/" component={layout}>
      <Route path="/login" component={login}/>
    </Route>
  </Router>
);

module.exports = routes;

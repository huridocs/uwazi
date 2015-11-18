var React = require('react');
var Router = require('react-router');
var Route = Router.Route, DefaultRoute = Router.DefaultRoute,
    RouteHandler = Router.RouteHandler, Link = Router.Link;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <header>
          <h1>
            Isomorphic Uwazi
          </h1>
          <nav>
            <ul>
              <li><Link to="app">Home</Link></li>
              <li><Link to="login">Login</Link></li>
            </ul>
          </nav>
        </header>
        <section className={"content"}>
          <RouteHandler/>
        </section>
      </div>
    );
  }
});

module.exports = App;

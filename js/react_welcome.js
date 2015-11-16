/** @jsx React.DOM */

var React = require('react/addons');

/* create factory with griddle component */

var ReactApp = React.createClass({

      render: function () {

        return (
          <span>Hello World!</span>
        )
      }

  });

/* Module.exports instead of normal dom mounting */
module.exports = ReactApp;
/* Normal mounting happens inside of /main.js and is bundled with browserify */

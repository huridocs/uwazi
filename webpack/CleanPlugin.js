/* eslint-disable */
var del = require('del');

module.exports = class CleanPlugin {
  constructor(options) {
    this.options = options;
  }

  apply () {
    del.sync(this.options);
  }
}

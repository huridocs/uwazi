/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
import Nightmare from 'nightmare';
// import selectors from './selectors.js';

Nightmare.action('navlinks', {
  add(label, url, done) {
    return this.clickLink('Add link')

      .clearInput('.col-sm-4 input')
      .write('.col-sm-4 input', label)

      .clearInput('.col-sm-8 input')
      .write('.col-sm-8 input', url)

      .then(() => done());
  },

  save(done) {
    return this.clickLink('Save')
      .wait('.menuItems a')
      .then(() => done());
  },

  getMenusJSON(done) {
    this.evaluate_now(() => {
      const helpers = document.__helpers;
      const links = helpers.querySelectorAll('.menuItems a');

      return [...links].map(link => ({ label: link.innerText, url: link.href }));
    }, done);
  },

  getFormJSON(done) {
    this.evaluate_now(() => {
      const helpers = document.__helpers;
      const result = [];
      const menus = helpers.querySelectorAll('.propery-form');

      menus.forEach(menu => {
        const inputs = menu.querySelectorAll('input');
        result.push({ label: inputs[0].value, url: inputs[1].value });
      });

      return result;
    }, done);
  },
});

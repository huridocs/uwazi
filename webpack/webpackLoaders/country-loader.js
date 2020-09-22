const countries = require('../../node_modules/world-countries/countries.json');

module.exports = () => {
  const processed = countries.map(country => ({
    cca3: country.cca3,
    name: { common: country.name.common },
    cca2: country.cca2,
  }));

  return `export default ${JSON.stringify(processed)}`;
};

module.exports = function (source) {
  const countries = require(__dirname + '/../../node_modules/world-countries/countries.json');
  const processed = countries.map((country) => {
    return {
      cca3: country.cca3,
      name: {common: country.name.common}
    };
  });

  return 'export default ' + JSON.stringify(processed);
};


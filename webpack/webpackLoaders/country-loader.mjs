import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const countries = JSON.parse(readFileSync(join(__dirname, '../../node_modules/world-countries/countries.json'), 'utf8'));

export default function countryLoader() {
  const processed = countries.map(country => ({
    cca3: country.cca3,
    name: { common: country.name.common },
    cca2: country.cca2,
  }));

  return `export default ${JSON.stringify(processed)}`;
}

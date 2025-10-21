import React from 'react';
import countries from 'world-countries';

const CountryList = new Map(
  countries.map(obj => [obj.cca3, { cca2: obj.cca2, label: obj.name.common, cca3: obj.cca3 }])
);

type CountryFlagProps = { id: string };

const CountryFlag = ({ id }: CountryFlagProps) => {
  const item = CountryList.get(id);
  if (!item) return null;

  return <span role="img" aria-label={item.label} className={`fi fi-${item.cca2.toLowerCase()}`} />;
};

export { CountryFlag };

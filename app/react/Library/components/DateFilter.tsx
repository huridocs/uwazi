import React from 'react';
import { DateRange } from 'app/ReactReduxForms';

interface DateRangeValue {
  from: string | number | null;
  to: string | number | null;
}

interface DateFilterProps {
  onChange?: (value: DateRangeValue) => void;
  model: string;
  label?: React.ReactNode;
  format?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({ 
  onChange = () => {}, 
  model, 
  label = '', 
  format = '' 
}) => (
  <ul className="search__filter is-active">
    <li>
      <label>{label}</label>
    </li>
    <li className="wide">
      <DateRange model={model} onChange={onChange} format={format} />
    </li>
  </ul>
);

export default DateFilter; 
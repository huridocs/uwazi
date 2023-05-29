import React, { createContext, useState } from 'react';

const SelectionContext = createContext({});

const TableSelector = ({ children }) => {
  const [selected, setSelected] = useState([]);

  return (
    <SelectionContext.Provider value={[selected, setSelected]}>
      {children}
    </SelectionContext.Provider>
  );
};

export { SelectionContext, TableSelector };

import React, { useState } from 'react';
import { ToggleButton } from 'app/UI';

export interface ToggleChildrenProps {
  children?: JSX.Element[] | string;
  toggled: boolean;
}

export const ToggleChildren = ({ children, toggled = false }: ToggleChildrenProps) => {
  const [isToggled, setToggled] = useState(toggled);

  const handleClick = () => {
    setToggled(!isToggled);
  };

  return (
    <>
      <ToggleButton onClick={handleClick} checked={isToggled} />
      {isToggled && children}
    </>
  );
};

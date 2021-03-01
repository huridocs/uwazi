import React, { useState } from 'react';
import { ToggleButton } from 'app/UI';

export interface ToggleChildrenProps {
  children?: JSX.Element[] | JSX.Element | string;
  onToggleOff?: () => void;
  onToggleOn?: () => void;
  toggled: boolean;
}

export const ToggleChildren = ({
  children,
  toggled = false,
  onToggleOff = () => {},
  onToggleOn = () => {},
}: ToggleChildrenProps) => {
  const [isToggled, setToggled] = useState(toggled);

  const handleClick = () => {
    if (isToggled) {
      onToggleOff();
    } else {
      onToggleOn();
    }
    setToggled(!isToggled);
  };

  return (
    <>
      <div className="toggle-children-button">
        <ToggleButton onClick={handleClick} checked={isToggled} />
      </div>
      <div className="toggle-children-children" style={{ display: isToggled ? 'block' : 'none' }}>
        {children}
      </div>
    </>
  );
};

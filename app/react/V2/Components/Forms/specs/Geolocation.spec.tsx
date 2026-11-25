/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { Geolocation } from '../Geolocation.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type MapSpy = {
  recenterRequest?: number;
  onClick?: (event: { lngLat: [number, number] }) => void;
};

const shown: { map?: MapSpy } = {};

jest.mock('#app/Map/MapContainer.js', () => ({
  Map: (props: MapSpy) => {
    shown.map = props;
    return <div data-testid="map" />;
  },
}));

describe('Geolocation framing', () => {
  it('frames an existing point on open and again when the point is replaced', () => {
    const view = render(<Geolocation name="place" value={{ lat: 10, lon: 20 }} />);

    expect(shown.map?.recenterRequest).toBe(1);

    view.rerender(<Geolocation name="place" value={{ lat: 11, lon: 21 }} />);

    expect(shown.map?.recenterRequest).toBe(2);
  });

  it('keeps the request when the map is clicked and starts at 0 when empty', () => {
    const ClickHarness = () => {
      const [value, setValue] = useState<{ lat?: number; lon?: number }>({ lat: 4, lon: 5 });
      return <Geolocation name="place" value={value} onChange={setValue} />;
    };
    const view = render(<Geolocation name="place" value={{}} />);

    expect(shown.map?.recenterRequest).toBe(0);
    view.unmount();
    render(<ClickHarness />);
    act(() => shown.map?.onClick?.({ lngLat: [8, 9] }));

    expect(screen.getByLabelText('Latitude')).toHaveValue(9);
    expect(shown.map?.recenterRequest).toBe(1);
  });
});

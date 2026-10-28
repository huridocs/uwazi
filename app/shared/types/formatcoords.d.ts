declare module 'formatcoords' {
  type CoordinateFormatOptions = {
    latLonSeparator: string;
    decimalPlaces: number;
  };

  type FormattedCoordinates = {
    format: (pattern: string, options: CoordinateFormatOptions) => string;
  };

  function formatcoords(latitude: number, longitude: number): FormattedCoordinates;

  export default formatcoords;
}

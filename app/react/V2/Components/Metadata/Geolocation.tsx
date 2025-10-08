import React from 'react';
import { Map } from 'app/Map';
import { MapProps } from 'app/Map/MapContainer';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';

type GeolocationProps = MetadataFieldProps & {
  markers: { value: { latitude: number; longitude: number } }[];
  height?: MapProps['height'];
  clickOnMarker?: MapProps['clickOnMarker'];
  onClick?: MapProps['onClick'];
  showControls?: MapProps['showControls'];
  renderPopupInfo?: MapProps['renderPopupInfo'];
  layers?: MapProps['layers'];
  zoom?: MapProps['zoom'];
};

const formatMarkers = (points: GeolocationProps['markers'], label: string): MapProps['markers'] =>
  points.map(point => ({
    latitude: point.value.latitude,
    longitude: point.value.longitude,
    label,
    properties: {},
  }));

const Geolocation = ({
  label,
  markers,
  translationContext,
  hideLabel,
  clickOnMarker,
  onClick,
  showControls,
  renderPopupInfo,
  layers,
  zoom,
  height = 500,
}: GeolocationProps) => (
  <div>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />

    <Map
      height={height}
      markers={formatMarkers(markers, label)}
      clickOnMarker={clickOnMarker}
      onClick={onClick}
      showControls={showControls}
      renderPopupInfo={renderPopupInfo}
      layers={layers}
      zoom={zoom}
    />
  </div>
);

export { Geolocation };

// {
//   "properties": {
//     "entity": {
//       "title": "Brazil",
//       "metadata": {
//         "geolocation_geolocation": [
//           {
//             "value": {
//               "lat": -10.092900239396712,
//               "lon": -49.39453125000001,
//               "label": ""
//             }
//           }
//         ]
//       },
//       "template": "58ada34c299e826748545059",
//       "language": "en",
//       "sharedId": "t8plml296d23mcxr",
//       "snippets": {
//         "count": 0,
//         "metadata": [],
//         "fullText": []
//       },
//       "_id": "58ada350299e826748545787"
//     },
//     "color": "#CDDC39",
//     "info": ""
//   },
//   "latitude": -10.092900239396712,
//   "longitude": -49.39453125000001,
//   "label": "Geolocation"
// }

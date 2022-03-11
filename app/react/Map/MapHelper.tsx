import L, { latLng } from 'leaflet';
import { svgPathData as faMapMarkerPath } from '@fortawesome/free-solid-svg-icons/faMapMarker';

type MarkerProperties = {
  entity?: {
    title: string;
    template: string;
  };
  templateInfo?: {
    color: string;
    name: string;
  };
  libraryMap?: boolean;
  info?: string;
  label?: string;
  color?: string;
};

type LMarker = {
  latlng: L.LatLng;
  properties: MarkerProperties;
};

type TemplatesInfo = {
  [k: string]: { color: string; name: string };
};

type MarkerInput = {
  label?: string;
  latitude: number;
  longitude: number;
  properties: MarkerProperties;
};

const DEFAULT_COLOR = '#d9534e';

class DataMarker extends L.Marker {
  properties?: MarkerProperties;

  constructor(
    latLngExpression: L.LatLngExpression,
    properties: MarkerProperties,
    options?: L.MarkerOptions
  ) {
    super(latLngExpression, options);
    this.properties = properties;
  }
}

const pointMarkerIcon = (color: string) =>
  L.divIcon({
    html: `
<svg viewBox="0 0 384 512" fill="${color || DEFAULT_COLOR}"><path d="${faMapMarkerPath}"/></svg>`,
    className: '',
    iconSize: [24, 40],
    iconAnchor: [12, 40],
  });

const circleIcon = (color: string) =>
  L.divIcon({
    html: `
<svg height="100" width="100">
  <circle cx="10" cy="10" r="10" stroke="white" stroke-width="1" fill="${color || DEFAULT_COLOR}"/>
</svg>`,
    className: '',
    iconSize: [20, 36],
    iconAnchor: [12, 12],
  });

const getMarkerIcon = ({ properties }: LMarker) => {
  const libraryMarker = properties.libraryMap || false;
  const color = properties.color || properties.templateInfo?.color || DEFAULT_COLOR;
  return !libraryMarker ? pointMarkerIcon(color) : circleIcon(color);
};

const getMarkerTooltip = (marker: LMarker) => `<div class="popup-container">
            <span class="btn-color btn-color-8">
              <span class="translation">${marker.properties.templateInfo?.name}</span>
            </span>&nbsp;
            <span class="popup-name">${marker.properties.entity?.title}</span>
            &nbsp;(<span class="popup-metadata-property">${marker.properties.label}</span>)
          </div>
        </div>
      `;

const getClusterMarker = (markerPoint: LMarker) => {
  const icon = getMarkerIcon(markerPoint);
  const marker = new DataMarker(
    [markerPoint.latlng.lat, markerPoint.latlng.lng],
    markerPoint.properties,
    { icon }
  );
  if (markerPoint.properties.libraryMap && markerPoint.properties.templateInfo) {
    marker.bindTooltip(getMarkerTooltip(markerPoint));
  } else if (marker.properties?.info) {
    marker.bindTooltip(marker.properties?.info);
  }
  return marker;
};

const parseMarkerPoint = (
  pointMarker: MarkerInput,
  templates: TemplatesInfo,
  libraryMap: boolean
) => {
  const templateInfo = pointMarker.properties?.entity
    ? templates[pointMarker.properties.entity.template]
    : undefined;

  return {
    latlng: latLng(pointMarker.latitude, pointMarker.longitude),
    properties: {
      ...pointMarker.properties,
      label: pointMarker.label || pointMarker.properties?.info,
      entity: pointMarker.properties?.entity,
      templateInfo,
      libraryMap,
    },
  };
};

const checkMapInitialization = (map: L.Map, containerId: string) => {
  if (!map) {
    const container = L.DomUtil.get(containerId);
    if (container != null) {
      // @ts-ignore
      container._leaflet_id = null;
    }
  }
};

export { DataMarker, getClusterMarker, parseMarkerPoint, checkMapInitialization };
export type { LMarker, MarkerProperties, MarkerInput, TemplatesInfo };

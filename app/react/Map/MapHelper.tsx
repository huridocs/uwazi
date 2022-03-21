import L, { latLng, LeafletEvent } from 'leaflet';
import { svgPathData as faMapMarkerPath } from '@fortawesome/free-solid-svg-icons/faMapMarker';
import { t } from 'app/I18N';

type MarkerProperties = {
  entity?: {
    sharedId: string;
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
  inherited?: boolean;
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

const getMarkerTooltip = (marker: LMarker) => {
  const templateColor = marker.properties.templateInfo?.color || DEFAULT_COLOR;
  const label = t(marker.properties.entity?.template, marker.properties.label, null, false);
  const title = t(marker.properties.entity?.sharedId, marker.properties.entity?.title, null, false);
  const templateName = t(
    marker.properties.entity?.template,
    marker.properties.templateInfo?.name,
    null,
    false
  );

  const markerLabel = marker.properties.inherited ? label : marker.properties.info;

  return `<div class="popup-container">
            <span class="btn-color" style="background-color: ${templateColor}">
              <span class="translation">${templateName}</span>
            </span>&nbsp;
            <span class="popup-name">${title}</span>
            &nbsp;(<span class="popup-metadata-property">${label}</span>)
            <div class="marker-info">
                <Icon className="tag-icon" icon="tag" />
                ${markerLabel}
            </div>
          </div>
        </div>
      `;
};

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
    const tooltip = t(marker.properties.entity?.template, marker.properties?.info, null, false);
    marker.bindTooltip(tooltip);
  }
  return marker;
};

const parseMarkerPoint = (
  pointMarker: MarkerInput,
  templates: TemplatesInfo,
  libraryMap: boolean = false
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

const preventDefaultEvent = (event: LeafletEvent) => {
  // @ts-ignore
  event.preventDefault();
};

export {
  DataMarker,
  getClusterMarker,
  parseMarkerPoint,
  checkMapInitialization,
  preventDefaultEvent,
};
export type { LMarker, MarkerProperties, MarkerInput, TemplatesInfo };

import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';

interface GeolocationMarker {
  lat: string;
  lon: string;
  label: string;
}

interface GroupedGeolocationViewerProps {
  members: {
    label: string;
    translationContext: string;
    value: GeolocationMarker[];
  }[];
}

export const GroupedGeolocationViewer = (props: GroupedGeolocationViewerProps) => {
  const markers = props.members.reduce(
    (flat: GeolocationMarker[], member) => flat.concat(member.value),
    []
  );
  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
    </>
  );
};

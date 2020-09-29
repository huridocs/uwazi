import React from 'react';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';

interface GeolocationMarker {
  lat: string;
  lon: string;
  label: string;
}

interface GroupMember {
  label: string;
  translationContext: string;
  value: GeolocationMarker[];
}

interface GroupedGeolocationViewerProps {
  members: GroupMember[];
}

const notInherited = (member: GroupMember) => member.value.length === 1 && !member.value[0].label;

const renderGroupInfo = (member: GroupMember) => {
  return notInherited(member) ? (
    <dl>
      <dt></dt>
      <dd>
          <span className="pill">{member.label}</span>
      </dd>
    </dl>
  ) : (
    <dl>
      <dt><span>{`${member.label}`}</span></dt>
      <dd>
        {member.value.map(value => (
          <span className="pill">{value.label}</span>
        ))}
      </dd>
    </dl>
  );
};

export const GroupedGeolocationViewer = (props: GroupedGeolocationViewerProps) => {
  const markers = props.members.reduce(
    (flat: GeolocationMarker[], member) => {
      if (notInherited(member)) {
        return flat.concat([{
          ...member.value[0],
          label: member.label
        }]);
      }

      return flat.concat(member.value)
    },
    []
  );
  return (
    <>
      <GeolocationViewer points={markers} onlyForCards={false} />
      {props.members.map(renderGroupInfo)}
    </>
  );
};

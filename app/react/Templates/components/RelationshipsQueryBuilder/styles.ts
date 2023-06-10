const edgeStylesBase = {
  styles: {
    width: '10px',
    flexGrow: '1',
  },
  lineWidth: 1,
  getLineStyle: (multiplier: number) => `solid ${multiplier * edgeStylesBase.lineWidth}px black`,
};

export const edgeStyles = {
  noVertical: {
    top: {
      ...edgeStylesBase.styles,
      borderBottom: edgeStylesBase.getLineStyle(1),
    },
    bottom: {
      ...edgeStylesBase.styles,
      borderTop: edgeStylesBase.getLineStyle(1),
    },
  },
  withVertical: {
    left: {
      top: {
        ...edgeStylesBase.styles,
        borderBottom: edgeStylesBase.getLineStyle(1),
        borderLeft: edgeStylesBase.getLineStyle(2),
      },
      bottom: {
        ...edgeStylesBase.styles,
        borderTop: edgeStylesBase.getLineStyle(1),
        borderLeft: edgeStylesBase.getLineStyle(2),
      },
    },
  },
};

export const edgeContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
};

export const boxStyles = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'stretch',
};

export const nodeContainerStyles = {
  display: 'flex',
  alignItems: 'center',
};

export const nodeStyles = {
  border: 'solid 1px black',
  borderRadius: '3px',
  padding: '3px',
  marginTop: '3px',
  marginBottom: '3px',
  display: 'flex',
  flexDirection: 'column' as const,
};

export const childrenStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
};

export interface EdgesProps {
  isFirst?: boolean;
  isLast?: boolean;
  isRight?: boolean;
}

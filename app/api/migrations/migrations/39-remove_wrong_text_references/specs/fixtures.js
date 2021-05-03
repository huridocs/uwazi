export default {
  connections: [
    { reference: { text: 'reference 1', selectionRectangles: [{}] } },
    { reference: { text: 'reference 2', selectionRectangles: [{}] } },
    { hub: 'hub1', reference: { text: 'wrong reference 1', selectionRectangles: [] } },
    { hub: 'hub2', reference: { text: 'wrong reference 2', selectionRectangles: [] } },
    { hub: 'hub3', reference: { text: 'wrong reference 3', selectionRectangles: [] } },
    { hub: 'hub1', reference: { text: 'wrong reference 1 partner' } },
    { hub: 'hub2', reference: { text: 'wrong reference 2 partner' } },

    //
    { hub: 'hub3', reference: {} },
    { hub: 'hub3', reference: {} },

    //
    { reference: { selectionRectangles: [] } },
    { reference: { selectionRectangles: [] } },
  ],
};

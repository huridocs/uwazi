import type {
  RelationshipAnchor,
  RelationshipHubRow,
  RelationshipResolved,
  RelationshipSummary,
} from '#V2/api/relationships/types.js';

const mergeRelationshipHubs = (
  summary: readonly RelationshipSummary[],
  anchors: readonly RelationshipAnchor[] = [],
  resolved: readonly RelationshipResolved[] = []
): RelationshipHubRow[] => {
  const byId = new Map<string, RelationshipHubRow>(summary.map(row => [row._id, { ...row }]));

  anchors.forEach(anchor => {
    const existing = byId.get(anchor._id);
    if (!existing) return;
    byId.set(anchor._id, {
      ...existing,
      reference: {
        ...existing.reference,
        selectionRectangles: [...anchor.reference.selectionRectangles],
      },
    });
  });

  resolved.forEach(row => {
    const existing = byId.get(row._id);
    if (!existing) return;
    byId.set(row._id, {
      ...existing,
      reference: {
        text: row.reference.text,
        selectionRectangles: row.reference.selectionRectangles,
      },
    });
  });

  return summary.flatMap(row => {
    const merged = byId.get(row._id);
    return merged ? [merged] : [];
  });
};

export { mergeRelationshipHubs };

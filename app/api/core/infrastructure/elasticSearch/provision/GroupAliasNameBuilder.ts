const GroupAliasNameBuilder = {
  /**
   * Derives the alias name for a named group.
   * e.g. ('enterprise', 'products') → 'products_group_enterprise'
   */
  toAlias(groupName: string, logicalName: string): string {
    return `${logicalName}_group_${groupName}`;
  },

  /**
   * Derives the initial physical index name for a new group.
   * e.g. ('enterprise', 'products') → 'products_group_enterprise_v1'
   */
  createInitialPhysicalIndex(groupName: string, logicalName: string): string {
    return `${GroupAliasNameBuilder.toAlias(groupName, logicalName)}_v1`;
  },
};

export { GroupAliasNameBuilder };

import { GroupAliasNameBuilder } from '../provision/GroupAliasNameBuilder.js';

describe('GroupAliasNameBuilder', () => {
  describe('toAlias()', () => {
    it("derives '<aliasName>_group_<groupName>' for a named group", () => {
      expect(GroupAliasNameBuilder.toAlias('enterprise', 'products')).toBe(
        'products_group_enterprise'
      );
    });

    it('handles hyphenated group names', () => {
      expect(GroupAliasNameBuilder.toAlias('high-volume', 'orders')).toBe(
        'orders_group_high-volume'
      );
    });
  });

  describe('toPhysicalIndex()', () => {
    it("derives '<alias>_v1' for a named group", () => {
      expect(GroupAliasNameBuilder.createInitialPhysicalIndex('enterprise', 'products')).toBe(
        'products_group_enterprise_v1'
      );
    });
  });
});

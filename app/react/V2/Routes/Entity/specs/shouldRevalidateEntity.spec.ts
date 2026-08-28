import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { shouldRevalidateEntity } from '../shouldRevalidateEntity.js';

const args = ({
  sharedId = 'shared1',
  nextSharedId = sharedId,
  pathname = '/en/entity/shared1',
  nextPathname = pathname,
  search = '',
  nextSearch = search,
  hash = '',
  nextHash = hash,
  formMethod,
  defaultShouldRevalidate = true,
}: {
  sharedId?: string;
  nextSharedId?: string;
  pathname?: string;
  nextPathname?: string;
  search?: string;
  nextSearch?: string;
  hash?: string;
  nextHash?: string;
  formMethod?: ShouldRevalidateFunctionArgs['formMethod'];
  defaultShouldRevalidate?: boolean;
}): ShouldRevalidateFunctionArgs => ({
  currentParams: { sharedId },
  nextParams: { sharedId: nextSharedId },
  currentUrl: new URL(`http://localhost${pathname}${search}${hash}`),
  nextUrl: new URL(`http://localhost${nextPathname}${nextSearch}${nextHash}`),
  formMethod,
  defaultShouldRevalidate,
});

describe('shouldRevalidateEntity', () => {
  it('skips revalidation for main-tab and hash-only UI changes', () => {
    expect(shouldRevalidateEntity(args({ search: '', nextSearch: '?m=metadata' }))).toBe(false);
    expect(shouldRevalidateEntity(args({ hash: '', nextHash: '#s=relationships' }))).toBe(false);
    expect(
      shouldRevalidateEntity(
        args({
          search: '?m=document',
          nextSearch: '?m=relationships',
          hash: '#s=toc',
          nextHash: '#s=metadata&page=2',
        })
      )
    ).toBe(false);
  });

  it('revalidates on explicit refresh of the same URL', () => {
    expect(shouldRevalidateEntity(args({ defaultShouldRevalidate: true }))).toBe(true);
    expect(shouldRevalidateEntity(args({ defaultShouldRevalidate: false }))).toBe(false);
  });

  it('revalidates when sharedId or language path changes', () => {
    expect(shouldRevalidateEntity(args({ nextSharedId: 'shared2' }))).toBe(true);
    expect(shouldRevalidateEntity(args({ nextPathname: '/es/entity/shared1' }))).toBe(true);
  });

  it('revalidates after non-GET form methods', () => {
    expect(
      shouldRevalidateEntity(
        args({
          search: '',
          nextSearch: '?m=metadata',
          formMethod: 'POST',
          defaultShouldRevalidate: false,
        })
      )
    ).toBe(true);
  });
});

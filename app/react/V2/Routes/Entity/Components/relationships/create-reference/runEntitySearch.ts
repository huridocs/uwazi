import { searchByTitle } from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';

type RunEntitySearchParams = {
  searchString: string;
  generation: number;
  searchGeneration: { current: number };
  searchFunction: (search: string) => ReturnType<typeof searchByTitle>;
  setSearchResults: (results: Entity[]) => void;
  setIsSearching: (searching: boolean) => void;
};

async function runEntitySearch({
  searchString,
  generation,
  searchGeneration,
  searchFunction,
  setSearchResults,
  setIsSearching,
}: RunEntitySearchParams) {
  try {
    const [result] = await searchFunction(searchString);
    if (generation !== searchGeneration.current) return;
    setSearchResults(result ?? []);
  } catch {
    if (generation !== searchGeneration.current) return;
    setSearchResults([]);
  } finally {
    if (generation === searchGeneration.current) {
      setIsSearching(false);
    }
  }
}

export { runEntitySearch };

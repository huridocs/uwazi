import { SearchQuery } from 'shared/types/SearchQueryType';
import { ElasticHit, SearchResponse } from 'api/search/elasticTypes';
import { EntitySchema } from 'shared/types/entityType';

function getSnippetsForNonFullText(hit: ElasticHit<EntitySchema>) {
  return hit.highlight
    ? Object.entries(hit.highlight).reduce<any>((memo, [property, highlights]: [any, any]) => {
        memo.push({ field: property, texts: highlights });
        return memo;
      }, [])
    : [];
}

type ElasticFullTextFile = {
  filename: string;
  language: string;
  originalname: string;
  text: string;
};

type Props = ElasticFullTextFile;

type SnippetDto = ReturnType<typeof createSnippetDto>;

const createSnippetDto = (props: Props) => {
  const PAGE_NUMBER_REGEX = /\[{2}(\d+)]{2}/g;

  const sanitizeText = (text: string) => text.replace(PAGE_NUMBER_REGEX, '');

  const createPage = (text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, page] = PAGE_NUMBER_REGEX.exec(text) || ['', '0'];
    return Number(page);
  };

  return {
    text: sanitizeText(props.text),
    filename: props.filename,
    originalname: props.originalname,
    page: createPage(props.text),
  };
};

function extractFullTextSnippets(hit: ElasticHit<EntitySchema>) {
  const snippetsDtos: SnippetDto[] = [];

  hit.inner_hits?.fullText.hits.hits.forEach(item => {
    const texts = Object.values<string[]>(item.highlight || {});

    texts.forEach(text =>
      text.forEach(i =>
        snippetsDtos.push(
          createSnippetDto({
            text: i,
            filename: item._source.filename,
            language: item._source.language,
            originalname: item._source.originalname,
          })
        )
      )
    );
  });

  const hitsCount = hit.highlight
    ? Object.values(hit.highlight).reduce<number>(
        (memo, highlights: any) => memo + highlights.length,
        0
      )
    : 0;

  return {
    count: snippetsDtos.length + hitsCount,
    metadata: getSnippetsForNonFullText(hit),
    fullText: snippetsDtos,
  };
}

export const mapResults = (entityResults: SearchResponse<EntitySchema>, searchQuery: SearchQuery) =>
  entityResults.hits.hits.map(entityResult => {
    const entity = entityResult._source;
    entity._id = entityResult._id;
    if (searchQuery.fields && searchQuery.fields.includes('snippets')) {
      entity.snippets = extractFullTextSnippets(entityResult);
    }
    return entity;
  });

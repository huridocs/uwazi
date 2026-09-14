/**
 * A suggestion could not be accepted because of the request itself — unknown ids, a mixed batch,
 * a suggestion still carrying an extraction error, or a value the target property rejects.
 *
 * It lives here rather than in `updateEntities.ts` so `handleError` can classify it without
 * importing that module's entity/template/file graph, which would add an import cycle. Same reason
 * `informationextraction/errors.ts` exists.
 */
class SuggestionAcceptanceError extends Error {}

export { SuggestionAcceptanceError };

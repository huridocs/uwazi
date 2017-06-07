/* eslint-disable max-depth */

// Adapted from http://blog.stevenlevithan.com/archives/javascript-match-nested
export default (function () {
  const formatParts = /^([\S\s]+?)\.\.\.([\S\s]+)/;
  const metaChar = /[-[\]{}()*+?.\\^$|,]/g;
  const escape = function (str) {
    return str.replace(metaChar, '\\$&');
  };

  return function (str, format, escapeCode = '') {
    const p = formatParts.exec(format);
    if (!p) {
      throw new Error('format must include start and end tokens separated by "..."');
    }

    if (p[1] === p[2]) {
      throw new Error('start and end format tokens cannot be identical');
    }

    const opener = p[1];
    const closer = p[2];
    const iterator = new RegExp(format.length === 5 ? '[' + escape(opener + closer) + ']' : escape(opener) + '|' + escape(closer), 'g');
    const results = [];
    let openTokens;
    let matchStartIndex;
    let match;

    do {
      openTokens = 0;
      while ((match = iterator.exec(str)) !== null) {
        if (match[0] === opener) {
          if (!openTokens) {
            matchStartIndex = iterator.lastIndex;
          }
          openTokens += 1;
        } else if (openTokens) {
          openTokens -= 1;
          if (!openTokens) {
            if (str.slice(matchStartIndex - escapeCode.length - opener.length, matchStartIndex - opener.length) === escapeCode) {
              results.push(str.slice(matchStartIndex, match.index));
            }
          }
        }
      }
    } while (openTokens && (iterator.lastIndex = matchStartIndex));

    return results;
  };
}());

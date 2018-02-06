import marked from 'marked';
import getYouTubeId from 'get-youtube-id';

const youtubePlaceholder = '{---UWAZIYOUTUBE---}';
const vimeoPlaceholder = '{---UWAZIVIMEO---}';

function embedYoutubeHtml(videoId) {
  return '<div class="video-container"><iframe ' +
           `src="https://www.youtube.com/embed/${videoId}` +
           '?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe></div>';
}

function embedVimeoHtml(videoId, options) {
  let queryOptions = '?';
  if (options.title === false) {
    queryOptions += 'title=0';
  }
  if (options.byline === false) {
    queryOptions += '&byline=0';
  }
  if (options.portrait === false) {
    queryOptions += '&portrait=0';
  }
  return '<div class="video-container"><iframe ' +
         `src="https://player.vimeo.com/video/${videoId}${queryOptions}" ` +
         'frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
}

function embedVideoHtml(videoId, type, options) {
  const videoHtmls = {
    youtube: embedYoutubeHtml(videoId),
    vimeo: embedVimeoHtml(videoId, options)
  };
  return videoHtmls[type];
}

function conformError(text, placeholder, escapeTagText) {
  const errorMatch = RegExp(placeholder + '\\((.*?)\\)', 'g');
  return text.replace(errorMatch, () => {
    return `<br /><strong><i>${escapeTagText} markup error: unsuported inline video, ` +
           `put {${escapeTagText}} tag on a single paragraph</i></strong><br />`;
  });
}

function prepareYouTubeVideo(markdown) {
  const youtubeMatch = /{youtube}\((.*?)\)/g;

  return markdown.replace(youtubeMatch, (_, videoUrl) => {
    const videoId = getYouTubeId(videoUrl);
    return `${youtubePlaceholder}(${videoId})`;
  });
}

function prepareVimeoVideo(markdown) {
  const vimeo = /{vimeo}\((.*?)\)/g;

  return markdown.replace(vimeo, (_, videoUrl) => {
    const paths = videoUrl.split('?')[0].split('/');
    const videoId = paths[paths.length - 1];
    return `${vimeoPlaceholder}(${videoId})`;
  });
}

function appendVideo(markdown, type) {
  const placeholders = {youtube: youtubePlaceholder, vimeo: vimeoPlaceholder};

  const placeholderMatch = RegExp(`<p>${placeholders[type]}` + '\\((.*?)\\)' + '</p>', 'g');

  let postMarkedText = markdown.replace(placeholderMatch, (_, params) => {
    const videoId = params.split(',')[0];
    let options = params.split(', ');
    options.shift();
    options = options.join(', ') || '{}';
    options = JSON.parse(options.replace(/&quot;/g, '"'));
    const html = embedVideoHtml(videoId, type, options);
    return html;
  });

  return conformError(postMarkedText, placeholders[type], type);
}

export default (markdown = '') => {
  let preMarkedText = markdown;
  let markedText;
  let postMarkedText;

  preMarkedText = prepareYouTubeVideo(preMarkedText);
  preMarkedText = prepareVimeoVideo(preMarkedText);

  markedText = marked(preMarkedText, {sanitize: true});

  postMarkedText = appendVideo(markedText, 'youtube');
  postMarkedText = appendVideo(postMarkedText, 'vimeo');

  return postMarkedText;
};

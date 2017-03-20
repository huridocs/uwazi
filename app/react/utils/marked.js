import marked from 'marked';
import getYouTubeId from 'get-youtube-id';

const videoPlaceholder = '{---UWAZIYOUTUBE---}';

function prepareYouTubeVideo(markdown) {
  const youtubeMatch = /{youtube}\((.*?)\)/g;
  const params = [];

  return markdown.replace(youtubeMatch, (_, videoUrl) => {
    const videoId = getYouTubeId(videoUrl);
    params.push(videoId);
    return `${videoPlaceholder}(${videoId})`;
  });
}

function appendYouTubeVideo(markdown) {
  const placeholderMatch = RegExp(`<p>${videoPlaceholder}` + '\\((.*?)\\)' + '</p>', 'g');

  let postMarkedText = markdown.replace(placeholderMatch, (_, videoId) => {
    const youtubeEmbedHtml = '<div class="video-container"><iframe ' +
                             `src="https://www.youtube.com/embed/${videoId}` +
                             '?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe></div>';
    return youtubeEmbedHtml;
  });

  const errorMatch = RegExp(videoPlaceholder + '\\((.*?)\\)', 'g');
  return postMarkedText.replace(errorMatch, () => {
    return '<br /><strong><i>YouTube markup error: unsuported inline video, put {youtube} tag on a single paragraph</i></strong><br />';
  });
}

export default (markdown = '') => {
  let preMarkedText = markdown;
  let markedText;
  let postMarkedText;

  preMarkedText = prepareYouTubeVideo(preMarkedText);

  markedText = marked(preMarkedText, {sanitize: true});

  postMarkedText = appendYouTubeVideo(markedText);

  return postMarkedText;
};

import { stripSnippetMarkup } from '../stripSnippetMarkup.js';

describe('stripSnippetMarkup', () => {
  it('returns empty for empty input', () => {
    expect(stripSnippetMarkup('')).toBe('');
  });

  it('keeps plain text and the highlight tags', () => {
    expect(stripSnippetMarkup('before <b>hit</b> after')).toBe('before <b>hit</b> after');
  });

  it('strips escaped rich text tags around a highlight', () => {
    expect(stripSnippetMarkup('&lt;p&gt;hello <b>world</b>&lt;/p&gt;')).toBe('hello <b>world</b>');
  });

  it('decodes entities inside the highlight', () => {
    expect(stripSnippetMarkup('<b>it&#x27;s</b>')).toBe("<b>it's</b>");
  });

  it('closes a highlight cut at the end of the fragment', () => {
    expect(stripSnippetMarkup('see <b>court')).toBe('see <b>court</b>');
  });

  it('drops an orphan closing highlight and keeps the word', () => {
    expect(stripSnippetMarkup('court</b> after')).toBe('court after');
  });

  it('drops attributes on the highlight tag', () => {
    expect(stripSnippetMarkup('<b class="x">hit</b>')).toBe('<b>hit</b>');
  });

  it('strips hex-encoded tags', () => {
    expect(stripSnippetMarkup('&#x3C;p&#x3E;hex <b>hit</b>&#x3C;/p&#x3E;')).toBe('hex <b>hit</b>');
  });
});

describe('stripSnippetMarkup cut fragments', () => {
  it('strips a tag cut at both ends of the fragment', () => {
    expect(
      stripSnippetMarkup('ss="intro">&lt;p&gt;La <b>protesta</b> siguió&lt;/p&gt;<p class="nex')
    ).toBe('La <b>protesta</b> siguió');
  });

  it('strips a tag name cut at the start and an unclosed close tag at the end', () => {
    expect(stripSnippetMarkup('ong>The <b>court</b> found</stro')).toBe('The <b>court</b> found');
  });

  it('strips a leading > left by a tag cut after its name', () => {
    expect(stripSnippetMarkup('>The <b>court</b>')).toBe('The <b>court</b>');
    expect(stripSnippetMarkup('/>The <b>court</b>')).toBe('The <b>court</b>');
  });

  it('strips an attribute cut that starts with a space', () => {
    expect(stripSnippetMarkup(' class="x">The <b>court</b>')).toBe('The <b>court</b>');
  });

  it('keeps comparisons that are not tags', () => {
    expect(stripSnippetMarkup('A &lt; b and score &gt; 10 <b>hit</b>')).toBe(
      'A < b and score > 10 <b>hit</b>'
    );
  });

  it('turns a line break into a space instead of gluing the words', () => {
    expect(stripSnippetMarkup('line<br>break <b>hit</b>')).toBe('line break <b>hit</b>');
    expect(stripSnippetMarkup('hello</p><p>world')).toBe('hello world');
  });

  it('drops script content and comments', () => {
    expect(stripSnippetMarkup('<script>alert(1)</script> keep <b>ok</b>')).toBe('keep <b>ok</b>');
    expect(stripSnippetMarkup('<!-- secret --> visible <b>hit</b>')).toBe('visible <b>hit</b>');
    expect(stripSnippetMarkup('visible <!-- secret')).toBe('visible');
  });

  it('strips a comment cut at the start and keeps an arrow', () => {
    expect(stripSnippetMarkup('com --> visible <b>hit</b>')).toBe('visible <b>hit</b>');
    expect(stripSnippetMarkup('a --> b <b>hit</b>')).toBe('a --> b <b>hit</b>');
  });
});

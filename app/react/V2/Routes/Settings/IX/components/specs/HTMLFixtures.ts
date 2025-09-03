const plainText =
  'Duis volutpat leo eu interdum euismod. Maecenas luctus ut lacus dapibus euismod. Vestibulum massa leo, hendrerit vitae metus aliquet, posuere finibus justo. Praesent sed molestie risus, vitae laoreet elit. Cras dapibus, neque a eleifend iaculis, nulla arcu euismod metus, et condimentum nisl eros eu odio.';

const basicMatching =
  '<p class="ix_adjacent_paragraph">A previous paragraph that is adjecent and should not appear</p><br/><p class="ix_matching_paragraph">Duis volutpat leo eu interdum euismod. Maecenas luctus ut lacus dapibus euismod.<span class="ix_match"> Praesent sed molestie risus, vitae laoreet elit.</span> Cras dapibus, neque a eleifend iaculis, nulla arcu euismod metus, et condimentum nisl eros eu odio.</p><br/><p class="ix_adjacent_paragraph">The next adjacent paragraph</p>';

const multipleMatching =
  '<p class="ix_adjacent_paragraph">Adjecent text that should not appear</p><p class="ix_matching_paragraph">Text thats part of the matching paragraph <span class="ix_match">Praesent sed molestie risus, vitae laoreet elit.</span></p><p class="ix_matching_paragraph">Other matching paragraph <span class="ix_match">matching word</span></p><p class="ix_adjacent_paragraph">Some text after all the matching stuff</p>';

const noMatching =
  '<p class="ix_paragraph">Duis volutpat leo eu interdum euismod. Maecenas luctus ut lacus dapibus euismod. Vestibulum massa leo, hendrerit vitae metus aliquet, posuere finibus justo.</p><p class="ix_paragraph">More content with no matches</p>';

export { plainText, basicMatching, multipleMatching, noMatching };

"use strict";var _elastic_testing = _interopRequireDefault(require("../../utils/elastic_testing"));

var _elastic = _interopRequireDefault(require("../elastic"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('custom language analyzers', () => {
  const elasticIndex = 'analyzers_index_test';
  const elasticTesting = (0, _elastic_testing.default)(elasticIndex);

  beforeEach(async () => {
    await elasticTesting.resetIndex();
  });

  describe('persian', () => {
    it('should index persian without errors', async () => {
      const persianText = `براي مشارکت فعال در کالس آماده باشيد. برای رسیدن به این هدف، بايد پیش از کالس به فايلهاي صوتي گوش کنيد،
ويديوها را ببينيد و تمرينهاي آنها را انجام دهيد. به صداهاي جديد گوش کنيد و حروف جديد را بنويسيد. هر چهقدر الزم است
اين کار را تکرار کنید، تا وقتي که شناختن و توليد اين صداها و حروف برايتان راحت و آسان شود. تمرينهاي در خانه را پيش
از کالس انجام دهيد تا براي خواندن و نوشتن در کالس آماده باشيد. وقت کالس بايد صرف تمرين شود، نه شنيدن سخنراني
استادتان.`;

      await _elastic.default.index({
        index: elasticIndex,
        type: 'fullText',
        body: { fullText_persian: persianText },
        id: '123_whatever',
        parent: 123 });

    });
  });
});
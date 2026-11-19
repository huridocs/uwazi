type HeaderColorSample = {
  site: string;
  bar?: string;
  text?: string;
  hover?: string;
  menuButton?: string;
  gradient?: boolean;
  backgroundImage?: boolean;
  heightPx?: number;
};

type HeaderCoverage = {
  site: string;
  covered: string[];
  gaps: string[];
};

const HEADER_COLOR_SAMPLES: HeaderColorSample[] = [
  { site: 'sos-defenders.org', bar: '#FFFFFF', text: '#000000' },
  { site: 'cyrilla.org', bar: '#FFFFFF', text: '#605E9A' },
  { site: 'www.girlsrightsplatform.org', bar: '#FFFFFF', text: '#000000', heightPx: 50 },
  { site: 'electionjudgments.org', bar: '#FFFFFF', text: '#0C9AD6' },
  { site: 'nkpd.io', bar: '#EA5050', text: '#1A1A1A' },
  { site: 'nkrf.io', bar: '#FFFFFF', text: '#000000' },
  { site: 'elobse.org', bar: '#EB2E11' },
  { site: 'studentsrightsmonitor.org', bar: '#66122C' },
  { site: 'transmurdermonitoring.tgeu.org', bar: '#3F3F3F', text: '#FFFFFF' },
  { site: 'antitransviolence.tgeu.org', bar: '#3F3F3F', text: '#FFFFFF' },
  { site: 'nkfootprints.info', bar: '#FFFFFF', text: '#444444' },
  { site: 'data.jpp.org.pk', bar: '#F1F1F1', text: '#000000' },
  { site: 'tibetanpoliticalprisoners.tchrd.org', bar: '#006400' },
  { site: 'summa.cejil.org', bar: '#C3112F', backgroundImage: true },
  { site: 'justiceforwagetheft.org', bar: '#212121', heightPx: 50, backgroundImage: true },
  { site: 'soha.dawlaty.org', heightPx: 96 },
  { site: 'caselaw.ihrda.org', bar: '#FFFFFF', menuButton: '#649C41', heightPx: 80 },
  { site: 'library.asiapacificforum.net', bar: '#FFFFFF', menuButton: '#003366' },
  { site: 'endreprisals.ishr.ch', bar: '#0A2540', hover: '#C3112F' },
  { site: 'ramo.youthinitiativef.org', gradient: true, text: '#1B1B1B' },
];

const named = (flag: string | boolean | number | undefined, name: string) => (flag ? name : '');

const assessHeaderSample = (sample: HeaderColorSample): HeaderCoverage => ({
  site: sample.site,
  covered: [named(sample.bar, 'header-bar'), named(sample.text, 'header-text')].filter(Boolean),
  gaps: [
    named(
      sample.hover && sample.hover.toLowerCase() !== sample.bar?.toLowerCase(),
      'hover-separate-hue'
    ),
    named(
      sample.menuButton && sample.menuButton.toLowerCase() !== sample.bar?.toLowerCase(),
      'menu-button-fill'
    ),
    named(sample.gradient, 'header-gradient'),
    named(sample.backgroundImage, 'header-background-image'),
    named(sample.heightPx, 'header-height'),
  ].filter(Boolean),
});

export { HEADER_COLOR_SAMPLES, assessHeaderSample };
export type { HeaderColorSample, HeaderCoverage };

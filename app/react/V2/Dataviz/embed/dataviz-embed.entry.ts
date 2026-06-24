declare global {
  interface Window {
    __DATAVIZ_CHART_OPTION__?: Record<string, unknown>;
  }
}

const initDatavizEmbed = () => {
  const root = document.getElementById('dataviz-embed-root');
  const option = window.__DATAVIZ_CHART_OPTION__;
  const echartsGlobal = (
    window as Window & {
      echarts?: {
        init: (el: HTMLElement) => { setOption: (o: unknown) => void; resize: () => void };
      };
    }
  ).echarts;

  if (!root || !option || !echartsGlobal) {
    return;
  }

  const chart = echartsGlobal.init(root);
  chart.setOption(option);

  window.addEventListener('resize', () => {
    chart.resize();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDatavizEmbed);
} else {
  initDatavizEmbed();
}

export {};

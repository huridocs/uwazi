import { Translate } from 'app/I18N';
import React from 'react';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { GridChart } from './GridChart';
import { TrainingHealthLegend } from './TrainingHealthLegend';

interface TrainingHealthDashboardProps {
  stats?: SuggestionsStats;
}

const mapStats = (data: SuggestionsStats['data']) => [
  {
    color: '#5073CF',
    value: data.labeledMatching,
    label: { text: <Translate>Training</Translate> },
    overlaying: true,
  },
  {
    color: '#CD4C4C',
    value: data.labeled,
  },
  {
    color: '#4CAE4C',
    value: data.nonLabeledMatching,
    label: { text: <Translate>Matching</Translate> },
  },
  {
    color: '#ECA41A',
    value: data.nonLabeledOthers,
    label: { text: <Translate>Non-matching</Translate> },
  },
  {
    color: '#E8E7EC',
    value: data.emptyOrObsolete,
    label: { text: <Translate>Empty / Obsolete</Translate>, color: 'black' },
  },
];

export const TrainingHealthDashboard = ({ stats }: TrainingHealthDashboardProps) => {
  if (!stats) return null;

  const data = mapStats(stats.data);

  return (
    <div className="training-dashboard">
      <TrainingHealthLegend data={data} total={stats.data.all} />
      <GridChart className="training-dashboard-chart" data={data} />
    </div>
  );
};

import { useEffect } from 'react';
import { CleanInsights as CI } from 'clean-insights-sdk';
import { useAtomValue } from 'jotai';
import { ciMatomoActiveAtom } from 'V2/atoms';

// January 1 of 2024 just happens to be a Monday.
// This makes it a suitable starting period for the weekly
// and monthly active user campaigns.
const startDate = '2024-01-01T00:00:00-00:00';

const campaigns = {
  daily_active_users: {
    start: startDate,
    end: '2024-12-31T23:59:59-00:00',
    aggregationPeriodLength: 1,
    numberOfPeriods: 365,
    onlyRecordOnce: true,
  },
  weekly_active_users: {
    start: startDate,
    end: '2024-12-31T23:59:59-00:00',
    aggregationPeriodLength: 7,
    numberOfPeriods: 53,
    onlyRecordOnce: true,
  },
  monthly_active_users: {
    start: startDate,
    end: '2024-12-31T23:59:59-00:00',
    // 28 day patterns align with weeks so all periods will have
    // the same # of weekdays/weekends.
    aggregationPeriodLength: 28,
    numberOfPeriods: 13,
    onlyRecordOnce: true,
  },
};

const ci = new CI({
  server: 'https://metrics.cleaninsights.org/cleaninsights.php',
  siteId: 35,
  campaigns: campaigns,
});

const grant = () => {
  Object.keys(campaigns).forEach(campaign => {
    ci.grantCampaign(campaign);
  });
  ci.measureEvent('activity', 'daily', 'daily_active_users');
  ci.measureEvent('activity', 'weekly', 'weekly_active_users');
  ci.measureEvent('activity', 'monthly', 'monthly_active_users');
};

const deny = () => {
  Object.keys(campaigns).forEach(campaign => {
    ci.denyCampaign(campaign);
  });
};

const measureActiveUser = (optedIn: boolean) => {
  try {
    if (optedIn) {
      grant();
    } else {
      deny();
    }
  } catch (e) {
    console.error('Error fetching analytics opt-in', e);
  }
};

const CleanInsights = () => {
  // Measurement involves aggregation over time, and this aggregation
  // happens in the browser's local storage, so useEffect.
  const optedIn = useAtomValue(ciMatomoActiveAtom);
  useEffect(() => {
    measureActiveUser(optedIn);
  }, []);
  return null;
};

export { CleanInsights };

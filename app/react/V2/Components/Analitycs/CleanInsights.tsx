import { useEffect } from 'react';
import { CleanInsights as CI } from 'clean-insights-sdk';

const campaigns = {
    "daily_active_users": {
        "start": "2024-01-01T00:00:00-00:00",
        "end": "2024-12-31T23:59:59-00:00",
        "aggregationPeriodLength": 1,
        "numberOfPeriods": 365,
        "onlyRecordOnce": true
    },
    "weekly_active_users": {
        "start": "2024-01-01T00:00:00-00:00",
        "end": "2024-12-31T23:59:59-00:00",
        "aggregationPeriodLength": 7,
        "numberOfPeriods": 53,
        "onlyRecordOnce": true
    },
    "monthly_active_users": {
        "start": "2024-01-01T00:00:00-00:00",
        "end": "2024-12-31T23:59:59-00:00",
        "aggregationPeriodLength": 30,
        "numberOfPeriods": 12,
        "onlyRecordOnce": true
    }
};

const ci = new CI({
    "server": "http://metrics.cleaninsights.org/cleaninsights.php",
    "siteId": 35,
    "campaigns": campaigns
});

function getAnalyticsOptIn() {
    // TODO: Fetch opt-in from central database
    console.log(
        "WARNING: Consent must be fetched from DB. This demo assumes consent"
    );
    return true;
}

const measureActiveUser = () => {
    const optedIn = getAnalyticsOptIn();
    console.log("Opted in: " + optedIn);
    if (optedIn) {
        for (var campaign in campaigns) {
            ci.grantCampaign(campaign);
        }
        ci.measureEvent("activity", "daily", "daily_active_users");
        ci.measureEvent("activity", "weekly", "weekly_active_users");
        ci.measureEvent("activity", "monthly", "monthly_active_users");
    } else {
        // If consent has been revoked, deny any campaigns that might have been
        // granted.
        for (var campaign in campaigns) {
            ci.denyCampaign(campaign);
        }
    }
}

const CleanInsights = () => {
    // Measurement involves aggregation over time, and this aggregation
    // happens in the browser's local storage, so useEffect.
    useEffect(() => {
        measureActiveUser();
    }, []);
    return null;
}

export { CleanInsights };
import { CleanInsights } from 'clean-insights-sdk';

const ci = new CleanInsights({
    "server": "http://example.com/ci/cleaninsights.php",
    "siteId": 1,
    "campaigns": {
        "feature1-usage": {
            "start": "2021-01-01T00:00:00-00:00",
            "end": "2021-12-31T23:59:59-00:00",
            "aggregationPeriodLength": 1,
            "numberOfPeriods": 90
        }
    }
});

console.log("The Clean Insights SDK has been initialized.");

export { ci };
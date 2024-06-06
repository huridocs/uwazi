import { CleanInsights } from 'clean-insights-sdk';

const ci = new CleanInsights({
    "server": "http://example.com/ci/cleaninsights.php",
    "siteId": 1,
    "campaigns": {
        "daily_active_users": {
            "start": "2024-01-01T00:00:00-00:00",
            "end": "2024-12-31T23:59:59-00:00",
            "aggregationPeriodLength": 1,
            "numberOfPeriods": 365,
            "onlyRecordOnce" : true
        },
        "weekly_active_users": {
            "start": "2024-01-01T00:00:00-00:00",
            "end": "2024-12-31T23:59:59-00:00",
            "aggregationPeriodLength": 1,
            "numberOfPeriods": 53,
            "onlyRecordOnce" : true
        },
        "monthly_active_users": {
            "start": "2024-01-01T00:00:00-00:00",
            "end": "2024-12-31T23:59:59-00:00",
            "aggregationPeriodLength": 30,
            "numberOfPeriods": 12,     
            "onlyRecordOnce": true
        }
    }
});


const measureActiveUser = () => {
    ci.measureEvent("activity", "daily", "daily_active_users");
    ci.measureEvent("activity", "weekly", "weekly_active_users");
    ci.measureEvent("activity", "monthly", "monthly_active_users");
    console.log("The Clean Insights SDK has been initialized.");
}

measureActiveUser();

ci.persist()



export { ci, measureActiveUser };
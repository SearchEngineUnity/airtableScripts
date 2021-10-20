// Works with this base https://airtable.com/appi4CqI26S7hIkr2/tbl8voueAdRU8R7jY/viwsYCGRsUnP2ylyI?blocks=bipgIvWlzaXqOy9o0

// Get current record
let table = base.getTable("Websites");
let record = await input.recordAsync('Pick a record', table);

// Get result table name from current record
// @ts-ignore
let resultTableName = record.name;
// @ts-ignore
let websiteRecordId = record.id;

// Fetch PSI api w/ URL + mobile/desktop + performance
    // return data into table
        // straight for 7 metrics
        // calculate perforance score based on score of the 6 metrics

const getPsiResults = async(url, deviceType, pageRecordId) => {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&strategy=${deviceType}&category=performance&key=AIzaSyAKZlmbC-OVjJe6sKaczGNhmoadtZ2XFmc`);
    const json = await response.json();
    const lighthouse = json.lighthouseResult;

    const fcp = lighthouse.audits['first-contentful-paint'].numericValue /1000;
    const si = lighthouse.audits['speed-index'].numericValue /1000;
    const tti = lighthouse.audits['interactive'].numericValue /1000;
    const lcp = lighthouse.audits['largest-contentful-paint'].numericValue /1000;
    const tbt = lighthouse.audits['total-blocking-time'].numericValue;
    const mpfid = lighthouse.audits['max-potential-fid'].numericValue;
    const cls = lighthouse.audits['cumulative-layout-shift'].numericValue;

    const fcpScore = lighthouse.audits['first-contentful-paint'].score;
    const siScore = lighthouse.audits['speed-index'].score;
    const lcpScore = lighthouse.audits['largest-contentful-paint'].score;
    const ttiScore = lighthouse.audits['interactive'].score;
    const tbtScore = lighthouse.audits['total-blocking-time'].score;
    const clsScore = lighthouse.audits['cumulative-layout-shift'].score;

    // This calculation is based on lighthouse v8
    const performance = Math.round((fcpScore * .1 + siScore * .1 + lcpScore * .25 + ttiScore * .1 + tbtScore * .3 + clsScore * .15) * 100);

    let resultTable = base.getTable(resultTableName);

    await resultTable.createRecordAsync({
        // @ts-ignore
        'URL': [{id: pageRecordId}],
        'Device': {name: deviceType},
        'Performance Score': performance,
        'First Contentful Paint (s)': fcp,
        'Speed Index (s)': si,
        'Time to Interactive (s)': tti,
        'Largest Contentful Paint (s)': lcp,
        'Total Blocking Time (ms)': tbt,
        'Max Potential First Input Delay (ms)': mpfid,
        'Cumulative Layout Shift': cls,
    });

    output.text(`New ${deviceType} Performance Record Added to ${resultTableName} for ${url}`);
}

// get the "pages" table
const pagesTable = base.getTable("Pages");

// Find all record where "Name (from Website)" matches the resultTableName
let queryPagesResult = await pagesTable.selectRecordsAsync();

// create an array of URLs and record Id from the above record
// run getPsiResults for each URL

let filteredRecords = queryPagesResult.records.filter(record => {
    let name = record.getCellValueAsString('Name (from Website)');
    return name === resultTableName
});

for (let record of filteredRecords) {
    let url = record.getCellValueAsString('URL');
    let pageRecordId = record.id;
    await getPsiResults(url, 'mobile', pageRecordId);
    await getPsiResults(url, 'desktop', pageRecordId);
};


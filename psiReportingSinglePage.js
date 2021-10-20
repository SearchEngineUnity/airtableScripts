// works in base https://airtable.com/appi4CqI26S7hIkr2/tbl8voueAdRU8R7jY/viwsYCGRsUnP2ylyI?blocks=bipgIvWlzaXqOy9o0

// Get current record
let table = base.getTable("Pages");
let record = await input.recordAsync('Pick a record', table);

// Get URL from current record
// @ts-ignore
let url = record.name;
// @ts-ignore
let pageRecordId = record.id;
// @ts-ignore
let resultTableName = record.getCellValue('Name (from Website)')[0]

// Fetch PSI api w/ URL + mobile/desktop + performance
    // return data into table
        // straight for 7 metrics
        // calculate perforance score based on score of the 6 metrics

const encodedUrl = encodeURIComponent(url)

const getPsiResults = async(encodedUrl, deviceType) => {
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

await getPsiResults(encodedUrl, 'mobile');
await getPsiResults(encodedUrl, 'desktop');

/*
Calculations:
    ‘New Customer’ = Deal Count == 1
    ‘Stale Deal’ = Times Since Last Inquiry > 30
*/
// Load Records
let kw_table = base.getTable(‘keywords’);
let kw_query = await kw_table.selectRecordsAsync();
let kw_records = kw_query.records
let term_table = base.getTable(‘mod term’);
let term_query = await term_table.selectRecordsAsync();
let term_records = term_query.records
let term = term_records.map(el => el.name)
console.log(kw_records)
console.log(term)
// Create an Array of tags when a record matches the criteria
let check = kw_records.map( c => {
    let modifierList = {}
    modifierList.id = c.id
    modifierList.tags = []
    term.map(t => {
        modifierList.tags.push(c.getCellValue(‘Name’).includes(t) ? t: null)
    });
return modifierList
});
console.log(check)
// Write tags to ‘Tags’ field
let update = check.map(c => ({id:c.id,fields:{‘Qualifier’:c.tags.filter(x => x).map(x => ({name:x}))}}))
// Update more than 50 records at a time using my favorite script from @Jeremy_Oglesby :innocent:
await batchAnd(‘Update’,kw_table,update)
/*
    Use this function to perform ‘Update’, ‘Create’, or ‘Delete’
    async actions on batches of records that could potentially
    more than 50 records.
    ::PARAMETERS::
    action = string; one of 3 values:
           - ‘Update’ to call table.updateRecordsAsync()
           - ‘Create’ to call table.createRecordsAsync()
           - ‘Delete’ to call table.deleteRecordsAsync()
    table = Table; the table the action will be performed in
    records = Array; the records to perform the action on
            - Ensure the record objects inside the array are
            formatted properly for the action you wish to
            perform
    ::RETURNS::
    recordsActedOn = integer, array of recordId’s, or null;
                   - Update Success: integer; the number of records processed by the function
                   - Delete Success: integer; the number of records processed by the function
                   - Create Success: array; the id strings of records created by the function
                   - Failure: null;
*/
async function batchAnd(action, table, records) {
    let recordsActedOn;
    switch (action) {
        case ‘Update’:
            recordsActedOn = records.length;
            while (records.length > 0) {
                await table.updateRecordsAsync(records.slice(0, 50));
                records = records.slice(50);
            };
            break;
        case ‘Create’:
            recordsActedOn = [];
            while (records.length > 0) {
                let recordIds = await table.createRecordsAsync(records.slice(0, 50));
                recordsActedOn.push(...recordIds)
                records = records.slice(50);
            };
            break;
        case ‘Delete’:
            recordsActedOn = records.length;
            while (records.length > 0) {
                await table.deleteRecordsAsync(records.slice(0, 50));
                records = records.slice(50);
            }
            break;
        default:
            output.markdown(`**Please use either ‘Update’, ‘Create’, or ‘Delete’ as the “action” parameter for the “batchAnd()” function.**`);
            recordsActedOn = null;
    }
    return recordsActedOn;
}
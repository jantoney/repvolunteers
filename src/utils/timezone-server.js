/**
 * Server-side timezone utilities for The Rep Volunteers application
 * All dates and times are treated as Adelaide, Australia timezone
 * This module provides functions for database operations involving timestamps
 */

const ADELAIDE_TIMEZONE = 'Australia/Adelaide';

/**
 * Generate SQL fragment for selecting a timestamptz column as Adelaide time
 * Use this in SELECT queries to ensure timestamps are returned in Adelaide time
 * 
 * @param {string} columnName - The name of the timestamptz column
 * @param {string} [alias=null] - Optional alias for the result column
 * @return {string} SQL fragment for the query
 * 
 * @example
 * // Returns: "my_column AT TIME ZONE 'Australia/Adelaide' AS my_column"
 * getAdelaideTimeSelectSQL('my_column');
 * 
 * @example
 * // Returns: "event_time AT TIME ZONE 'Australia/Adelaide' AS adelaide_time"
 * getAdelaideTimeSelectSQL('event_time', 'adelaide_time');
 */
function getAdelaideTimeSelectSQL(columnName, alias = null) {
    const resultAlias = alias || columnName;
    return `${columnName} AT TIME ZONE '${ADELAIDE_TIMEZONE}' AS ${resultAlias}`;
}

/**
 * Generate SQL parameter for inserting a timestamp treated as Adelaide time
 * Use this in INSERT/UPDATE queries to store timestamps correctly
 * 
 * @param {string} timestamp - ISO timestamp string to be treated as Adelaide time
 * @return {string} SQL fragment for the query parameter
 * 
 * @example
 * // For a string like "2025-07-15T18:00:00"
 * // Returns: "TIMESTAMP '2025-07-15 18:00:00' AT TIME ZONE 'Australia/Adelaide'"
 * getAdelaideTimeInsertSQL('2025-07-15T18:00:00');
 */
function getAdelaideTimeInsertSQL(timestamp) {
    if (!timestamp) return null;

    // Convert ISO format to PostgreSQL timestamp format
    const pgTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    return `TIMESTAMP '${pgTimestamp}' AT TIME ZONE '${ADELAIDE_TIMEZONE}'`;
}

/**
 * Generate complete SQL fragment for inserting a parameterized timestamptz
 * This version uses parameter placeholders for prepared statements
 * 
 * @param {string} paramName - The parameter name or placeholder (e.g., $1, :timestamp)
 * @return {string} SQL fragment for the query
 * 
 * @example
 * // Using numbered parameters (postgres-js style)
 * // Returns: "TIMESTAMP $1 AT TIME ZONE 'Australia/Adelaide'"
 * getAdelaideTimeParameterSQL('$1');
 * 
 * @example
 * // Using named parameters
 * // Returns: "TIMESTAMP :timestamp AT TIME ZONE 'Australia/Adelaide'" 
 * getAdelaideTimeParameterSQL(':timestamp');
 */
function getAdelaideTimeParameterSQL(paramName) {
    return `TIMESTAMP ${paramName} AT TIME ZONE '${ADELAIDE_TIMEZONE}'`;
}

/**
 * Prepare date and time for database queries using Deno's PostgreSQL client
 * Formats the date and time as an object suitable for parameterized queries
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @return {Object} Object with formatted SQL for Adelaide timezone
 * 
 * @example
 * // In a query:
 * // const params = prepareAdelaideDateTimeParam('2025-07-15', '18:00');
 * // await client.queryObject`INSERT INTO events (start_time) VALUES (${params.value})`;
 */
function prepareAdelaideDateTimeParam(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    const timestamp = `${dateStr} ${timeStr}:00`;

    return {
        value: timestamp,
        toSQL: () => `TIMESTAMP '${timestamp}' AT TIME ZONE '${ADELAIDE_TIMEZONE}'`
    };
}

module.exports = {
    ADELAIDE_TIMEZONE,
    getAdelaideTimeSelectSQL,
    getAdelaideTimeInsertSQL,
    getAdelaideTimeParameterSQL,
    prepareAdelaideDateTimeParam
};

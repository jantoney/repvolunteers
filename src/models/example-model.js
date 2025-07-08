/**
 * Example of how to use the timezone-server.js utilities in model functions
 * This file demonstrates the patterns to use when querying and saving data
 */

import { client } from "../db.js"; // Adjust this import based on your actual DB client
import {
    getAdelaideTimeSelectSQL,
    getAdelaideTimeParameterSQL,
    prepareAdelaideDateTimeParam
} from "../utils/timezone-server.js";

/**
 * Example: Retrieve a show with its performance times
 * @param {number} showId - The ID of the show to retrieve
 * @return {Promise<Object>} The show data with properly formatted times
 */
export async function getShow(showId) {
    // Use the Adelaide timezone utility to format the timestamp columns
    const result = await client.queryObject`
    SELECT 
      s.id,
      s.title,
      s.description,
      ${getAdelaideTimeSelectSQL('s.created_at')},
      ${getAdelaideTimeSelectSQL('p.start_time', 'performance_start')},
      ${getAdelaideTimeSelectSQL('p.end_time', 'performance_end')}
    FROM 
      shows s
    JOIN 
      performances p ON p.show_id = s.id
    WHERE 
      s.id = ${showId}
  `;

    if (result.rowCount === 0) {
        return null;
    }

    // Return the first row - the times are already in Adelaide timezone
    return result.rows[0];
}

/**
 * Example: Create a new show with performance times
 * @param {Object} showData - The show data including performance times
 * @return {Promise<Object>} The created show
 */
export async function createShow(showData) {
    // Start a transaction
    const transaction = client.createTransaction("create_show_tx");
    await transaction.begin();

    try {
        // Insert the show
        const showResult = await transaction.queryObject`
      INSERT INTO shows (title, description) 
      VALUES (${showData.title}, ${showData.description})
      RETURNING id
    `;

        const showId = showResult.rows[0].id;

        // For each performance, insert with Adelaide timezone handling
        for (const performance of showData.performances) {
            const { date, startTime, endTime } = performance;

            // Convert the start and end times to parameters with Adelaide timezone
            await transaction.queryObject`
        INSERT INTO performances (show_id, start_time, end_time)
        VALUES (
          ${showId},
          ${getAdelaideTimeParameterSQL('$1')},
          ${getAdelaideTimeParameterSQL('$2')}
        )
      `.args([`${date} ${startTime}`, `${date} ${endTime}`]);
        }

        await transaction.commit();

        // Return the newly created show
        return await getShow(showId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Example: Get upcoming shows within a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @return {Promise<Array>} List of shows in the date range
 */
export async function getShowsInRange(startDate, endDate) {
    // Convert start and end dates to parameters with Adelaide timezone
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    const result = await client.queryObject`
    SELECT 
      s.id,
      s.title,
      ${getAdelaideTimeSelectSQL('p.start_time', 'performance_time')}
    FROM 
      shows s
    JOIN 
      performances p ON p.show_id = s.id
    WHERE 
      p.start_time >= ${getAdelaideTimeParameterSQL('$1')}
      AND p.start_time <= ${getAdelaideTimeParameterSQL('$2')}
    ORDER BY 
      p.start_time ASC
  `.args([startDateTime, endDateTime]);

    return result.rows;
}

/**
 * Example: Update a performance time
 * @param {number} performanceId - The ID of the performance to update
 * @param {string} date - The new date (YYYY-MM-DD)
 * @param {string} startTime - The new start time (HH:MM)
 * @param {string} endTime - The new end time (HH:MM)
 * @return {Promise<boolean>} Success indicator
 */
export async function updatePerformanceTime(performanceId, date, startTime, endTime) {
    // Convert the start and end times to parameters with Adelaide timezone
    const start = prepareAdelaideDateTimeParam(date, startTime);
    const end = prepareAdelaideDateTimeParam(date, endTime);

    const result = await client.queryObject`
    UPDATE performances
    SET 
      start_time = ${start},
      end_time = ${end}
    WHERE 
      id = ${performanceId}
  `;

    return result.rowCount > 0;
}

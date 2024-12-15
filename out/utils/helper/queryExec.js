"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSqlQuery = void 0;
const oracledb = require("oracledb");
const vscode = require("vscode");
async function executeSqlQuery(connectionString, username, password, query, wattage) {
    let connection;
    try {
        // Attempt to connect to the Oracle database
        connection = await oracledb.getConnection({
            user: username,
            password: password,
            connectionString: connectionString
        });
        // Execute the SQL query
        const startTime = new Date();
        await connection.execute(query);
        const endTime = new Date();
        // Calculate the difference in milliseconds
        const timeDiff = endTime.getTime() - startTime.getTime();
        const kWhConsumed = ((parseInt(wattage) / 1000) * (timeDiff / 3600000));
        // Optionally, show the result in the VSCode interface
        let fixedNum = kWhConsumed.toFixed(20);
        vscode.window.showInformationMessage("This query consumes: " + parseFloat(fixedNum).toString() + " kWh");
    }
    catch (err) {
        console.error(err);
        vscode.window.showErrorMessage('Failed to execute SQL query.');
    }
    finally {
        // Ensure the connection is closed
        if (connection) {
            try {
                await connection.close();
            }
            catch (err) {
                console.error(err);
            }
        }
    }
}
exports.executeSqlQuery = executeSqlQuery;
//# sourceMappingURL=queryExec.js.map
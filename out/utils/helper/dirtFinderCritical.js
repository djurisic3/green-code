"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSelectAsteriskStatements = void 0;
const vscode = require("vscode");
const node_sql_parser_1 = require("node-sql-parser");
const counter = require("./counter");
const codeLocationStorage_1 = require("../plsql/codeLocationStorage");
function findSelectAsteriskStatements(document) {
    let decorations = [];
    let text = document.getText();
    (0, codeLocationStorage_1.clearLocations)("high");
    if (document.languageId.includes("sql") === false) {
        return [];
    }
    // Cartesian logic
    const parser = new node_sql_parser_1.Parser();
    // Modified SELECT * logic to extract table names
    const sqlStarStatementsWithFromTable = /\bselect\s+\*\s+from\s+(\w+)/gim; // Adjusted regex to capture table names
    let matchSqlStarWithFromTable;
    const tableCounts = {};
    while ((matchSqlStarWithFromTable = sqlStarStatementsWithFromTable.exec(text)) !==
        null) {
        // Extract the table name and add it to the list
        // Extract the table name and increment its count in the tableCounts object
        const tableName = matchSqlStarWithFromTable[1];
        if (tableCounts[tableName]) {
            tableCounts[tableName] += 1; // Increment count if table already encountered
        }
        else {
            tableCounts[tableName] = 1; // Initialize count if table encountered for the first time
        }
    }
    // Construct a string that represents the table names and their counts, separated by a special character
    let tablesAndCounts = [];
    for (const [table, count] of Object.entries(tableCounts)) {
        tablesAndCounts.push(`${table}:${count}`);
    }
    const tablesAndCountsStr = tablesAndCounts.join(",");
    // Regex to capture complete queries - simple version for demonstration
    const sqlStatements = /\bselect\s+\*\s+from\s+[\w\(\)\s\=\.\'\,\-\d]+;/gim;
    let matchSql;
    const availableQueries = [];
    while ((matchSql = sqlStatements.exec(text)) !== null) {
        // Add the complete query to the list
        const cleanedQuery = matchSql[0]
            .replace(/[\r\n]/g, " ")
            .trim()
            .replace(/^'(.*)'$/, "$1");
        availableQueries.push(cleanedQuery);
    }
    // Join all queries with a special character
    const queriesStr = availableQueries.join("|||");
    // Construct and execute the Python script command with all table names and counts
    // const command = `${pythonPath} ${scriptPath} "${queriesStr}"`;
    // child.exec(command, (err, stdout, stderr) => {
    //   if (err) {
    //     console.error("Error:", err);
    //     return;
    //   }
    //   if (stderr) {
    //     // Parse the last four lines of the output
    //     const lines = stderr.trim().split("\n");
    //     // Check if the last line contains 'Done!'
    //     if (lines.length > 1 && lines[lines.length - 1].includes("Done!")) {
    //       // Regular expression to match the kWh value (e.g., "0.000007 kWh")
    //       const energyRegex = /(\d+\.\d+)\s+kWh/;
    //       let energyConsumption = "";
    //       // Search for the kWh value in the last two lines
    //       const lastTwoLines = lines.slice(-2).join("\n");
    //       const match = energyRegex.exec(lastTwoLines);
    //       if (match) {
    //         energyConsumption = match[1]; // Capture the kWh value
    //       }
    //       // Display an information message in VS Code with the energy consumption value
    //       if (energyConsumption) {
    //         vscode.window.showInformationMessage(
    //           `Energy Consumption: ${energyConsumption} kWh`
    //         );
    //       } else {
    //         console.log("Energy consumption value not found.");
    //       }
    //     } else {
    //       // Optionally handle the case when 'Done!' is not found
    //       console.log("The script did not complete as expected.");
    //     }
    //     return;
    //   }
    //   console.log("Energy Consumption Analysis Results:", stdout);
    // });
    // SELECT * logic
    const sqlStarStatements = /\bselect\s+(?:\w+\.)?\*\s+(from|into)\b/gim;
    let matchSqlStar;
    while ((matchSqlStar = sqlStarStatements.exec(text)) !== null) {
        counter.incrementCounterCritical();
        const start = document.positionAt(matchSqlStar.index);
        const end = document.positionAt(sqlStarStatements.lastIndex);
        const savedRange = new vscode.Range(start, end);
        (0, codeLocationStorage_1.addLocation)(savedRange, "high");
        decorations.push({
            range: new vscode.Range(start, end),
            hoverMessage: `Use column names instead of the "*" wildcard character.   \nYou can save up to 40% in energy per statement call when using only relevant columns.`,
        });
    }
    let queries = text.split(/;(?![^(]*\))|(?<=\))/gm); // split text by ';' to get individual queries
    const forLoopRegex = /FOR\s+\w+\s+IN\s+\(([^)]+)\)\s+LOOP[\s\S]+?END\s+LOOP;/gim;
    let forLoopMatches = text.matchAll(forLoopRegex);
    // Process FOR loop queries
    for (let match of forLoopMatches) {
        let innerQuery = match[1]; // The capturing group with the query
        if (innerQuery) {
            let ast;
            try {
                ast = parser.astify(innerQuery);
            }
            catch (error) {
                // Handle parse error or skip
            }
            processAstNode(ast, innerQuery, decorations, document);
        }
    }
    for (let query of queries) {
        let ast;
        try {
            ast = parser.astify(query);
        }
        catch (error) {
            continue;
        }
        processAstNode(ast, query, decorations, document);
    }
    return decorations;
    function processAstNode(ast, query, decorations, document) {
        if (Array.isArray(ast)) {
            ast.forEach((node) => processAstNode(node, query, decorations, document));
        }
        else if (ast && ast.type === "select") {
            checkForCartesianProduct(ast, query, decorations, document);
            processNestedSelects(ast, query, decorations, document);
        }
    }
    function processNestedSelects(ast, query, decorations, document) {
        // Process nested queries in the FROM clause
        if (ast.from) {
            ast.from.forEach((fromItem) => {
                if (fromItem.expr &&
                    fromItem.expr.ast &&
                    fromItem.expr.ast.type === "select") {
                    processAstNode(fromItem.expr.ast, query, decorations, document);
                }
            });
        }
    }
    function checkForCartesianProduct(ast, query, decorations, document) {
        if (!ast || ast === undefined) {
            return;
        }
        //counter.resetCounterCritical(); // reseting counter and locations of high severity code spots
        if (isCartesianProduct(ast) || isUnusedJoin(ast) || isCrossJoin(ast)) {
            let start = document.positionAt(text.indexOf(query));
            let end = document.positionAt(text.indexOf(query) + query.length);
            const savedRange = new vscode.Range(start, end);
            counter.saveCartesianPosition(savedRange);
            (0, codeLocationStorage_1.addLocation)(savedRange, "high");
            counter.incrementCounterCritical();
            decorations.push({
                range: new vscode.Range(start, end),
                hoverMessage: "Cartesian product or unused join detected. Please review the query for potential issues.",
            });
        }
    }
    function isUnusedJoin(ast) {
        if (ast.type === "select" && ast.join) {
            const joinTables = ast.join.map((joinNode) => joinNode.table);
            const fromTables = ast.from.map((fromNode) => fromNode.table);
            const unusedJoin = joinTables.some((joinTable) => !fromTables.includes(joinTable));
            return unusedJoin;
        }
        return false;
    }
    function isCrossJoin(ast) {
        if (ast.type === "select" &&
            ast.from &&
            ast.from.length === 1 &&
            ast.from[0].type === "table" &&
            ast.from[0].join &&
            ast.from[0].join[0].type === "cross") {
            return true;
        }
        return false;
    }
    function isCartesianProduct(ast) {
        if (!ast || ast.type !== "select" || !ast.from || ast.from.length <= 1) {
            return false;
        }
        const hasSubquery = ast.from.some((fromItem) => fromItem.expr &&
            fromItem.expr.ast &&
            fromItem.expr.ast.type === "select");
        // if (hasSubquery) {
        //   // Here, you can add logic to check whether these subqueries are joined correctly
        //   // For now, we will return true if there's at least one subquery in the FROM clause
        //   return true;
        // }
        const fromTables = [];
        const joinConditions = [];
        function recurseThroughJoinAndFromNodes(node) {
            if (!node) {
                return;
            }
            if (node.table || node.as) {
                fromTables.push({
                    name: node.table,
                    alias: node.as || null,
                });
            }
            // Checking for join condition in the node
            if (node.on) {
                joinConditions.push(node.on);
            }
            if (node.join) {
                const joins = Array.isArray(node.join) ? node.join : [node.join];
                joins.forEach((joinNode) => {
                    if (joinNode.on) {
                        joinConditions.push(...extractJoinConditions(joinNode));
                    }
                    recurseThroughJoinAndFromNodes(joinNode.table);
                });
            }
        }
        ast.from.forEach((fromNode) => recurseThroughJoinAndFromNodes(fromNode));
        if (!ast.where && joinConditions.length === 0) {
            return true;
        }
        else {
            const conditions = ast.where
                ? extractWhereConditions(ast.where)
                : [];
            conditions.push(...joinConditions);
            const usedTables = new Set();
            function extractTableNames(condition) {
                if (!condition) {
                    return;
                }
                // Recursively process binary expressions
                if (condition.type === "binary_expr") {
                    extractTableNames(condition.left);
                    extractTableNames(condition.right);
                }
                // Extract table names from column references
                if (condition.type === "column_ref") {
                    usedTables.add(condition.table);
                }
            }
            conditions.forEach(extractTableNames);
            joinConditions.forEach(extractTableNames);
            // If not all tables are used in ON conditions, it's a Cartesian product
            // Compare the elements of usedTables with fromTables
            const allTablesUsed = fromTables.every((table) => usedTables.has(table.name) ||
                (table.alias && usedTables.has(table.alias)));
            if (!allTablesUsed) {
            }
            // A Cartesian product is present if not all tables are used in the conditions
            return !allTablesUsed;
        }
    }
    function extractJoinConditions(joinNodeOrArray) {
        let conditions = [];
        // Check if the input is an array, and if so, extract conditions from each join object in the array
        if (Array.isArray(joinNodeOrArray)) {
            joinNodeOrArray.forEach((joinObj) => {
                if (joinObj.on) {
                    conditions.push(joinObj.on);
                }
            });
        }
        // If the input is not an array but a single join object, extract the condition from it
        else if (joinNodeOrArray && joinNodeOrArray.on) {
            conditions.push(joinNodeOrArray.on);
        }
        return conditions;
    }
    function extractWhereConditions(whereObj) {
        let conditions = [];
        // Recursively process the left part of the whereObj
        if (whereObj && whereObj.left) {
            conditions = conditions.concat(extractWhereConditions(whereObj.left));
        }
        // Recursively process the right part of the whereObj
        if (whereObj && whereObj.right) {
            conditions = conditions.concat(extractWhereConditions(whereObj.right));
        }
        // If whereObj itself is a condition (e.g., a binary expression), handle it
        if (whereObj && whereObj.type === "binary_expr") {
            // Construct a condition string from the binary expression
            conditions.push(whereObj);
        }
        return conditions;
    }
    //
    return decorations;
}
exports.findSelectAsteriskStatements = findSelectAsteriskStatements;
//# sourceMappingURL=dirtFinderCritical.js.map
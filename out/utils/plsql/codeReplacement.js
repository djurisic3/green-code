"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlForLoopReplacement = exports.sqlExplicitJoinCursorReplacement = exports.sqlExplicitJoinHoverReplacement = exports.sqlImplicitJoinCursorReplacement = exports.sqlImplicitJoinHoverReplacement = void 0;
const vscode = require("vscode");
const cursor = require("./cursorHelper");
const primaryKeyHelper_1 = require("./primaryKeyHelper");
const loginManager_1 = require("./loginManager");
const counter = require("../helper/counter");
const forLoopHelper = require("./forLoopHelper");
const replaceCounter = require("../helper/replacementCounter");
async function sqlImplicitJoinHoverReplacement(currentSqlHover) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const loginData = await (0, loginManager_1.getLoginDataPlSql)();
    if (!loginData)
        return;
    // Here, instead of getting the cursor position, you retrieve the hovered word.
    const range = currentSqlHover.currentImplicitSqlRange;
    if (!range) {
        return;
    }
    const implicitJoinCursor = editor.document.getText(range);
    if (!implicitJoinCursor) {
        return;
    }
    let matchImplicitJoin;
    const implicitJoinRegex = /\bSELECT\b\s+((?:(?!SELECT|UPDATE|DELETE|INSERT)[\s\S])*?)\bFROM\b\s+((\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*)\s+(WHERE\s+((\w+(\.\w+)?\s*=\s*(\([^)]*\)|[\s\S]+?))(?:\s*(AND|OR)\s+(\w+(\.\w+)?\s*=\s*(\([^)]*\)|[\s\S]+?)))*))?(?:\s*;)?[^\S\r\n]*$/gim;
    while ((matchImplicitJoin = implicitJoinRegex.exec(implicitJoinCursor)) !== null) {
        const matchWhere = matchImplicitJoin[13]?.toString() || "";
        const [tableInfo, isPrimaryKeyAbsent, isValidSql, primaryKeyMap, tableAliasMap,] = (await (0, primaryKeyHelper_1.checkImplicitPrimKeys)(loginData, matchImplicitJoin, matchWhere));
        if (isValidSql) {
            const replacedCode = implicitJoinCursor.replace(/\bWHERE\s+((\w+(\.\w+)?\s*=\s*\w+(\.\w+)?)(\s+(AND|OR)\s+(\w+(\.\w+)?\s*=\s*\w+(\.\w+)?))*)/gim, (match) => {
                const newConditions = [];
                for (const tableName in primaryKeyMap) {
                    const primaryKeys = primaryKeyMap[tableName];
                    const tableAlias = Array.from(tableAliasMap.entries()).find(([alias, actualTableName]) => actualTableName === tableName.toLocaleLowerCase())?.[0] || tableName;
                    for (const primaryKey of primaryKeys) {
                        const primaryKeyRegex = new RegExp(`\\b${tableAlias}\\b\\s*\\.\\s*\\b${primaryKey}\\b`, "gim");
                        if (!primaryKeyRegex.test(match)) {
                            newConditions.push(`${tableAlias}.${primaryKey} = value`);
                        }
                    }
                }
                const currentConditions = match
                    .replace(/^\s*WHERE\s+/gim, "")
                    .split(/\s+(?:AND|OR)\s+/);
                const newConditionsSet = new Set(newConditions);
                if (newConditions.length > 0 &&
                    !currentConditions.every((cond) => newConditionsSet.has(cond))) {
                    return `${match} AND ${newConditions.join(" AND ")}`;
                }
                else {
                    return match;
                }
            });
            if (range.contains(editor.selection.active)) {
                counter.decrementCounter();
                editor.edit((editBuilder) => {
                    editBuilder.replace(range, replacedCode);
                    currentSqlHover.currentImplicitSql = undefined;
                    currentSqlHover.currentImplicitSqlRange = undefined;
                });
            }
        }
    }
}
exports.sqlImplicitJoinHoverReplacement = sqlImplicitJoinHoverReplacement;
async function sqlImplicitJoinCursorReplacement(currentSqlHover) {
    let replacedCode;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const loginData = await (0, loginManager_1.getLoginDataPlSql)();
    if (!loginData)
        return;
    let matchImplicitJoin;
    let matchWhere;
    const implicitJoinRegex = /\bSELECT\b\s+((?:(?!SELECT|UPDATE|DELETE|INSERT)[\s\S])*?)\bFROM\b\s+((\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*)\s+(WHERE\s+((\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*(\([^)]*\)|[\s\S]+?))(?:\s*(AND|OR)\s+(\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*(\([^)]*\)|[\s\S]+?)))*))?(?:\s*;)?[^\S\r\n]*$/gim;
    const position = editor.selection.active;
    let implicitJoinCursorAndRange = cursor.isCursorOnImpJoin(position);
    if (!implicitJoinCursorAndRange) {
        return;
    }
    let [implicitJoinCursor, implicitJoinRange] = implicitJoinCursorAndRange;
    implicitJoinCursor = implicitJoinCursor.toString();
    if (!implicitJoinCursor) {
        return;
    }
    else if (implicitJoinCursor) {
        while ((matchImplicitJoin = implicitJoinRegex.exec(implicitJoinCursor)) !== null) {
            if (matchImplicitJoin[13] === undefined) {
                matchWhere = "";
            }
            else {
                matchWhere = matchImplicitJoin[13].toString();
            }
            const [tableInfo, isPrimaryKeyAbsent, isValidSql, primaryKeyMap, tableAliasMap,] = (await (0, primaryKeyHelper_1.checkImplicitPrimKeys)(loginData, matchImplicitJoin, matchWhere));
            if (isValidSql) {
                replacedCode = implicitJoinCursor.replace(/\bWHERE\s+(\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*('[^']*'|"[^"]*"|[\w.]+(\('[^']+'\)|\("[^"]+"\)|\(\d+\))?|[^ \nANDOR]+))(\s+(AND|OR)\s+(\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*('[^']*'|"[^"]*"|[\w.]+(\('[^']+'\)|\("[^"]+"\)|\(\d+\))?|[^ \nANDOR]+)))*/gim, (match) => {
                    let newConditions = [];
                    for (const tableName in primaryKeyMap) {
                        const primaryKeys = primaryKeyMap[tableName];
                        const tableAlias = Array.from(tableAliasMap.entries()).find(([alias, actualTableName]) => actualTableName === tableName.toLocaleLowerCase())?.[0] || tableName;
                        for (const primaryKey of primaryKeys) {
                            const primaryKeyRegex = new RegExp(`\\b${tableAlias}\\b\\s*\\.\\s*\\b${primaryKey}\\b`, "gim");
                            if (!primaryKeyRegex.test(match)) {
                                newConditions.push(`${tableAlias}.${primaryKey} = value`);
                            }
                        }
                    }
                    const currentConditions = match
                        .replace(/^\s*WHERE\s+/gim, "")
                        .split(/\s+(?:AND|OR)\s+/);
                    const newConditionsSet = new Set(newConditions);
                    let endChar = "";
                    if (match.endsWith(";")) {
                        // Remove the last character (semicolon) and store it
                        endChar = ";";
                        match = match.slice(0, -1);
                    }
                    else if (match.endsWith(")")) {
                        // Remove the last character (closing bracket) and store it
                        endChar = ")";
                        match = match.slice(0, -1);
                    }
                    if (newConditions.length > 0 &&
                        !currentConditions.every((cond) => newConditionsSet.has(cond))) {
                        replaceCounter.incrementCounter();
                        return `${match} AND ${newConditions.join(" AND ")}${endChar}`;
                    }
                    else {
                        return match + endChar;
                    }
                });
            }
            const document = editor.document;
            const text = document.getText();
            // Retrieve the range from the hover provider
            //let implicitJoinRange = currentSqlHover.currentImplicitSqlRange;
            if (!implicitJoinRange) {
                console.log("No current SQL range available");
                return;
            }
            console.log(counter.getCartesianPosition());
            let containsPosition = false;
            // Loop through each range and check if the position is contained in the range
            for (const range of counter.getCartesianPosition()) {
                if (range.contains(position)) {
                    containsPosition = true;
                    break; // Exit the loop as we found a matching range
                }
            }
            if (implicitJoinRange.contains(position) && !containsPosition) {
                counter.decrementCounter();
                editor.edit((editBuilder) => {
                    editBuilder.replace(implicitJoinRange, replacedCode); //here
                    currentSqlHover.currentImplicitSql = undefined;
                    currentSqlHover.currentImplicitSqlRange = undefined;
                    counter.clearCartesianPositions();
                });
            }
        }
    }
}
exports.sqlImplicitJoinCursorReplacement = sqlImplicitJoinCursorReplacement;
async function sqlExplicitJoinHoverReplacement(currentSqlHover) {
    let replacedCode;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const loginData = await (0, loginManager_1.getLoginDataPlSql)();
    if (!loginData)
        return;
    let matchExplicitJoin;
    let matchJoin;
    const explicitJoinRegex = /\bSELECT\b\s*(?:(?!\bFROM\b).)*(?:\bFROM\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*\s+)((?:\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))(?:\s*\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))*)+(\s*;)?\s*$/gim;
    // We utilize the hover range provided by currentSqlHover for our hover functionality
    const hoverRange = currentSqlHover.currentExplicitSqlRange;
    if (!hoverRange) {
        return;
    }
    const explicitJoinText = editor.document.getText(hoverRange).trim();
    if (!explicitJoinText) {
        return;
    }
    while ((matchExplicitJoin = explicitJoinRegex.exec(explicitJoinText)) !== null) {
        if (matchExplicitJoin[10] === undefined) {
            matchJoin = "";
        }
        else {
            matchJoin = matchExplicitJoin[10].toString();
        }
        const [tableInfo, isPrimaryKeyAbsent, isValidSql, primaryKeyMap, tableAliasMap,] = (await (0, primaryKeyHelper_1.checkExplicitPrimKeys)(loginData, matchExplicitJoin, matchJoin));
        if (isValidSql) {
            replacedCode = explicitJoinText.replace(/\bSELECT\b\s*(?:(?!\bFROM\b).)*(?:\bFROM\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*\s+)((?:\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))(?:\s*\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))*)+(\s*;)?\s*$/gim, (match) => {
                let newConditions = [];
                for (const tableName in primaryKeyMap) {
                    const primaryKeys = primaryKeyMap[tableName];
                    const tableAlias = Array.from(tableAliasMap.entries()).find(([alias, actualTableName]) => actualTableName === tableName.toLocaleLowerCase() // toLocaleLowerCase because PLSQL saves tables in upper case
                    )?.[0] || tableName;
                    for (const primaryKey of primaryKeys) {
                        const primaryKeyRegex = new RegExp(`\\b${tableAlias}\\b\\s*\\.\\s*\\b${primaryKey}\\b`, "gim");
                        if (!primaryKeyRegex.test(match)) {
                            newConditions.push(`${tableAlias}.${primaryKey} = value`);
                        }
                    }
                }
                const currentConditions = match
                    .replace(/^\s*JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+/gi, "")
                    .split(/\s+(?:AND|OR)\s+/);
                const newConditionsSet = new Set(newConditions);
                if (newConditions.length > 0 &&
                    !currentConditions.every((cond) => newConditionsSet.has(cond))) {
                    return `${match} AND ${newConditions.join(" AND ")}`;
                }
                else {
                    return match;
                }
            });
        }
        editor.edit((editBuilder) => {
            editBuilder.replace(hoverRange, replacedCode);
            currentSqlHover.currentExplicitSql = undefined;
            currentSqlHover.currentExplicitSqlRange = undefined;
        });
    }
}
exports.sqlExplicitJoinHoverReplacement = sqlExplicitJoinHoverReplacement;
async function sqlExplicitJoinCursorReplacement(currentSqlHover) {
    let replacedCode;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const loginData = await (0, loginManager_1.getLoginDataPlSql)();
    if (!loginData)
        return;
    let matchExplicitJoin;
    let matchJoin;
    const explicitJoinRegex = /\bSELECT\b\s*(?:(?!\bFROM\b).)*(?:\bFROM\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*\s+)((?:\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))(?:\s*\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))*)+(\s*;)?\s*$/gim;
    const position = editor.selection.active;
    let explicitJoinCursorAndRange = cursor.isCursorOnExpJoin(position);
    if (!explicitJoinCursorAndRange) {
        return;
    }
    let [explicitJoinCursor, explicitJoinRange] = explicitJoinCursorAndRange;
    explicitJoinCursor = explicitJoinCursor.toString();
    if (!explicitJoinCursor) {
        return;
    }
    else if (explicitJoinCursor) {
        while ((matchExplicitJoin = explicitJoinRegex.exec(explicitJoinCursor)) !== null) {
            if (matchExplicitJoin[10] === undefined) {
                matchJoin = "";
            }
            else {
                matchJoin = matchExplicitJoin[10].toString();
            }
            const [tableInfo, isPrimaryKeyAbsent, isValidSql, primaryKeyMap, tableAliasMap,] = (await (0, primaryKeyHelper_1.checkExplicitPrimKeys)(loginData, matchExplicitJoin, matchJoin));
            if (isValidSql) {
                replacedCode = explicitJoinCursor
                    .toString()
                    .replace(/((?:\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))(?:\s*\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))*?)/gim, (match) => {
                    let newConditions = [];
                    for (const tableName in primaryKeyMap) {
                        const primaryKeys = primaryKeyMap[tableName];
                        const tableAlias = Array.from(tableAliasMap.entries()).find(([alias, actualTableName]) => actualTableName === tableName.toLocaleLowerCase())?.[0] || tableName;
                        for (const primaryKey of primaryKeys) {
                            const primaryKeyRegex = new RegExp(`\\b${tableAlias}\\b\\s*\\.\\s*\\b${primaryKey}\\b`, "gim");
                            if (!primaryKeyRegex.test(match)) {
                                newConditions.push(`${tableAlias}.${primaryKey} = value`);
                            }
                        }
                    }
                    const currentConditions = match
                        .replace(/^\s*JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+/gi, "")
                        .split(/\s+(?:AND|OR)\s+/);
                    const newConditionsSet = new Set(newConditions);
                    if (newConditions.length > 0 &&
                        !currentConditions.every((cond) => newConditionsSet.has(cond))) {
                        replaceCounter.incrementCounter();
                        return `${match} AND ${newConditions.join(" AND ")}`;
                    }
                    else {
                        return match;
                    }
                });
            }
            const document = editor.document;
            const text = document.getText();
            if (!explicitJoinRange) {
                console.log("No current SQL range available");
                return;
            }
            if (explicitJoinRange.contains(position)) {
                editor.edit((editBuilder) => {
                    editBuilder.replace(explicitJoinRange, replacedCode);
                    currentSqlHover.currentExplicitSql = undefined;
                    currentSqlHover.currentExplicitSqlRange = undefined;
                });
            }
        }
    }
}
exports.sqlExplicitJoinCursorReplacement = sqlExplicitJoinCursorReplacement;
const sqlForLoopReplacement = (currentSqlHover) => {
    const editor = vscode.window.activeTextEditor;
    const position = editor.selection.active;
    if (editor) {
        const documentText = editor.document.getText();
        const selectStarData = forLoopHelper.extractSelectStarQueries(documentText);
        selectStarData.forEach(({ query, variableName }) => {
            const loopBody = forLoopHelper.extractLoopBody(documentText, variableName, query);
            if (!loopBody) {
                console.log(`Couldn't determine loop body for query: ${query}`);
                return;
            }
            const usedColumns = forLoopHelper.findUsedColumns(loopBody, variableName);
            const optimizedQuery = forLoopHelper.replaceSelectStar(query, usedColumns);
            let hoverCursorAndRange = cursor.isCursorOnStarForLoop(position);
            if (!hoverCursorAndRange) {
                return;
            }
            let [hoverCursor, fullLoopRange, selectRange] = hoverCursorAndRange;
            if (fullLoopRange.contains(position)) {
                const document = editor.document;
                const textInRange = document.getText(selectRange);
                if (textInRange.includes(query)) {
                    editor.edit((editBuilder) => {
                        editBuilder.replace(selectRange, optimizedQuery);
                        replaceCounter.incrementCounter();
                        currentSqlHover.currentStarForLoopSql = undefined;
                        currentSqlHover.currentStarForLoopSqlRange = undefined;
                    });
                }
            }
        });
    }
};
exports.sqlForLoopReplacement = sqlForLoopReplacement;
//# sourceMappingURL=codeReplacement.js.map
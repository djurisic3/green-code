"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlStarForLoopHover = exports.sqlExplicitJoinHover = exports.sqlImplicitJoinHover = void 0;
const vscode = require("vscode");
const primKeysHelper = require("./primaryKeyHelper");
const loginManager_1 = require("./loginManager");
class sqlImplicitJoinHover {
    provideHover(document, position, token) {
        let text = document.getText();
        let matches = text.matchAll(/\bSELECT\b\s+((?:(?!SELECT|UPDATE|DELETE|INSERT)[\s\S])*?)\bFROM\b\s+((\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*)\s+(WHERE\s+((\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*(\([^)]*\)|[\s\S]+?))(?:\s*(AND|OR)\s+(\w+(\.\w+)?\s*(!=|=|LIKE|NOT LIKE|IN|NOT IN|>|<|>=|<=|<>|AND|OR|NOT|EXISTS|NOT EXISTS|BETWEEN|NOT BETWEEN|IS NULL|IS NOT NULL)\s*(\([^)]*\)|[\s\S]+?)))*))?(?:\s*;)?[^\S\r\n]*$/gim);
        for (const match of matches) {
            let implicitJoinStart = match.index;
            let implicitJoinEnd = implicitJoinStart + match[0].length;
            let range = new vscode.Range(document.positionAt(implicitJoinStart), document.positionAt(implicitJoinEnd));
            if (range.contains(position)) {
                this.currentImplicitSql = match[0];
                this.currentImplicitSqlRange = range;
                let markdownString = new vscode.MarkdownString(`Press ctrl + space to add primary key columns`);
                markdownString.isTrusted = true;
                return new vscode.Hover(markdownString);
            }
        }
    }
}
exports.sqlImplicitJoinHover = sqlImplicitJoinHover;
class sqlExplicitJoinHover {
    provideHover(document, position, token) {
        let text = document.getText();
        let matches = text.matchAll(/\bSELECT\b\s*(?:(?!\bFROM\b).)*(?:\bFROM\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?(\s*,\s*(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?)*\s+)((?:\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))(?:\s*\b(?:INNER\s+)?JOIN\b\s+(\w+(\.\w+)?)(\s+(AS\s+)?\w+)?\s+\bON\b\s+(((\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+'))(\s*(AND|OR)\s*(\w+(\.\w+)?\s*=\s*(?:\w+(\.\w+)?|'(?:\s|\w)+')))*)))*)(?=\s*;|\s*\))\s*/gim);
        for (const match of matches) {
            if (match.index !== undefined && match.input !== undefined) {
                let implicitJoinStart = match.index;
                let implicitJoinEnd = implicitJoinStart + match[0].length;
                let range = new vscode.Range(document.positionAt(implicitJoinStart), document.positionAt(implicitJoinEnd));
                if (range.contains(position)) {
                    this.currentExplicitSql = match[0];
                    this.currentExplicitSqlRange = range;
                    let matchJoinOn = match[10] === undefined ? "" : match[10].toString();
                    return (0, loginManager_1.getLoginDataPlSql)().then((loginData) => {
                        if (!loginData)
                            return undefined;
                        return primKeysHelper
                            .checkExplicitPrimKeys(loginData, match, matchJoinOn)
                            .then(([tablePrimKeys, isPrimaryKeyAbsentExplicit, isValidExplicitSql,]) => {
                            if (isValidExplicitSql && isPrimaryKeyAbsentExplicit) {
                                let markdownString = new vscode.MarkdownString(`Press ctrl + space to add primary key columns`);
                                markdownString.isTrusted = true;
                                return new vscode.Hover(markdownString);
                            }
                            return undefined;
                        });
                    });
                }
            }
        }
        return undefined;
    }
}
exports.sqlExplicitJoinHover = sqlExplicitJoinHover;
class sqlStarForLoopHover {
    provideHover(document, position, token) {
        let text = document.getText();
        let matches = text.matchAll(/for\s+([a-zA-Z0-9_]+)\s+in\s*\(\s*(select\s+(?:[a-zA-Z0-9_]+\.\*)?\s*\*?\s+from\s+[a-zA-Z0-9_]+)/gim);
        for (const match of matches) {
            let starForLoopStart = match.index;
            let starForLoopEnd = starForLoopStart + match[0].length;
            let range = new vscode.Range(document.positionAt(starForLoopStart), document.positionAt(starForLoopEnd));
            if (range.contains(position)) {
                this.currentStarForLoopSql = match[0];
                this.currentStarForLoopSqlRange = range;
                let markdownString = new vscode.MarkdownString(`Place your text cursor on the for loop and press ctrl + space, to make your code greener.`);
                markdownString.isTrusted = true;
                return new vscode.Hover(markdownString);
            }
        }
    }
}
exports.sqlStarForLoopHover = sqlStarForLoopHover;
//# sourceMappingURL=hoverProvider.js.map
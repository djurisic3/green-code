"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const os = require("os");
const child_process_1 = require("child_process");
const path = require("path");
const promises_1 = require("fs/promises");
const vscode = require("vscode");
const conversions = require("./utils/python/conversions");
const pythonFinder = require("./utils/python/dirtFinder");
const sqlFinder = require("./utils/helper/dirtFinder");
const hover = require("./utils/python/hoverProvider");
const pyCode = require("./utils/python/codeReplacement");
const mysqlCode = require("./utils/mysql/codeReplacement");
const plsqlCode = require("./utils/plsql/codeReplacement");
const fs = require("fs");
const loginManager_1 = require("./utils/plsql/loginManager");
const loginManager_2 = require("./utils/mysql/loginManager");
const hoverProvider_1 = require("./utils/mysql/hoverProvider");
const hoverProvider_2 = require("./utils/plsql/hoverProvider");
const sqlFileSearch = require("./utils/mysql/sqlFileSearch");
const criticalDirt = require("./utils/helper/dirtFinderCritical");
const counter = require("./utils/helper/counter");
const codeLocationStorage_1 = require("./utils/plsql/codeLocationStorage");
const openai_1 = require("openai");
const replaceCounter = require("./utils/helper/replacementCounter");
const queryExec = require("./utils/helper/queryExec");
const util_1 = require("util");
let decorationTypeForLoop;
let decorationTypeCsv;
let decorationTypeSql;
let decorationTypeSqlCritical;
let decorationTypeMiscellaneous;
let activeEditor;
let statusBarMessageMedium;
let statusBarMessageHigh;
let firstCall = 0;
let isUpdateDecorationsSqlRun = false;
function updateStatusBarMessages() {
    const highCount = counter.getCounterCritical();
    const mediumCount = counter.getCounter();
    if (highCount >= 0) {
        statusBarMessageHigh.text = `High Severity: ${highCount} spots need eco-efficient optimization.`;
        statusBarMessageHigh.command = "greencode.navigateToNextHighSeverity";
        statusBarMessageHigh.show();
    }
    if (mediumCount >= 0) {
        statusBarMessageMedium.text = `Medium Severity: ${mediumCount} spots need eco-efficient optimization.`;
        statusBarMessageMedium.command = "greencode.navigateToNextMediumSeverity";
        statusBarMessageMedium.show();
    }
}
function navigateToNextHighSeverity() {
    navigateToNextSeverity("high");
}
function navigateToNextMediumSeverity() {
    navigateToNextSeverity("medium");
}
function navigateToNextSeverity(severity) {
    let locations = (0, codeLocationStorage_1.getLocations)(severity);
    if (locations.length === 0) {
        if (severity === "medium") {
            statusBarMessageMedium.text = `Medium Severity: 0 spots need eco-efficient optimization.`;
            statusBarMessageMedium.show();
        }
        else if (severity === "high") {
            statusBarMessageMedium.text = `High Severity: 0 spots need eco-efficient optimization.`;
            statusBarMessageMedium.show();
        }
        vscode.window.showInformationMessage(`No more ${severity} severity spots to navigate to.`);
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        // Always navigate to the first location in the list
        const nextLocation = locations[0];
        editor.selection = new vscode.Selection(nextLocation.start, nextLocation.end);
        editor.revealRange(nextLocation, vscode.TextEditorRevealType.InCenter);
        // Remove the navigated location from the list
        (0, codeLocationStorage_1.removeLocation)(nextLocation, severity);
        (0, codeLocationStorage_1.addLocation)(nextLocation, severity);
        updateStatusBarMessages();
    }
}
function initialSqlDecorationSetup() {
    if (firstCall === 0) {
        firstCall = +1;
        updateDecorationsSql(true);
    }
    else {
        updateDecorationsSql(false);
    }
}
function updateDecorationsForLoop() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    let decorations = pythonFinder.markForLoopsPy(activeEditor.document);
    activeEditor.setDecorations(decorationTypeForLoop, decorations);
}
function updateDecorationsCsv() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    let decorations = pythonFinder.markCsvPy(activeEditor.document);
    activeEditor.setDecorations(decorationTypeCsv, decorations);
}
function updateDecorationsMiscellaneous() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    let decorations = pythonFinder.markMiscellaneousPy(activeEditor.document);
    activeEditor.setDecorations(decorationTypeMiscellaneous, decorations);
}
async function updateDecorationsSql(firstCall) {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    let titleToShow;
    const selectStarDecoration = criticalDirt.findSelectAsteriskStatements(activeEditor.document);
    activeEditor.setDecorations(decorationTypeSqlCritical, selectStarDecoration);
    if (firstCall) {
        titleToShow = "Fetching and checking primary keys from the database...";
    }
    else {
        titleToShow = "";
    }
    // Start the loading bar
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: titleToShow,
        cancellable: false,
    }, async (progress) => {
        progress.report({ increment: -1 });
        let isLogged = false;
        let decorations = await sqlFinder.markSelectSQL(activeEditor.document, isLogged, loginData);
        if (!isUpdateDecorationsSqlRun) {
            updateStatusBarMessages();
        }
        if (selectStarDecoration || decorations) {
            isUpdateDecorationsSqlRun = true;
        }
        activeEditor.setDecorations(decorationTypeSql, decorations);
        progress.report({ increment: 100 });
        await new Promise((resolve) => setTimeout(resolve, 800)); // Optional delay to ensure the user sees the completion
    });
}
function deactivateDecorationsForLoop() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    activeEditor.setDecorations(decorationTypeForLoop, []);
}
function deactivateDecorationsCsv() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    activeEditor.setDecorations(decorationTypeCsv, []);
}
function deactivateDecorationsMiscellaneous() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    activeEditor.setDecorations(decorationTypeMiscellaneous, []);
}
function deactivateDecorationsSql() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    counter.resetCounter();
    isUpdateDecorationsSqlRun = false;
    activeEditor.setDecorations(decorationTypeSql, []);
}
function deactivateDecorationsSqlCritical() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    counter.resetCounterCritical();
    isUpdateDecorationsSqlRun = false;
    activeEditor.setDecorations(decorationTypeSqlCritical, []);
    activeEditor.setDecorations(decorationTypeSql, []);
}
let serverType;
let loginData;
async function activate(context) {
    let forHoverProvider = new hover.ForLoopHover();
    let csvHoverProvider = new hover.CsvHover();
    let miscHoverProvider = new hover.MiscHover();
    let sqlImplicitHoverProvider = new hoverProvider_1.sqlImplicitJoinHover();
    let sqlExplicitHoverProvider = new hoverProvider_1.sqlExplicitJoinHover();
    let plsqlExplicitHoverProvider = new hoverProvider_2.sqlExplicitJoinHover();
    let plsqlImplicitHoverProvider = new hoverProvider_2.sqlImplicitJoinHover();
    let plsqlStarForLoopHoverProvider = new hoverProvider_2.sqlStarForLoopHover();
    // let disposable = vscode.commands.registerCommand(
    //   "greencode.optimizeSql",
    //   () => {
    //     const editor = vscode.window.activeTextEditor;
    //     if (editor) {
    //       const documentText = editor.document.getText();
    //       const selectStarData =
    //         forLoopHelper.extractSelectStarQueries(documentText);
    //       console.log("FOUND AND REPLACED FOR LOOP WITH SELECT ");
    //       selectStarData.forEach(({ query, variableName }) => {
    //         const loopBody = forLoopHelper.extractLoopBody(
    //           documentText,
    //           variableName,
    //           query
    //         );
    //         if (!loopBody) {
    //           console.log(`Couldn't determine loop body for query: ${query}`);
    //           return;
    //         }
    //         const usedColumns = forLoopHelper.findUsedColumns(
    //           loopBody!,
    //           variableName
    //         );
    //         const optimizedQuery = forLoopHelper.replaceSelectStar(
    //           query,
    //           usedColumns
    //         );
    //         plsqlCode.replaceInEditor(plsqlStarForLoopHoverProvider);
    //         vscode.window.showInformationMessage(
    //           `Original Query: ${query}\nOptimized Query: ${optimizedQuery}`
    //         );
    //       });
    //     }
    //   }
    // );
    // context.subscriptions.push(disposable);
    let disposableAI = vscode.commands.registerCommand("greencode.activateAI", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("No editor is active");
            return;
        }
        const text = editor.document.getText(editor.selection);
        if (!text) {
            vscode.window.showInformationMessage("No text is selected");
            return;
        }
        const queries = splitSqlQueries(text);
        // Limit the processing to the first 3 queries
        const maxQueriesToProcess = 3;
        for (let i = 0; i < Math.min(queries.length, maxQueriesToProcess); i++) {
            const query = queries[i];
            const optimizationSuggestions = await getOptimizationSuggestions(query);
            vscode.window.showInformationMessage(optimizationSuggestions);
        }
    });
    let disposableMeasureKwH = vscode.commands.registerCommand("greencode.measureKWH", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("No editor is active");
            return;
        }
        const text = editor.document.getText(editor.selection);
        if (!text) {
            vscode.window.showInformationMessage("No text is selected");
            return;
        }
        // Assuming `splitSqlQueries` splits the text into individual SQL queries
        // and we're only interested in the first one or the selected one
        const queries = splitSqlQueries(text);
        const combinedQueries = queries.join(";");
        // Define the paths for the Python executable and the script
        // const scriptPath = path.join(__dirname, "kWh_analysis.py")
        const cpuModel = getCurrentCpuModel();
        const filePath = path.join(__dirname, "cpus.csv");
        const wattage = await getCpuWattage(filePath, cpuModel);
        // Adjust the spawn call to pass the query to the Python script
        // const pythonProcess = spawn("python", [
        //   scriptPath,
        //   combinedQueries,
        //   wattage!,
        // ]);
        loginData = await (0, loginManager_1.getLoginDataPlSql)();
        const estimatedKWh = await queryExec.executeSqlQuery(loginData?.connectionString, loginData?.user, loginData?.password, combinedQueries, wattage);
        let stderrContent = "";
        // vscode.window.withProgress(
        //   {
        //     location: vscode.ProgressLocation.Notification,
        //     title: `Analyzing energy consumption for the selected query.`,
        //     cancellable: false,
        //   },
        //   (progress) => {
        //     return new Promise<void>((resolve, reject) => {
        //       pythonProcess.stdout.on("data", (data) => {
        //         // Handle stdout data (e.g., progress updates)
        //         console.log(data.toString());
        //       });
        //       pythonProcess.stderr.on("data", (data) => {
        //         stderrContent += data.toString();
        //       });
        //       pythonProcess.on("close", (code) => {
        //         if (code === 0) {
        //           vscode.window.showInformationMessage(
        //             `Analysis completed successfully.`
        //           );
        //           resolve();
        //         } else {
        //           vscode.window.showErrorMessage(
        //             `Analysis failed. Error code: ${code}`
        //           );
        //           reject(`Process exited with code ${code}`);
        //         }
        //       });
        //     });
        //   }
        // );
    });
    let disposableIF = vscode.commands.registerCommand("greencode.IF", async () => {
        // Define the command to run IF
        const workspaceRoot = __dirname;
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor.");
            return;
        }
        // Assuming the YAML file is in the same directory as extension.ts
        const yamlFilePath = path.join(__dirname, "azure_test_gc.yaml");
        const readFileAsync = (0, util_1.promisify)(fs.readFile);
        const writeFileAsync = (0, util_1.promisify)(fs.writeFile);
        // Read the YAML file content
        try {
            // Use the promisified readFile function
            let data = await readFileAsync(yamlFilePath, 'utf8');
            const newTimestamp = await vscode.window.showInputBox({
                prompt: "Enter new timestamp (e.g., 2024-05-01T00:00:00.000Z) or press Enter to skip.",
                placeHolder: "2024-05-01T00:00:00.000Z",
            });
            if (newTimestamp) {
                data = data.replace(/timestamp: '.*?'/, `timestamp: '${newTimestamp}'`);
            }
            const newDuration = await vscode.window.showInputBox({
                prompt: "Enter new duration in seconds (e.g., 150) or press Enter to skip.",
                placeHolder: "150",
                validateInput: text => {
                    return text === "" || !isNaN(parseInt(text, 10)) ? null : "Please enter a valid number or press Enter to skip.";
                }
            });
            if (newDuration) {
                data = data.replace(/duration: \d+/, `duration: ${newDuration}`);
            }
            // Use the promisified writeFile function
            await writeFileAsync(yamlFilePath, data, 'utf8');
            vscode.window.showInformationMessage('YAML file updated successfully.');
        }
        catch (error) {
            vscode.window.showErrorMessage("An error occurred while updating the YAML file.");
            console.error(error);
            return;
        }
        if (!workspaceRoot) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const manifestPath = path.join(workspaceRoot, "azure_test_gc.yaml");
        const outputPath = path.join(workspaceRoot, "result.yaml");
        const command = `ie --manifest "${manifestPath}" --output "${outputPath}"`;
        console.log(command);
        // Optionally, specify the working directory if necessary for your command
        const options = { cwd: workspaceRoot };
        (0, child_process_1.exec)(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            console.log(`Output: ${stdout}`);
            const regex = /"cpu\/utilization": "([^"]+)"/;
            const matches = regex.exec(stdout);
            if (matches && matches[1]) {
                // matches[1] contains the value found by the regex
                vscode.window.showInformationMessage(`CPU Utilization: ${matches[1]}`);
            }
            else {
                vscode.window.showErrorMessage("CPU Utilization value not found.");
            }
            // Regex to find the first "timestamp" and "duration" in "inputs"
            const inputsRegex = /"inputs": \[\s*{\s*"timestamp": "([^"]+)",\s*"duration": (\d+)/;
            const inputsMatches = inputsRegex.exec(stdout);
            if (inputsMatches && inputsMatches[1] && inputsMatches[2]) {
                const startTime = inputsMatches[1];
                const durationSeconds = inputsMatches[2];
                vscode.window.showInformationMessage(`Start Time: ${startTime}, Duration: ${durationSeconds} seconds`);
            }
            else {
                vscode.window.showErrorMessage("Inputs information not found.");
            }
            // Optionally, show the output in a VSCode message or output panel
            vscode.window.showInformationMessage("IE command executed successfully.");
        });
    });
    context.subscriptions.push(disposableIF);
    let disposableDatabaseEnergyAnalysis = vscode.commands.registerCommand("greencode.analyzeDatabaseEnergy", async () => {
        // Prompt the user for the number of days
        const days = await vscode.window.showInputBox({
            prompt: "Enter the number of days in the past to analyze",
            placeHolder: "e.g., 7",
        });
        if (!days) {
            vscode.window.showErrorMessage("You must enter a number of days.");
            return;
        }
        // let stderrContent = "";
        // //const pythonProcess = spawn("python", [scriptPath, days]);
        // let totalCount = 0; // Total number of operations to perform
        // let currentCount = 0; // Current number of operations performed
        // let lastReportedPercentage = 0; // Last reported percentage
        // vscode.window.withProgress(
        //   {
        //     location: vscode.ProgressLocation.Notification,
        //     title: `Analyzing energy consumption of 'SELECT *' executions in last ${days} days.`,
        //     cancellable: false,
        //   },
        //   (progress) => {
        //     return new Promise<void>((resolve, reject) => {
        //       pythonProcess.stdout.on("data", (data) => {
        //         const lines = data.toString().trim().split("\n");
        //         lines.forEach((line: string) => {
        //           if (line.startsWith("TOTAL_COUNT")) {
        //             totalCount = parseInt(line.split(" ")[1], 10);
        //           } else if (line.startsWith("PROGRESS:")) {
        //             currentCount++;
        //             if (totalCount > 0) {
        //               const percentage = (currentCount / totalCount) * 100;
        //               const increment = percentage - lastReportedPercentage;
        //               progress.report({ increment });
        //               lastReportedPercentage = percentage;
        //             }
        //           }
        //         });
        //       });
        //       pythonProcess.stderr.on("data", (data) => {
        //         stderrContent += data.toString();
        //         // Parse the last four lines of the output
        //       });
        //       pythonProcess.on("close", (code) => {
        //         const lines = stderrContent.trim().split("\n");
        //         // Check if the last line contains 'Done!'
        //         if (
        //           lines.length > 1 &&
        //           lines[lines.length - 1].includes("Done!")
        //         ) {
        //           // Regular expression to match the kWh value (e.g., "0.000007 kWh")
        //           const energyRegex = /(\d+\.\d+)\s+kWh/;
        //           let energyConsumption = "";
        //           // Search for the kWh value in the last two lines
        //           const lastTwoLines = lines.slice(-2).join("\n");
        //           const match = energyRegex.exec(lastTwoLines);
        //           if (match) {
        //             energyConsumption = match[1]; // Capture the kWh value
        //           }
        //           // Display an information message in VS Code with the energy consumption value
        //           if (energyConsumption) {
        //             vscode.window.showInformationMessage(
        //               `Energy Consumption: ${energyConsumption} kWh`
        //             );
        //           } else {
        //             console.log("Energy consumption value not found.");
        //           }
        //         } else {
        //           // Optionally handle the case when 'Done!' is not found
        //           console.log("The script did not complete as expected.");
        //         }
        //         if (code === 0) {
        //           resolve();
        //         } else {
        //           reject(`Process exited with code ${code}`);
        //         }
        //       });
        //     });
        //   }
        // );
        // const command = `${pythonPath} ${scriptPath}`;
        // vscode.window.withProgress(
        //   {
        //     location: vscode.ProgressLocation.Notification,
        //     title: "Analyzing Energy Baseline",
        //     cancellable: false,
        //   },
        //   (progress) => {
        //     return new Promise<void>((resolve, reject) => {
        //       let totalCount = 0;
        //       let current = 0;
        //       child.exec(command, (err, stdout, stderr) => {
        //         if (err) {
        //           console.error("Error:", err);
        //           reject(err);
        //           return;
        //         }
        //         // Parse stdout for progress updates
        //         const lines = stdout.trim().split("\n");
        //         lines.forEach((line) => {
        //           if (line.startsWith("TOTAL_COUNT")) {
        //             totalCount = parseInt(line.split(" ")[1], 10);
        //           } else if (line.startsWith("PROGRESS:")) {
        //             const parts = line.split(" ");
        //             const progressInfo = parts[1]; // e.g., "1/100"
        //             current = progressInfo.split("/").map(Number)[0];
        //             // Update the progress bar
        //             if (totalCount > 0) {
        //               const percentage = (current / totalCount) * 100;
        //               progress.report({ increment: percentage });
        //             }
        //           }
        //         });
        //         if (stderr) {
        //           // Parse the last four lines of the output
        //           const lines = stderr.trim().split("\n");
        //           // Check if the last line contains 'Done!'
        //           if (
        //             lines.length > 1 &&
        //             lines[lines.length - 1].includes("Done!")
        //           ) {
        //             // Regular expression to match the kWh value (e.g., "0.000007 kWh")
        //             const energyRegex = /(\d+\.\d+)\s+kWh/;
        //             let energyConsumption = "";
        //             // Search for the kWh value in the last two lines
        //             const lastTwoLines = lines.slice(-2).join("\n");
        //             const match = energyRegex.exec(lastTwoLines);
        //             if (match) {
        //               energyConsumption = match[1]; // Capture the kWh value
        //             }
        //             // Display an information message in VS Code with the energy consumption value
        //             if (energyConsumption) {
        //               vscode.window.showInformationMessage(
        //                 `Energy Consumption: ${energyConsumption} kWh`
        //               );
        //             } else {
        //               console.log("Energy consumption value not found.");
        //             }
        //           } else {
        //             // Optionally handle the case when 'Done!' is not found
        //             console.log("The script did not complete as expected.");
        //           }
        //           return;
        //         }
        //         console.log("Energy Consumption Analysis Results:", stdout);
        //         resolve();
        //       });
        //     });
        //   }
        // );
    });
    function splitSqlQueries(text) {
        // Basic splitting logic, can be enhanced for more complex SQL scripts
        return text
            .split(";")
            .map((query) => query.trim())
            .filter((query) => query.length > 0);
    }
    async function getOptimizationSuggestions(sqlQuery) {
        // Initialize OpenAI API
        const openAIConfiguration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new openai_1.OpenAIApi(openAIConfiguration);
        try {
            const prompt = `Given the SQL query: \n\n${sqlQuery}\n\nProvide optimization suggestions as code, focusing on green coding practices, without repeating the original query:`;
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                max_tokens: 150,
            });
            return (response.data.choices[0]?.text.trim() || "No suggestions available.");
        }
        catch (error) {
            console.error("Error while fetching suggestions from OpenAI:", error);
            return "An error occurred while fetching suggestions.";
        }
    }
    context.subscriptions.push(disposableAI);
    context.subscriptions.push(disposableMeasureKwH);
    context.subscriptions.push(disposableDatabaseEnergyAnalysis);
    statusBarMessageHigh = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarMessageMedium = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(vscode.commands.registerCommand("greencode.navigateToNextHighSeverity", navigateToNextHighSeverity));
    context.subscriptions.push(vscode.commands.registerCommand("greencode.navigateToNextMediumSeverity", navigateToNextMediumSeverity));
    context.subscriptions.push(statusBarMessageHigh, statusBarMessageMedium);
    const disposableFindAllQueries = vscode.commands.registerCommand("greencode.findSqlQueries", async () => {
        const options = {
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select Folder",
        };
        const folderUris = await vscode.window.showOpenDialog(options);
        if (folderUris && folderUris.length > 0) {
            const folderUri = folderUris[0];
            const searchRecursively = await vscode.window.showQuickPick(["Yes", "No"], {
                placeHolder: "Search for SQL queries recursively in all subfolders?",
            });
            const connectDB = await vscode.window.showQuickPick(["Yes", "No"], {
                placeHolder: "Connect to database (for detailed analysis)?",
            });
            if (searchRecursively && connectDB) {
                const results = await sqlFileSearch.searchFiles(folderUri, searchRecursively === "Yes", connectDB === "Yes");
                if (results) {
                    sqlFileSearch.showRecommendations(results.tableAndAlias, results.tablesAndColumns, results.readWriteCount, results.columnOccurrences, context);
                }
            }
        }
    });
    activeEditor = vscode.window.activeTextEditor;
    // Enhanced normalization to focus on distinctive parts of the CPU model
    function extractDistinctiveParts(cpuModel) {
        // Convert to uppercase to ensure case-insensitive matching
        let normalizedModel = cpuModel.toUpperCase();
        // Remove common but non-distinctive parts
        normalizedModel = normalizedModel.replace(/(INTEL\(R\)\s+CORE\(TM\)\s+|AMD\s+|CPU\s+|@\s+\d+\.\d+GHZ)/g, "");
        // Extract alphanumeric parts (e.g., "I7-8750H", "RYZEN5")
        const parts = normalizedModel.match(/[A-Z0-9]+-?[A-Z0-9]*/g) || [];
        return parts.filter(Boolean);
    }
    // Matching function to compare CPU model parts against entries in the CSV
    async function getCpuWattage(filePath, cpuModel) {
        try {
            const data = await (0, promises_1.readFile)(filePath, { encoding: "utf-8" });
            const lines = data.split("\n");
            const queryParts = extractDistinctiveParts(cpuModel);
            for (const line of lines) {
                const [model, wattage] = line.split(",");
                const csvModelParts = extractDistinctiveParts(model);
                // Check for significant overlap in extracted parts between query and CSV entry
                if (queryParts.some((part) => csvModelParts.includes(part))) {
                    return wattage.trim(); // Return the first matching wattage
                }
            }
            return undefined; // Return undefined if no matching model is found
        }
        catch (error) {
            console.error("Error reading the file:", error);
            return undefined;
        }
    }
    // Function to get the current CPU model using the `os` module
    function getCurrentCpuModel() {
        const cpus = os.cpus();
        return cpus.length > 0 ? cpus[0].model : "";
    }
    // Main function to find and log the wattage of the current CPU model
    async function findCurrentCpuWattage() {
        const cpuModel = getCurrentCpuModel();
        const filePath = path.join(__dirname, "cpus.csv");
        const wattage = await getCpuWattage(filePath, cpuModel);
        if (wattage) {
            return wattage;
        }
        else {
        }
    }
    if (activeEditor?.document.languageId.includes("sql")) {
        serverType = await vscode.window.showQuickPick(["Oracle (PL/SQL)", "MySQL"], {
            placeHolder: "Choose the server type:",
        });
        if (!serverType) {
            await vscode.window
                .showErrorMessage("Missing server type. Extension activation aborted. Please reload to retry.", "Reload Window")
                .then((selection) => {
                if (selection === "Reload Window") {
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
                }
            });
            return;
        }
        if (serverType === "Oracle (PL/SQL)") {
            context.subscriptions.push(vscode.languages.registerHoverProvider("sql", plsqlExplicitHoverProvider));
            context.subscriptions.push(vscode.languages.registerHoverProvider("sql", plsqlImplicitHoverProvider));
            context.subscriptions.push(vscode.languages.registerHoverProvider("sql", plsqlStarForLoopHoverProvider));
            loginData = await (0, loginManager_1.getLoginDataPlSql)();
            if (!loginData || loginData === undefined) {
                await vscode.window
                    .showErrorMessage("Missing login data. Extension activation aborted. Please reload to retry.", "Reload Window")
                    .then((selection) => {
                    if (selection === "Reload Window") {
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    }
                });
                context.subscriptions.push(vscode.languages.registerHoverProvider("sql", plsqlExplicitHoverProvider));
                return;
            }
        }
        else if (serverType === "MySQL") {
            context.subscriptions.push(vscode.languages.registerHoverProvider("sql", sqlImplicitHoverProvider));
            context.subscriptions.push(vscode.languages.registerHoverProvider("sql", sqlExplicitHoverProvider));
            loginData = await (0, loginManager_2.getLoginDataMySql)();
            if (!loginData || loginData === undefined) {
                await vscode.window
                    .showErrorMessage("Missing login data. Extension activation aborted. Please reload to retry.", "Reload Window")
                    .then((selection) => {
                    if (selection === "Reload Window") {
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    }
                });
                return;
            }
        }
    }
    context.subscriptions.push(disposableFindAllQueries);
    context.subscriptions.push(vscode.languages.registerHoverProvider("python", forHoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider("python", csvHoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider("python", miscHoverProvider));
    let disposableCleanCompleteCode = vscode.commands.registerCommand("greencode.cleanCompleteCode", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        let text = document.getText();
        let listComprehension;
        listComprehension = conversions.convertAllPy(text);
        editor.edit((editBuilder) => {
            let fullRange = editor.document.validateRange(new vscode.Range(0, 0, document.lineCount, document.lineAt(document.lineCount - 1).text.length));
            editBuilder.replace(fullRange, listComprehension);
        });
    });
    let disposableCleanMarkedCode = vscode.commands.registerCommand("greencode.cleanMarkedCode", () => {
        replaceCounter.resetCounter();
        if (!serverType && activeEditor?.document.languageId.includes("sql")) {
            vscode.window.showErrorMessage("Server type is not defined yet. Please wait a moment and try again.");
            return;
        }
        console.log("Server type: " + serverType);
        plsqlImplicitHoverProvider.currentImplicitSql = undefined;
        plsqlExplicitHoverProvider.currentExplicitSql = undefined;
        if (forHoverProvider.currentForLoop !== undefined) {
            pyCode.forHoverReplacement(forHoverProvider);
        }
        else if (csvHoverProvider.currentCsv !== undefined) {
            pyCode.csvHoverReplacement(csvHoverProvider);
        }
        else if (miscHoverProvider.currentMisc !== undefined) {
            pyCode.miscellaneousReplacement(miscHoverProvider);
        }
        else if (sqlImplicitHoverProvider.currentImplicitSql !== undefined &&
            serverType === "MySQL") {
            mysqlCode.sqlImplicitJoinHoverReplacement(sqlImplicitHoverProvider);
        }
        else if (sqlExplicitHoverProvider.currentExplicitSql !== undefined &&
            serverType === "MySQL") {
            mysqlCode.sqlExplicitJoinHoverReplacement(sqlExplicitHoverProvider);
        }
        else if (plsqlImplicitHoverProvider.currentImplicitSql !== undefined &&
            serverType === "Oracle (PL/SQL)") {
            plsqlCode.sqlImplicitJoinHoverReplacement(plsqlImplicitHoverProvider);
        }
        else if (plsqlStarForLoopHoverProvider.currentStarForLoopSql !== undefined &&
            serverType === "Oracle (PL/SQL)") {
            plsqlCode.sqlForLoopReplacement(plsqlStarForLoopHoverProvider);
            console.log("for loop hover");
        }
        else if (plsqlExplicitHoverProvider.currentExplicitSql !== undefined &&
            serverType === "Oracle (PL/SQL)") {
            plsqlCode.sqlExplicitJoinHoverReplacement(plsqlExplicitHoverProvider);
        }
        else {
            pyCode.csvCursorReplacement(csvHoverProvider);
            pyCode.forCursorReplacement(forHoverProvider);
            pyCode.miscellaneousReplacement(miscHoverProvider);
            if (serverType === "MySQL") {
                mysqlCode.sqlImplicitJoinCursorReplacement(sqlImplicitHoverProvider);
                mysqlCode.sqlExplicitJoinCursorReplacement(sqlExplicitHoverProvider);
            }
            else if (serverType === "Oracle (PL/SQL)") {
                plsqlCode.sqlForLoopReplacement(plsqlStarForLoopHoverProvider);
                if (replaceCounter.getCounter() === 0) {
                    plsqlCode.sqlExplicitJoinCursorReplacement(sqlExplicitHoverProvider);
                }
                if (replaceCounter.getCounter() === 0) {
                    plsqlCode.sqlImplicitJoinCursorReplacement(sqlImplicitHoverProvider);
                }
            }
        }
    });
    decorationTypeForLoop = vscode.window.createTextEditorDecorationType({
        textDecoration: "underline dashed orange",
    });
    context.subscriptions.push(decorationTypeForLoop);
    decorationTypeSql = vscode.window.createTextEditorDecorationType({
        textDecoration: "underline dashed orange",
    });
    context.subscriptions.push(decorationTypeSql);
    decorationTypeSqlCritical = vscode.window.createTextEditorDecorationType({
        textDecoration: "underline dashed red",
    });
    context.subscriptions.push(decorationTypeSqlCritical);
    decorationTypeCsv = vscode.window.createTextEditorDecorationType({
        textDecoration: "underline wavy orange",
    });
    context.subscriptions.push(decorationTypeCsv);
    decorationTypeMiscellaneous = vscode.window.createTextEditorDecorationType({
        textDecoration: "underline dashed red",
    });
    context.subscriptions.push(decorationTypeMiscellaneous);
    let disposableMarkDirtyCode = vscode.commands.registerCommand("greencode.markDirtyCode", () => {
        if ((!serverType || !loginData) &&
            activeEditor?.document.languageId.includes("sql")) {
            vscode.window.showErrorMessage("Missing server type or login data. Please provide this information and try again.");
        }
        else {
            firstCall = 0;
            initialSqlDecorationSetup();
        }
        updateDecorationsForLoop();
        //  updateDecorationsCsv(),
        //  updateDecorationsMiscellaneous();
    });
    context.subscriptions.push(disposableMarkDirtyCode);
    let disposableDeactivateMarkDirtyCode = vscode.commands.registerCommand("greencode.deactivateMarkDirtyCode", () => {
        deactivateDecorationsForLoop(),
            deactivateDecorationsCsv(),
            deactivateDecorationsMiscellaneous(),
            deactivateDecorationsSql();
        deactivateDecorationsSqlCritical();
    });
    // context.subscriptions.push(disposableMarkDirtyCode);
    context.subscriptions.push(disposableDeactivateMarkDirtyCode);
    context.subscriptions.push(disposableCleanMarkedCode);
    context.subscriptions.push(disposableCleanCompleteCode);
    // context.subscriptions.push(
    //   vscode.window.onDidChangeActiveTextEditor((editor) => {
    //     activeEditor = editor;
    //     if (editor) {
    //       updateDecorationsForLoop();
    //     }
    //   }),
    //   vscode.workspace.onDidChangeTextDocument((event) => {
    //     if (activeEditor && event.document === activeEditor.document) {
    //       updateDecorationsForLoop();
    //     }
    //   })
    // );
    // context.subscriptions.push(
    //   vscode.window.onDidChangeActiveTextEditor((editor) => {
    //     activeEditor = editor;
    //     if (editor) {
    //       updateDecorationsCsv();
    //     }
    //   }),
    //   vscode.workspace.onDidChangeTextDocument((event) => {
    //     if (activeEditor && event.document === activeEditor.document) {
    //       updateDecorationsCsv();
    //     }
    //   })
    // );
    let timeout;
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;
        if (editor) {
            deactivateDecorationsSql();
            deactivateDecorationsSqlCritical();
            counter.resetCounter();
            counter.resetCounterCritical();
            initialSqlDecorationSetup();
        }
    }), vscode.workspace.onDidChangeTextDocument((event) => {
        if (activeEditor &&
            event.document === activeEditor.document &&
            isUpdateDecorationsSqlRun) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                initialSqlDecorationSetup();
            }, 650);
            counter.resetCounter();
            counter.resetCounterCritical();
        }
    }));
    // context.subscriptions.push(
    //   vscode.window.onDidChangeActiveTextEditor((editor) => {
    //     activeEditor = editor;
    //     if (editor) {
    //       updateDecorationsMiscellaneous();
    //     }
    //   }),
    //   vscode.workspace.onDidChangeTextDocument((event) => {
    //     if (activeEditor && event.document === activeEditor.document) {
    //       updateDecorationsMiscellaneous();
    //     }
    //   })
    // );
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map
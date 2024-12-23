# GreenCode - Visual Studio Code Extension

GreenCode is a powerful Visual Studio Code extension that enhances your coding efficiency and promotes eco-friendly programming practices. It provides real-time insights into your code, highlighting opportunities for optimization and helping you write cleaner, more efficient code. Embrace cleaner coding practices that not only boost performance but also contribute to a greener planet.

## Features

- **Efficient Code Analysis**: Scans SQL queries and other code sections for optimization opportunities.
- **Severity Indicators**: Highlights code with potential issues using color-coded severity levels.
  - **High Severity (Red)**: Immediate replacement opportunities without functional compromise.
  - **Medium Severity (Yellow)**: Suggested optimizations that might require careful consideration.
- **One-Time Information Messages**: Displays the number of high and medium severity issues upon activation, and also upon deactivation and reactivation.
- **SQL File Support**: When working with SQL files, prompts for login data for database-specific analysis.

## Version 0.2.1 - Impact Framework Azure Analysis
The latest update to GreenCode introduces a groundbreaking integration with the Impact Framework (IF), specifically designed to empower developers with real-time insights into the energy efficiency of their software. This integration leverages IF's Azure plugin to provide detailed CPU utilization metrics directly within the Visual Studio Code environment.

## Key Features

- **Real-Time Energy Efficiency Insights**: Directly see how your code affects energy consumption through IF's detailed CPU utilization data.
- **Seamless Integration**: Experience a smooth, non-intrusive addition to your existing development workflow, enhancing productivity and sustainability focus.

## How It Works

1. **Setup**: Make sure to use your Azure credentials in the GreenCode\out folder in the azure_test_gc.yaml as well as .env file
1. **Analysis**: Initiate an IF Observation directly from GreenCode (GreenCode: Run IF and display results command).
2. **Data Collection**: GreenCode, via the IF Azure plugin, collects real-time CPU utilization data.
3. **Insights & Actions**: View actionable insights and apply suggested optimizations to improve energy efficiency.

## Version 0.2.0 - Energy Consumption Analysis

### Analyzing kWh Consumed by SQL Queries

GreenCode v0.2.0 introduces a groundbreaking functionality: the ability to estimate the energy consumption (in kWh) of SQL queries. This feature is designed to work exclusively with SQL queries, providing developers with a rough estimate of the energy consumed by these queries based on the CPU wattage of the system where the SQL is executed.

#### Key Features:
- **Energy Consumption Estimation**: Offers a rough estimate of the kWh consumed by SQL queries marked in the code.
- **CPU Wattage-Based Calculations**: The estimation is based solely on the CPU wattage of the system executing the SQL query, not the server's CPU.
- **Manual Activation**: To analyze a query, the user must mark the SQL code and press `Ctrl+Alt+A`. This activation method ensures that energy consumption analysis is performed intentionally on selected queries.
- **Eco-Friendly SQL Development**: Encourages developers to consider the energy impact of their SQL queries, promoting more eco-conscious programming practices.

#### Usage:
To utilize this new feature, simply mark the SQL query in your code and press `Ctrl+Alt+A`. The extension then estimates the energy consumption of the marked query, aiding in the identification of potentially energy-inefficient code areas and encouraging optimizations for reduced energy usage.

Note: The kWh consumption estimate is a rough approximation and should be used as a guideline for potential energy efficiency improvements.

## Version 0.1.9 - Enhanced PL/SQL Loop Analysis

### Intuitive Column Substitution in PL/SQL Loops

GreenCode v0.1.9 introduces a significant enhancement for PL/SQL developers: the ability to automatically recognize and substitute columns used in loop bodies. This feature is particularly beneficial in scenarios involving PL/SQL loops, like `for i in (select * from table) loop...`.

Now, when you hover over the `select *` portion of such a loop and press `Ctrl+Space`, GreenCode intelligently identifies and substitutes the columns actually being used within the loop. This refined approach not only enhances the readability of your PL/SQL loops but also optimizes performance by ensuring only necessary columns are selected.

#### Usage Scenario

- Place the cursor over the `select *` in a PL/SQL loop.
- Press `Ctrl+Space` to trigger GreenCode's intelligent column substitution.
- The extension automatically replaces `select *` with specific column names used in the loop body.

This feature streamlines the process of optimizing PL/SQL loops, making your code more efficient and easier to maintain.


## Version 0.1.8 - Indeterminate Loading Bar Integration

### Indeterminate Loading Bar for Long-Running Processes

GreenCode v0.1.8 introduces an indeterminate loading bar feature, enhancing user experience during long-running SQL analysis operations.

#### Implementation Details
- The loading bar is integrated into the SQL analysis functionality.
- It appears at the start of the SQL processing and remains active throughout the operation.
- Upon completion of the analysis, the loading bar is marked complete and then closes after a short delay.

#### User Experience
- Users are now presented with a clear visual indication of ongoing processes, improving the perception of responsiveness.

This enhancement aims to provide a smoother, more intuitive interaction with GreenCode's analysis features, especially during extended operations.


## Version 0.1.2 - AI Integration and Setup

### AI-Driven Code Optimization

GreenCode v0.1.2 introduces an advanced AI-driven feature for enhanced analysis and optimization of SQL queries. Leveraging the latest in artificial intelligence, GreenCode now offers deeper and more nuanced suggestions to improve your SQL queries, aligning them with green coding practices.

### Setting Up Your Environment for AI Features

To utilize the AI-powered features, you need to provide your own OpenAI API key. This ensures the security and effective operation of the AI integration. Follow these steps to set up:

1. **Obtain an API Key**: Register at [OpenAI](https://openai.com/) and obtain an API key.

2. **Configure an Environment Variable**:
   - **Windows**:
     1. Search for "Edit the system environment variables" and open it.
     2. Click "Environment Variables".
     3. Under "System variables", click "New...".
     4. Enter `OPENAI_API_KEY` as the variable name and your OpenAI API key as the value.
     5. Restart your system or log out and in for the changes to take effect.
   - **macOS/Linux**:
     1. Open your terminal.
     2. Edit your shell profile (e.g., `~/.bashrc` or `~/.zshrc`) and add: `export OPENAI_API_KEY='your_api_key_here'`.
     3. Save the file and apply changes with `source ~/.bashrc` (or the respective file for your shell).

3. **Restart Visual Studio Code** to recognize the new environment variable.

### Cautionary Note on AI Suggestions

While the AI-driven suggestions can significantly enhance code optimization, they should be used with caution:

- **Not All Suggestions Are Directly Applicable**: The AI model provides suggestions based on general best practices and patterns. However, not all recommendations may be directly applicable to your specific code context or database schema.
- **Manual Review is Crucial**: Always review and test the AI's suggestions before implementing them in your code. Ensure they align with your project's requirements and do not introduce any unintended side effects.
- **Iterative Refinement**: Use the AI suggestions as a starting point for further refinement and optimization tailored to your specific use case.

By following these guidelines, you can effectively leverage the AI integration in GreenCode to improve your SQL queries while maintaining code integrity and performance.

## Version 0.1.1 - New Features and Improvements

### Enhanced Detection of Cartesian Products

GreenCode v0.1.1 introduces advanced capabilities to recursively search for Cartesian products within SQL queries. This improvement enables a more thorough and in-depth analysis of complex SQL statements, ensuring that even nested queries are scrutinized for potential optimizations.

### Improved Identification of Inefficient Patterns

The extension now features enhanced detection of inefficient patterns, such as `LIKE` and `NOT LIKE` operators. The analysis includes a broader range of operators between values, providing a more comprehensive assessment of potential performance issues.

### Updated Message Bar for Document Changes

With the new version, the message bar dynamically updates the count of high and medium severity issues whenever there is a change in the active document. This feature ensures that developers are always informed of the current state of their code, making it easier to track and address issues as they edit.

### Interactive Severity Navigation

GreenCode offers an enhanced interactive experience with its severity navigation feature, significantly improving the way developers interact with the identified issues in their code.

#### Status Bar Integration

- The extension displays the count of high and medium severity issues separately in the status bar.
- Each count is interactive and clickable, allowing developers to swiftly navigate through the issues of the respective severity.

#### Looped Navigation

- Once you reach the end of the list of issues in a specific severity, the navigation loops back to the first issue.
- This ensures a continuous and seamless review cycle, enabling developers to address all issues without manual resetting.

#### Dynamic Issue Count

- As you navigate through and address these issues, GreenCode dynamically updates the count of high and medium severity spots.
- This provides real-time feedback on your progress towards optimizing your code, making the process more efficient and effective.


### Version 0.1.0 - New Features

#### Interactive Severity Navigation

GreenCode now offers an enhanced interactive experience with its severity navigation feature. This feature significantly improves the way developers interact with the identified issues in their code.

##### Status Bar Integration

- The extension displays the count of high and medium severity issues separately in the status bar.
- Each count is interactive and clickable, allowing developers to swiftly navigate through the issues of the respective severity.

##### Looped Navigation

- Once you reach the end of the list of issues in a specific severity, the navigation loops back to the first issue.
- This ensures a continuous and seamless review cycle, enabling developers to address all issues without manual resetting.

##### Dynamic Issue Count

- As you navigate through and address these issues, GreenCode dynamically updates the count of high and medium severity spots.
- This provides real-time feedback on your progress towards optimizing your code, making the process more efficient and effective.

These enhancements are designed to streamline the optimization process, making it more efficient and user-friendly. By focusing on high-impact changes first and then addressing medium severity issues, developers can systematically improve their code’s performance and contribute to more sustainable software development practices.


## Extension Commands

GreenCode introduces several commands with convenient keybindings:

- `greencode.markDirtyCode`: Activates the extension. Keybinding: `Shift + Ctrl + Alt + F`
- `greencode.deactivateMarkDirtyCode`: Deactivates the extension. Keybinding: `Shift + Ctrl + Alt + D`
- `greencode.cleanMarkedCode`: Replaces identified issues with optimized code. Keybinding (works currently only for medium severity spots): `Ctrl + Space`
- `greencode.activateAI`: Activates the AI analysis on marked code. Keybinding: Ctrl + Alt + I (only active when code is marked for analysis)

## Getting Started

1. **Install** the extension from the Visual Studio Code Marketplace.
2. **Activate** GreenCode using `Shift + Ctrl + Alt + F`.
3. For **SQL files**, enter your login details as prompted.
4. **Review** the highlighted issues and consider the suggested optimizations.
5. **Deactivate** the extension with `Shift + Ctrl + Alt + D` if needed.
6. **Apply** optimizations to enhance your code's efficiency and eco-friendliness.

## Contributing

Your contributions to improve GreenCode are highly appreciated. Whether it's bug reporting, feature suggestion, or code contribution, feel free to open an issue or submit a pull request on our GitHub repository.

## License

GreenCode is made available under the [MIT License](https://github.com/djurisic3/GreenCode/blob/HEAD/LICENSE).

## About

GreenCode is developed with the aim of helping programmers write more efficient and environmentally responsible code, contributing to a greener and more sustainable future in software development.

---

For more information, visit [our GitHub repository](https://github.com/your-github-username/greencode).

## 0.50.0
* add some details to completion items
* use DAP 1.55.1

## 0.49.6
* support all `output` event categories: `prio(xxx)`, `out(xxx)`, or `err(xxx)` (in addition to `log(xxx)`)
* returns the `lazy` property on the `VariablePresentationHint` if a variable name contains the word "lazy"; the value placeholder for lazy variables is `lazy var`.

## 0.48.1
* publish new release under Microsoft publisher
* improved read/write memory behavior, invaldiate memory and variables on change

## 0.47.2
* another "pre-release" version of Mock Debug (for testing the pre-release feature)

## 0.47.1
* first "pre-release" version of Mock Debug: pre-release versions use odd minor version numbers
* use a pre-release version of the DAP modules

## 0.46.11
* preparing to publish "pre-release" version of Mock Debug

## 0.46.10
* enable NamedPipe support; fixes #47
* sort Run before Debug command; fixes #58
* improve comments; fixes #60

## 0.46.9
* switch from webpack 5 to esbuild

## 0.46.9
* upgrade from webpack 4 to webpack 5

## 0.46.8
* update dependencies

## 0.46.7
* Add line and source information to disassemble instructions.

## 0.46.6
* Simplify "no-debug" mode (in order to profit from https://github.com/microsoft/vscode/issues/129255)

## 0.46.4
* Generate errors for illegal arguments to `setExpression` request.
* Specify 'compileError' in launch config to simulate a compile/build error in the "launch" request.

## 0.46.2
* Implement `setExpression` request. This enables a "Set Value" context menu action on watches.

## 0.46.1
* Improved overall stepping behavior: mock debug now behaves like a real debugger: it breaks on a line before executing the line. Previously it was breaking while executing the line.

## 0.46.0
* Rewrite Variables; see Readme.md in sampleWorkspace
* Add support for Disassembly View, Instruction Stepping, and Instruction Breakpoints. Instruction breakpoints can be set in the Disassembly view.

## 0.45.8
* Register Mock Debug as default debugger for markdown files

## 0.45.7
* Add support for data breakpoint access types (a big _Thank You_ to @yannickowow for the PR)

## 0.45.6
* Add support for a custom inline value provider that matches variables in a case-insensitive way.
* Group "run" and "debug" editor commands in the new "run" submenu

## 0.45.5
* Provide help texts for exception filters via DAP's new `description` and `conditionDescription`properties.

## 0.45.4
* Add support for the `exceptionInfo` request.

## 0.45.3
* Add support for exception filters (and conditions). "Named Exception" will break on the `exception(xxx)` pattern if the exception condition is set to `xxx`. "Other Exceptions" will break on the word `exception` and the `exception(...)` patterns not matched by "Named Exception".

## 0.44.0
* Emit "Invalidated" event if client supports it.
* Changed context menu action "Show as Hex" to "Toggle between decimal and heximal formatting"

## 0.43.0
* Add context menu action "Show as Hex" to integer variables in Variables view
* Add new run option "namedPipeServer" for debug adapter in extension.ts
* Use new extension API for passing the "noDebug" option to "vscode.debug.startDebugging"
* Support to run Mock Debug in the browser/web worker

## 0.42.2
* Project hygiene: get rid of all warnings
* use eslint instead of tslint
* align with latest yeoman generator for VS Code

## 0.42.1
* Add "run" and "debug" actions to editor title
* Implement "Run without debugging"

## 0.41.0
* Add support for StepIn and StepOut: StepIn moves execution one character to the right, StepIn to the left
* Add support for StepInTargets: every word in the stopped line is considered one stack frame; StepInTargets returns targets for every character of the stack frame with the given frameId.

## 0.40.0
* Exercise new dynamic debug config API.

## 0.39.0
* Exercise progress events: typing "progress" in the REPL starts a sequence of (cancellable) progress events if the clients supports this via the `supportsProgressReporting` client capability.
* Exersise new completion item attributes `selectionStart` and `selectionLength`: "array[]" moves cursor between the brackets and "func(arg)" selects "arg".

## 0.38.0
* Exercise the new group feature of output events: 'log(start)' or 'log(startCollapsed)' starts a group, 'log(end)' ends a group.

## 0.37.0
* Add a simple vscode.EvaluatableExpressionProvider to show how to control what gets shown in a debug hover.

## 0.36.0
* Extend the run mode by an 'inline' run mode (in addition to 'external' and 'server').

## 0.35.0
* Support the 'breakpointLocations' request.
* Make 'variables' request cancelable.

## 0.34.0
* Add support for persisted data breakpoints.

## 0.33.0
* Add support for (sorted) REPL completions.

## 0.32.0
* Add support for data breakpoints.

## 0.31.0
* Added code to show how to control what debug executable is used.

## 0.30.0
* Updated dependencies.

## 0.29.0
* Move off proposed API for the EMBED_DEBUG_ADAPTER mode: embedded debug adapter now uses vscode.DebugAdapterDescriptorFactory.

## 0.28.0
* Update dependencies.

## 0.27.0
* Update dependencies.

## 0.26.0
* Improved the launch configuration snippet and added a `"stopOnEntry": true`.

## 0.25.0
* Added the `"multi-root ready"` keyword.

## 0.24.0
* Add support for starting a debug session without a launch configuration.
* Require 1.17 version of VS Code.

## 0.23.0
* Added supported for creating and deleting breakpoints from the REPL. Use `new 123` to create a breakpoint in line 123, and `del 123` to delete it.
* Use 1.24.0 version of Debug Adapter Protocol and libraries.

## 0.22.0
* Refactored the 'Mock Debugger' functionality into a separate class. This makes it more obvious how a debug adapter 'adapts' to a debugger or runtime.

## 0.21.0
* Shows the source location of log output. A `log(any text)` in the input sends the text in parenthesis to the debug console.

## 0.20.0
* Use 1.23.0 version of Debug Adapter Protocol and libraries.

## 0.19.0
* Add tslint
* Use 1.19.0 version of Debug Adapter Protocol and libraries.

## 0.18.2
* Added 'trace' attribute to launch configuration: set it to 'true' to enable logging of the Debug Adapter Protocol.


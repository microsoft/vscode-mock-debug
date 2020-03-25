
## 0.40.0
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


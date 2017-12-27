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


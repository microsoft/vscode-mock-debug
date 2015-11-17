# VSCode Mock Debug
This is a starter sample for developing VS Code debug adapters.

**mock-debug** simulates a debug adapter and supports step, continue, breakpoints,
exceptions, and variable access but it is not connected to any real debugger.
The sample is meant as an educational piece showing how to implement a debug
adapter for VS Code. It can be used as a starting point for real adapters.

More information about how to develop a new debug adapter can be found
[here](https://github.com/Microsoft/vscode-extensionbuilders/blob/master/docs/extensions/example-debuggers.md).

## Build and Run
To run it, clone the project and open its folder in VS Code.
Press F5 to build and launch mock-debug in another VS Code window.
In that window create a new "program" file `readme.md` and enter several lines of arbitrary text.

Switch to the debug view and press the gear icon.
VS Code will let you select a debug environment (select "Mock Debugger") and creates a default launch configuration for it.

If you now start the launch configuration by pressing the green play button,
you can 'step through' the target file, set and hit breakpoints, and run into exceptions (if the word exception appears in a line).

![Mock Debug](https://github.com/Microsoft/vscode-mock-debug/blob/master/images/mock-debug.gif)

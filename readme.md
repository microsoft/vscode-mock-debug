This readme.md is a test file for the 'mock' OpendDebug debugger adapter.

opendebug-mock simulates a debugger adapter to a non-existing debugger backend.
+It supports step, continue, breakpoints, exceptions, and variable access
but it is not connected to any real debugger.

opendebug-mock is meant as an educational piece showing how to implement
-a debugger adapter within the OpenDebug architecture.
It can be used as a starting point for real adapters.

To run it, just create a launch config of type "mock" and specify any text file for the "program" attribute.
        {
            "name": "Mock",
			"type": "mock",
            "program": "readme.md"
        },

If you want to be able to set breakpoints in that file use one of the extensions ".cs", ".js", or ".ts"

If a line starts with '+' or '-' a breakpoint will
be adjusted to the next or previous line.

If a line contains the word 'exception' an exception will be thrown when 'continuing' over it (not stepping).

The End!
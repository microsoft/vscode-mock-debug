# VSCode Mock Debug
This is a starter sample for developing VSCode debug adapters.
This `readme.md` is also a test file for the 'mock' OpendDebug debugger adapter.

mock-debug simulates a debugger adapter to a non-existing debugger backend.
It supports step, continue, breakpoints, exceptions, and variable access
but it is not connected to any real debugger.

mock-debug is meant as an educational piece showing how to implement a debugger adapter within the OpenDebug architecture.
It can be used as a starting point for real adapters.

## Run
To run it, just create a `launch.config` of type "mock" and specify any text file for the "program" attribute.

```json
		{
            "name": "Mock",
			"type": "mock",
            "program": "readme.md"
        }
```

## Breakpoints

If you want to be able to set breakpoints in a file use one of the extensions that are listed in extension `package.json` "enableBreakpointsFor".
If a line contains the word 'exception' an exception will be thrown when 'continuing' over it (not stepping).

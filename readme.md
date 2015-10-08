# VSCode Mock Debug
This is a starter sample for developing VSCode debug adapters.

mock-debug simulates a debugger adapter and supports step, continue, breakpoints,
exceptions, and variable access but it is not connected to any real debugger.

mock-debug is meant as an educational piece showing how to implement a debugger
adapter for VSCode. It can be used as a starting point for real adapters.

## Run
To run it, just create a launch configuration of type `mock`:

```json
		{
            "name": "Mock",
			"type": "mock",
            "program": "readme.md",
			"stopOnEntry": true
        }
```

As a `program` you can specify a text file where you can set breakpoints, e.g. \*.js, \*.ts, or \*.md files.

If a line contains the word 'exception' an exception will be thrown when 'continuing' over it (not stepping).

![Mock Debug](mock-debug.gif)


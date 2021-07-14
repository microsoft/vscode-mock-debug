# VS Code Mock Debug

Mock Debug allows to "debug" markdown files (like this). (language is not "Turing Complete" :-)
The text of the markdown is considered the "program to debug" and certain keywords trigger specific functionality.
(Yes, this language is not "Turing Complete" :-)

## Running or Debugging

With the "Run/Debug" split button in the editor header you can easily "run" or "debug" a Markdown file without having toconfigure a debug configuration.
Running a Markdown file has no effect. Debugging a Markdown file starts the debugger and stops on the first line.
  
## Stacks

If debugging stops on a line, the line becomes a stack in the CALL STACK with the individual words shown as frames.
The following line results in a long stack trace and show the paging feature:
a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z

## Variables

Words starting with `$` are treated as variables. Letter casing doesn't matter.

Writing to a variable is done with the `$variable=value` syntax. The format of the value determines the type of the variable. Here are examples for all types:
- Integer: $i=123
- String: $s="abc"
- Boolean: $b1=true $b2=false
- Float: $f=3.14
- Object: $o={abc}

Variables are shown in the VARIABLES view under the "Locals" and "Globals" scopes whenever the debugger stops.
In addition a variable's value is shown when hovering over a variable and VS Code's Inline Values features shows the value at the end of the line.

## Breakpoints

Breakpoints can be set in the breakpoint margin of the editor (even before a Mock Debug session was started).
If a Mock Debug session is active, breakpoints are "validated" according these rules:

* if a line is empty or starts with `+` we don't allow to set a breakpoint but move the breakpoint down
* if a line starts with `-` we don't allow to set a breakpoint but move the breakpoint up
* a breakpoint on a line containing the word `lazy` is not immediately validated, but only after hitting it once.

## Data Breakpoints

Data Breakpoints can be set for different access modes in the VARIABLES view of the editor via the context menu.
The syntax `$variable` triggers a read access data breakpoint, the syntax `$variable=value` a write access data breakpoint.

Examples:
- Read Access: $i
- Write Access: $i=999

## Exceptions:

If a line contains the word `exception` or the pattern `exception(name)` an exception is thrown.
To make the debugger stop when an exception is thrown, two "exception options" exist in the BREAKPOINTS view:
- **Named Exception**: if enabled and configured with a condition (e.g. `xxx`) the debugger will break on the `exception(xxx)` pattern.
- **Other Exceptions**: if enabled the debugger will break on the word `exception` and the `exception(...)` pattern.

## Output logging:

* a line with the pattern `log(xxx)` logs `xxx` to the debug console. If "xxx" is `start` or `end`, a "log group" is started or ended.

log(start)
log(arbitrary line of text)
log(start)
log(arbitrary line of text level 2)
log(start)
log(arbitrary line of text level 3)
log(start)
log(arbitrary line of text level 4)
log(start)
log(arbitrary line of text level 5)
log(another line of text level 5)
log(end)
log(another line of text level 4)
log(end)
log(another line of text level 3)
log(end)
log(another line of text level 2)
log(end)
log(another line of text)
log(end)

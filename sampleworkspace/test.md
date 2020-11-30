# VS Code Mock Debug

Mock Debug allows to "debug" markdown files (like this).
The text of the markdown is considered the "program to debug" and certain keywords trigger specific functionality:

* if debugging stops on a line, the line becomes a stack in the CALL STACK with the words shown as frames.
  Here is a long stack trace: a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z.
* Variables are just synthesized by Mock Debug, they do not originate from the markdown file.

## Breakpoints:

Breakpoints can be set in the breakpoint gutter of the editor (even before a Mock Debug session was started).
If a Mock Debug session is active, breakpoints are "validated" according these rules:

* if a line is empty or starts with `+` we don't allow to set a breakpoint but move the breakpoint down
* if a line starts with `-` we don't allow to set a breakpoint but move the breakpoint up
* a breakpoint on a line containing the word `lazy` is not immediately validated, but only after hitting it once.

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

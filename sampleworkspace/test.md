# VS Code Mock Debug

Mock Debug allows to "debug" markdown files (like this).
The text of the markdown is considered the "program to debug" and certain keywords trigger specific functionality:

* if debugging stops on a line, the line becomes a stack in the CALL STACK with the words shown as frames.
* variables are synthetic


Please note: breakpoints are only verified in an active debug session.

* if a line is empty or starts with '+' we don't allow to set a breakpoint but move the breakpoint down
* if a line starts with '-' we don't allow to set a breakpoint but move the breakpoint up
* a breakpoint on a line containing the word 'lazy' is not immediately verified, but only after hitting it once
* Fire events if line has a breakpoint or the word 'exception' is found.
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

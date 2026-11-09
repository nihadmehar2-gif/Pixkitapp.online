#!/usr/bin/env python3
"""Double-fork daemonizer: run a command fully detached (PPID 1, own session,
stdio closed) so sandbox per-call process reaping cannot kill it.

Usage: python3 daemonize.py <logfile> <command> [args...]
"""
import os
import sys


def daemonize() -> None:
    # First fork: parent exits so the child is adopted by init and
    # continues in the background (not a process-group leader yet).
    pid = os.fork()
    if pid > 0:
        os._exit(0)  # parent leaves immediately

    # Child: become session + process-group leader, drop controlling tty.
    os.setsid()

    # Second fork: the session leader exits; the grandchild can never
    # reacquire a controlling terminal.
    pid = os.fork()
    if pid > 0:
        os._exit(0)


def main() -> None:
    if len(sys.argv) < 3:
        sys.stderr.write("usage: daemonize.py <logfile> <cmd> [args...]\n")
        sys.exit(2)

    logfile, cmd = sys.argv[1], sys.argv[2:]
    daemonize()

    # Redirect stdio: stdin from /dev/null, stdout+stderr to logfile.
    fd_out = os.open(logfile, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    fd_null = os.open(os.devnull, os.O_RDONLY)
    os.dup2(fd_null, 0)
    os.dup2(fd_out, 1)
    os.dup2(fd_out, 2)
    for fd in (fd_out, fd_null):
        if fd > 2:
            os.close(fd)

    os.execvp(cmd[0], cmd)


if __name__ == "__main__":
    main()

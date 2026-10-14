"""Compatibility entry point for the deterministic Node gallery generator.

Preferred command: npm.cmd run gallery (PowerShell), or npm run gallery elsewhere.
Install development tools with npm ci before using either entry point.
"""
from pathlib import Path
import subprocess

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    raise SystemExit(subprocess.call(["node", str(root / "tools" / "build-gallery.cjs")], cwd=root))

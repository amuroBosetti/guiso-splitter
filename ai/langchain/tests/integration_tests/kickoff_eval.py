from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv


def main() -> int:
    current_dir = os.path.dirname(__file__)
    runner_path = os.path.join(current_dir, "eval_runner.py")

    # Ensure we load root .env and pass the env down to the child process
    root_dir = Path(__file__).resolve().parents[3]
    load_dotenv(root_dir / ".env")

    # Launch the evaluation in a detached child process and return immediately
    subprocess.Popen(
        [sys.executable, runner_path, "test-dataset", "pre-commit"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=os.environ.copy(),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


import os
import sys
from pathlib import Path
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Ensure the subprocess inherits env vars from the repo root .env
ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")

from agent.graph import graph
from evaluators import correctness_evaluator
from fire_and_forget import start_eval_fire_and_forget


def test_async_evaluation_with_run_wrapper():
    exp_name = start_eval_fire_and_forget(
        graph, "test-dataset", [correctness_evaluator], "first-experiment"
    )
    assert isinstance(exp_name, str) and exp_name
    # Do not assert rows here unless you’re willing to wait/poll.


if __name__ == "__main__":
    import subprocess, sys
    runner_path = os.path.join(CURRENT_DIR, "eval_runner.py")
    subprocess.Popen(
        [
            sys.executable,
            runner_path,
            "test-dataset",
            "ignored-prefix",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=os.environ.copy(),
    )
    # returns immediately; child process runs evaluation to completion

from __future__ import annotations

import asyncio
import sys
from typing import List

from langsmith import Client
from dotenv import load_dotenv
from pathlib import Path

from agent.graph import graph
from evaluators import correctness_evaluator


async def run_eval(dataset_name: str, experiment_prefix: str) -> None:
    results = await Client().aevaluate(
        graph,
        data=dataset_name,
        evaluators=[correctness_evaluator],
        experiment_prefix=experiment_prefix,
        blocking=False,
    )
    await results.wait()


def main(argv: List[str]) -> int:
    # Load root-level .env so this process has all required variables
    root_dir = Path(__file__).resolve().parents[3]
    load_dotenv(root_dir / ".env")

    if len(argv) < 3:
        print("Usage: python -m ai.langchain.tests.integration_tests.eval_runner <dataset> <experiment_prefix>")
        return 2

    dataset_name = argv[1]
    experiment_prefix = argv[2]
    asyncio.run(run_eval(dataset_name, experiment_prefix))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))


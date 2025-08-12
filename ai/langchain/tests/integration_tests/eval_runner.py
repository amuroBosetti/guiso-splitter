from __future__ import annotations

import asyncio
from typing import List

from langsmith import Client

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
    if len(argv) < 3:
        print("Usage: python -m ai.langchain.tests.integration_tests.eval_runner <dataset> <experiment_prefix>")
        return 2

    dataset_name = argv[1]
    experiment_prefix = argv[2]
    asyncio.run(run_eval(dataset_name, experiment_prefix))
    return 0

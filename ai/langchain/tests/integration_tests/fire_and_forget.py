from __future__ import annotations

import asyncio
import threading
import queue
from typing import Any, Callable, Iterable

from langsmith import Client


def start_eval_fire_and_forget(
    target: Any,
    data: Any,
    evaluators: Iterable[Callable[..., Any]],
    experiment_prefix: str,
) -> str:
    """Kick off an evaluation asynchronously.

    Returns quickly with the experiment name while the run continues in a
    background thread and event loop.
    """
    q: "queue.Queue[str]" = queue.Queue(maxsize=1)

    def run() -> None:
        async def worker() -> None:
            results = await Client().aevaluate(
                target,
                data=data,
                evaluators=evaluators,
                experiment_prefix=experiment_prefix,
                blocking=False,
            )
            q.put(results.experiment_name)
            await results.wait()

        asyncio.run(worker())

    t = threading.Thread(target=run, daemon=True)
    t.start()

    # Return as soon as we have the experiment name, or empty string if not set
    try:
        return q.get(timeout=5)
    except Exception:
        return ""


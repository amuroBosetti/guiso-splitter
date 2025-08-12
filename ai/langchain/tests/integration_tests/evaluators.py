from __future__ import annotations

from langchain.chat_models import init_chat_model
from openevals.llm import create_llm_as_judge


def correctness_evaluator(inputs: dict, outputs: dict, reference_outputs: dict):
    judge = init_chat_model("gpt-4o", temperature=0)

    custom_prompt = (
        "You are an expert recipe grocery list comparator. "
        "Your task is to assign a score based on the following rubric: "
        "<Rubric> A correct answer: - Does not include ingredients found in every house, such as 'salt' or 'water' - Maintains the same language as the recipe name from the input - Has the same 'basic' ingredients from the reference, regardless of the order. A 'basic' ingredient is one without which the recipe would fail An incorrect answer: - Includes ingredients that are found in every house, such as 'salt' or 'water' - Respons in English even though the recipe name is in other language - Lacks the base ingredients included in the reference </Rubric> "
        "<Instructions> - Carefully read the input and output - Focus on completitude of the list rather than amounts of measures </Instructions> "
        "<Reminder> The main goal is to make sure no 'basic' ingredients are lacking, and that the list can be used for shopping </Reminder>\n\n"
        "Evaluate the following and assign a continuous correctness score between 0.0 and 1.0 (1.0 = fully correct, 0.0 = incorrect), and provide a brief reasoning that ends with: Thus, the score should be: SCORE.\n"
        "Input: {inputs}\n"
        "Output: {outputs}\n"
        "Reference: {reference_outputs}"
    )

    evaluator = create_llm_as_judge(
        prompt=custom_prompt,
        judge=judge,
        feedback_key="correctness",
        continuous=True,
        use_reasoning=True,
    )

    eval_result = evaluator(
        inputs=inputs,
        outputs=outputs,
        reference_outputs=reference_outputs,
    )

    return eval_result


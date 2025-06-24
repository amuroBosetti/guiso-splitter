from __future__ import annotations

from typing import List, TypedDict
from langgraph.prebuilt import create_react_agent
from langchain_core.runnables import RunnableConfig
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.prompts import ChatPromptTemplate

# Define a ReAct-compatible prompt template for generating ingredients from recipe names
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an expert chef and recipe assistant. When given a recipe name, you will provide a comprehensive list of ingredients typically needed to make that dish.

Your task:
1. Analyze the recipe name provided
2. Generate a realistic and complete list of ingredients for that recipe
3. Include common ingredients and seasonings
4. Consider variations and optional ingredients that might be used
5. Return the ingredients as a structured response

Respect the original language of the recipe name. If the recipe name is in English, return the ingredients in English. If the recipe name is in another language, return the ingredients in that language.
If the recipe name language is Spanish, return the units in metric system

Be practical - include ingredients that would commonly be found in most versions of the recipe.

The output should be structured as only the list of the ingredients, no other text. Quantities should be included between parenthesis, 
and if units are different than whole numbers, do not include them. For example, if the quantity is 1 spoon, do not include the quantity.
If any ingredients are optional, do not include them.

Example:
Input: "Spaghetti Carbonara"
Output: ["spaghetti", "eggs (2)", "parmesan", "pepper", "salt"]
""",
        ),
        ("human", "Recipe name: {messages}"),
    ]
)

# Initialize the LLM with explicit configuration
llm = HuggingFaceEndpoint(
    model="meta-llama/Llama-3.1-8B-Instruct",
    task="text-generation",
    max_new_tokens=512,
    do_sample=False,
    repetition_penalty=1.03,
    verbose=False,  # Explicitly set verbose to False
)

model = ChatHuggingFace(
    llm=llm,
    verbose=False,  # Explicitly set verbose to False
    debug=False
)

graph = create_react_agent(
    model=model, prompt=prompt, tools=[]
)

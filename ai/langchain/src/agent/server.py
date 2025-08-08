from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from pydantic import BaseModel
from typing import List
import ast
from dotenv import load_dotenv
from pathlib import Path

from agent.graph import graph


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------
class RecipeRequest(BaseModel):
    recipe_name: str

class RecipeResponse(BaseModel):
    ingredients: List[str]

# ---------------------------------------------------------------------------
# FastAPI application setup
# ---------------------------------------------------------------------------
load_dotenv(Path(__file__).resolve().parents[2] / '.env')
app = FastAPI(title="Guiso-Splitter Agent API", version="0.1.0")

# Allow the Vite dev server (default port 5173) to call the API from the browser
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # fallback if using a different port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Custom endpoints
# ---------------------------------------------------------------------------
@app.post("/recipes/ingredients", response_model=RecipeResponse)
async def get_recipe_ingredients(request: RecipeRequest) -> RecipeResponse:
    """Get a list of ingredients for a given recipe name."""
    result = await graph.ainvoke({"messages": request.recipe_name})
    
    # Extract the content from the AI's message
    ai_message = result['messages'][1]  # Second message is the AI's response
    ingredients_str = ai_message.content
    
    # Safely parse the string representation of the list
    try:
        ingredients = ast.literal_eval(ingredients_str)
        if not isinstance(ingredients, list):
            ingredients = []
    except (ValueError, SyntaxError):
        ingredients = []
        
    return RecipeResponse(ingredients=ingredients)

# ---------------------------------------------------------------------------
# LangServe routes (if you want the generic endpoints too)
# ---------------------------------------------------------------------------
add_routes(app, graph, path="/agent")

# ---------------------------------------------------------------------------
# Entrypoint for `python -m agent.server` or `uvicorn agent.server:app ...`
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("agent.server:app", host="127.0.0.1", port=8000, reload=True) 
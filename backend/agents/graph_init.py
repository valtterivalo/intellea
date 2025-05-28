from pydantic import BaseModel
from agents import Agent # Assuming Agent is imported correctly from the library
from backend.tools.embeddings import get_embeddings
from backend.tools.umap_positions import calculate_positions
from backend.deps import AppCtx # Import AppCtx if context is needed by tools

class GraphInitOut(BaseModel):
    explanation_markdown: str
    knowledge_cards: list[dict]
    visualization_data: dict # Define structure if known, e.g., nodes, edges
    quiz: dict | None

GraphInitAgent = Agent( # Removed ["AppCtx"]
    name="graph_init",
    instructions="generate initial graph, cards and optional quiz. "
                 "use tools when needed. output must match GraphInitOut.",
    tools=[get_embeddings, calculate_positions], # Add supabase tools if needed here
    output_type=GraphInitOut,
    model="o3-medium",
    model_settings={"temperature": 0.3},
) 
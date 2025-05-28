from pydantic import BaseModel
from agents import Agent
from backend.tools.embeddings import get_embeddings
from backend.tools.umap_positions import calculate_positions
from backend.deps import AppCtx

class ExpandOut(BaseModel):
    title: str
    content: str # Markdown expected?
    related_concepts: list[dict] # Define structure e.g. {"id": str, "label": str}

ConceptExpanderAgent = Agent(
    name="concept_expander",
    instructions="expand a single node in the existing graph. "
                 "respond with ExpandOut. respect prior style guidelines.",
    # Note: Depending on how expansion works, it might need context of the existing graph.
    # This could be passed in the input payload or potentially fetched via a supabase tool.
    tools=[get_embeddings, calculate_positions], # Add supabase tools if needed
    output_type=ExpandOut,
    model="o3-medium",
) 
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel # To define request body models

# Assuming these components exist in the specified paths
from agents import Runner, stream_text # Make sure these are correctly exposed by agents pkg
from backend.deps import get_ctx, AppCtx
from backend.agents.chat_router import RouterAgent
# Import output types if needed for response models, though Runner might return them directly
# from backend.agents.graph_init import GraphInitOut 
# from backend.agents.concept_expand import ExpandOut

# Configure tracing/logging if desired (as mentioned in the plan)
# from agents import enable_verbose_stdout_logging, tracing
# enable_verbose_stdout_logging() # Example
# tracing.setup(...) # Example

app = FastAPI()

# --- Request Models ---
class GenerateRequest(BaseModel):
    prompt: str
    # Add any other fields expected from the frontend, e.g., session_id

class ExpandRequest(BaseModel):
    node_id: str # Or int, depending on your ID type
    label: str
    # Add session_id if needed for context

class ChatRequest(BaseModel):
    messages: list[dict] # Expecting format like {"role": "user", "content": "..."}
    # Add session_id if needed for context

# --- API Routes ---
@app.post("/generate")
async def generate(req: GenerateRequest, ctx: AppCtx = Depends(get_ctx)):
    """Kick off a fresh session; returns GraphInitOut structure."""
    try:
        # The RouterAgent should handoff to GraphInitAgent based on instructions
        # Pass the user prompt directly as input
        res = await Runner.run(RouterAgent, input=req.prompt, context=ctx)
        
        if not res or not res.final_output:
             raise HTTPException(status_code=500, detail="Agent did not produce an output")
             
        # Assuming the final_output is the GraphInitOut structure after handoff
        return res.final_output
    except Exception as e:
        # Log the exception e
        raise HTTPException(status_code=500, detail=f"Error during generation: {str(e)}")

@app.post("/expand")
async def expand(req: ExpandRequest, ctx: AppCtx = Depends(get_ctx)):
    """Expand one node; returns ExpandOut structure."""
    try:
        # Construct the payload as expected by the RouterAgent's instructions
        payload = f"expand node {req.node_id} ({req.label})"
        res = await Runner.run(RouterAgent, input=payload, context=ctx)
        
        if not res or not res.final_output:
             raise HTTPException(status_code=500, detail="Agent did not produce an output")

        # Assuming the final_output is the ExpandOut structure after handoff
        return res.final_output
    except Exception as e:
        # Log the exception e
        raise HTTPException(status_code=500, detail=f"Error during expansion: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest, ctx: AppCtx = Depends(get_ctx)):
    """SSE streaming of freeform chat or agent results if RouterAgent answers directly."""
    try:
        agent_run_stream = Runner.run_stream(RouterAgent, input=req.messages, context=ctx)
        
        async def event_gen():
            async for chunk in stream_text(agent_run_stream):
                # Ensure chunk is properly formatted/encoded if necessary
                yield f"data: {chunk}\n\n"
            # You might want to yield a final confirmation or handle errors within the stream

        return StreamingResponse(event_gen(), media_type="text/event-stream")
    except Exception as e:
        # Log the exception e
        # Cannot return HTTPException here as headers might be sent.
        # Consider logging and perhaps sending a specific SSE error event.
        if os.getenv("APP_DEBUG"): print(f"Error during chat stream setup: {str(e)}")
        # Fallback or alternative error signaling might be needed
        async def error_stream():
             yield f"event: error\ndata: {{\"detail\": \"Error processing stream: {str(e)}\"}}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream", status_code=500)

# --- Root endpoint for basic check ---
@app.get("/")
async def root():
    return {"message": "LLM Visualization Backend is running"}

# --- Add Guardrails (as per plan step 7) ---
# from agents import input_guardrail, GuardrailFunctionOutput
# @input_guardrail
# def length_check(ctx, agent, inp):
#     # ... implementation ...
#     return GuardrailFunctionOutput(...)
# RouterAgent.input_guardrails = [length_check]

# --- Run instruction (for local dev) ---
# Use: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload 
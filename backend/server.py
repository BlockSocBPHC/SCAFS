import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from scafs.state import SharedState, SourceCode
from scafs.supervisor import Supervisor

load_dotenv()

app = FastAPI(title="SCAFS Backend API")

# Allow React frontend to communicate with Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/audit")
async def run_audit(file: UploadFile = File(...)):
    """
    Receives a .sol file from the React frontend, runs the full AI agent pipeline,
    and returns the final state (findings, patches, verification).
    """
    content = await file.read()
    code_text = content.decode("utf-8")
    
    # Initialize our pipeline state with the uploaded code
    state = SharedState(
        source=SourceCode(original=code_text, current=code_text),
        max_iterations=3
    )
    
    # Run the state machine
    supervisor = Supervisor()
    supervisor.run(state)
    
    # Return the entire pipeline result to React
    return state.model_dump()

if __name__ == "__main__":
    print("Starting SCAFS Backend API on http://localhost:8000")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

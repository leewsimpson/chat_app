"""
FastAPI backend for the chat application.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from fastapi.responses import StreamingResponse

from bot_logic import generate_bot_response

# Create FastAPI app
app = FastAPI(
    title="Chat App Backend",
    description="Python FastAPI backend for the chat application",
    version="1.0.0"
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class MessageRequest(BaseModel):
    text: str


# Define response model
class MessageResponse(BaseModel):
    response: str


@app.get("/")
async def root():
    """Root endpoint that returns a welcome message."""
    return {"message": "Welcome to the Chat App API"}

async def stream_processor(response):
    """
    Process the streaming response from the bot logic.
    
    Args:
        response: The async generator from generate_bot_response
        
    Returns:
        An async generator that yields text chunks for streaming
    """
    async for chunk in response:
        if hasattr(chunk, 'delta') and chunk.delta:
            yield chunk.delta

@app.post("/api/message_stream")
async def process_message_async(request: MessageRequest) -> StreamingResponse:
    """
    Process a user message and return a streaming bot response.
    
    Args:
        request: The message request containing the user's text
        
    Returns:
        A StreamingResponse that yields text chunks as they're generated
    """
    try:
        bot_response = generate_bot_response(request.text)
        return StreamingResponse(stream_processor(bot_response), media_type="text/event-stream")

    except Exception as e:
        # Log the error (in a real app, use a proper logging system)
        print(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing message")


@app.post("/api/message")
async def process_message(request: MessageRequest) -> MessageResponse:
    """
    Process a user message and wait for the complete bot response.
    
    Args:
        request: The message request containing the user's text
        
    Returns:
        A MessageResponse containing the complete response as a string
    """
    try:
        bot_response = generate_bot_response(request.text)
        complete_response = ""
        async for chunk in bot_response:
            if hasattr(chunk, 'delta') and chunk.delta:
                complete_response += chunk.delta
        
        return MessageResponse(response=complete_response)

    except Exception as e:
        # Log the error (in a real app, use a proper logging system)
        print(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing message")


if __name__ == "__main__":
    # Run the FastAPI app with Uvicorn when script is executed directly
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Python FastAPI Backend for Chat App

This is a Python FastAPI implementation of the Chat App backend, which replaces the original TypeScript implementation.

## Setup

1. Make sure you have Python 3.8+ installed
2. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Server

Start the FastAPI server with:

```
uvicorn main:app --reload
```

Or simply run:

```
python main.py
```

The server will start on http://localhost:8000

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /`: Root endpoint that returns a welcome message
- `POST /api/message`: Process a user message and return a bot response
  - Request body: `{ "text": "your message here" }`
  - Response: `{ "response": "bot response here" }`

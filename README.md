# Chat App with Python FastAPI Backend

This project consists of a chat application with a Python FastAPI backend that serves both a web application and a Slack bot.

## Project Structure

- **BackEnd/**: Python FastAPI backend that provides chat response functionality
- **WebApp/**: Next.js web application that consumes the backend API
- **SlackApp/**: Slack bot application that also consumes the backend API

## Setup and Running

### 1. Python FastAPI Backend

```bash
# Navigate to the Python backend directory
cd BackEnd

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python main.py
# or
uvicorn main:app --reload
```

The FastAPI server will run on http://localhost:8000

You can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Web Application

```bash
# Navigate to the WebApp directory
cd WebApp

# Install dependencies
npm install

# Run the development server
npm run dev
```

The web application will run on http://localhost:3000

### 3. Slack App

```bash
# Navigate to the SlackApp directory
cd SlackApp

# Install dependencies
npm install

# Run the Slack bot
npm run dev
```

## API Endpoints

- `GET /`: Root endpoint that returns a welcome message
- `POST /api/message`: Process a user message and return a bot response
  - Request body: `{ "text": "your message here" }`
  - Response: `{ "response": "bot response here" }`
- `POST /api/message_stream`: Process a user message and return a bot response streaming

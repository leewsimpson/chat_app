#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Start the application
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

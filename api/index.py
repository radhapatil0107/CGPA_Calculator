"""
Vercel Serverless Function entry point for Flask application.
"""
import os
import sys

# Ensure VERCEL environment variable is set
os.environ["VERCEL"] = "1"

# Add directories to system path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_dir = os.path.join(project_root, "cgpa-calculator", "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the Flask application object
from app import app

# Ensure debug is disabled in serverless production
app.debug = False

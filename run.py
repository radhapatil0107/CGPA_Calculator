"""
Root WSGI and launcher script for the Student Grade Calculator application.
Compatible with both local execution (python run.py) and production WSGI servers (gunicorn run:app).
"""
import os
import sys

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "cgpa-calculator", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the Flask application object for WSGI servers (Gunicorn, Waitress, etc.)
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1")
    print(f"Starting Student Grade Calculator on http://localhost:{port} (debug={debug})...")
    app.run(host="0.0.0.0", port=port, debug=debug)

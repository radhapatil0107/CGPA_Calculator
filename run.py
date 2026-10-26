"""
Root launcher script for the Student Grade Calculator application.
"""
import os
import sys
import subprocess

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(current_dir, "cgpa-calculator", "backend")
    app_file = os.path.join(project_dir, "app.py")
    
    print("Starting Student Grade Calculator...")
    subprocess.run([sys.executable, app_file], cwd=project_dir)
    

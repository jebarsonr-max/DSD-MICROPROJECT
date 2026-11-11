import os
import sys

# Ensure root directory is on Python path so 'backend' package is importable
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.main import app

# Export app for Vercel Serverless Function handler
handler = app

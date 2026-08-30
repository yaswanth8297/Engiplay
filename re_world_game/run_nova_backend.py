import uvicorn
import os
import sys

if __name__ == "__main__":
    # Ensure current directory is in PYTHONPATH
    backend_dir = os.path.join(os.path.dirname(__file__), "nova_backend")
    sys.path.insert(0, backend_dir)

    print("==================================================")
    print("      RE:WORLD - NOVA AI Mentor Backend Server     ")
    print("==================================================")
    print("Starting FastAPI server at http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

# Post Genie
Your Wishes, Our Magic. AI social media planning with human approval, a mock scheduler and queue verification.

## Status
- backend/: complete (FastAPI + SQLite). Workflow logic tested by `python backend/tests/test_cases.py` (TC1-TC4).
- frontend/: React + TypeScript + Tailwind (Vite). All 8 tabs, intro, profile setup and genie chat are written. The frontend has not been run through `npm run build` by the author, so expect small fixes on first run.

## Run the backend
    cd backend
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp ../.env.example .env        # optional: add GEMINI_API_KEY
    uvicorn main:app --reload      # http://localhost:8000/docs
    python tests/test_cases.py     # TC1-TC4

## Run the frontend
    cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :8000)

## Mock vs real
Scheduler is a built-in mock (an image named like "reject.png" is refused). AI uses Gemini when GEMINI_API_KEY is set, otherwise labelled templates. Buffer and image upload are not built yet.

## Push to GitHub
    git init && git add . && git commit -m "Post Genie backend"
    git branch -M main && git remote add origin <your-repo-url> && git push -u origin main

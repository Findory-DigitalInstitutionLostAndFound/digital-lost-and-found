# Backend

For matching evaluation evidence, see `item_matching/evaluation/integration/`
and `item_matching/matching/ROBUST_MATCHING.md` from the repository root.

This folder contains the Python backend for the digital lost-and-found application.

## Prerequisites

- Python 3.10 or newer
- PowerShell, Command Prompt, or Git Bash
- Run the commands below from this `backend` directory.

## macOS / Linux quick start

The local backend environment is `backend/.venv`. From this directory:

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The backend also uses EasyOCR model files and the Presidio spaCy English model
(`en_core_web_lg`). On first use, these may download automatically. Valid
`SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY` values must be set in `.env`.

In a separate terminal, start the frontend from the repository root:

```bash
cd frontend/lost-and-found
npm ci
npm run dev
```

## Create the virtual environment

A virtual environment keeps this project's Python packages separate from other projects.

### Windows PowerShell

```powershell
python -m venv venv
```

### Windows Command Prompt

```bat
python -m venv venv
```

You only need to create the virtual environment once. If the `venv` folder already exists, skip this step.

## Activate the virtual environment

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks the activation script, allow scripts for the current user and try again:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Windows Command Prompt

```bat
venv\Scripts\activate.bat
```

### Git Bash

```bash
source venv/Scripts/activate
```

When the environment is active, `(venv)` appears at the beginning of the terminal prompt.

## Install the requirements

With the virtual environment activated, install the pinned dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

`requirements.txt` currently installs:

- FastAPI
- Uvicorn
- Supabase's Python client
- `python-dotenv`

Using `python -m pip` ensures that packages are installed into the active virtual environment.

## Run the backend

Make sure the virtual environment is activated before starting the backend. Run the following command in the terminal you are using:

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

### Windows Command Prompt

```bat
venv\Scripts\activate.bat
python -m uvicorn main:app --reload
```

### Git Bash

```bash
source venv/Scripts/activate
python -m uvicorn main:app --reload
```

The backend will be available at http://127.0.0.1:8000. Press `Ctrl+C` to stop it.
`
## Updating dependencies

After changing `requirements.txt`, activate the virtual environment and run:

```bash
python -m pip install -r requirements.txt
```

To record the currently installed packages and versions:

```bash
python -m pip freeze > requirements.txt
```

Review the generated file before committing it, because this command may include packages that are not direct project dependencies.

## Deactivate the virtual environment

When you are finished working on the backend, run:

```bash
deactivate
```

## Troubleshooting

Check that the virtual environment's Python interpreter is being used:

```bash
python --version
python -m pip --version
```

The pip path should point inside the backend `venv` directory while the environment is active.

If packages are missing, activate the environment again and reinstall them:

```bash
python -m pip install -r requirements.txt
```

## Environment variables

Keep local secrets in the backend `.env` file and do not commit them to source control. Load the required variable names from the backend code or project documentation when the application is implemented.

## Robust matching update

The Matches page now defaults to multilingual semantic scores saved in
`item_matching/robust_results.json`. Generate them from the repository root:

```bash
backend/.venv/bin/python -m pip install -r item_matching/requirements-semantic.txt
backend/.venv/bin/python item_matching/matching/robust_matcher.py
```

The UI offers the original baseline too. API parameters are `source=robust`
(default) or `source=baseline`, `min_score=70` and `top_k=3` (per lost report).
Detected attribute conflicts are excluded. Image scores only break text-score
ties. Missing robust files return 503; there is no silent fallback. See
`item_matching/matching/ROBUST_MATCHING.md` for development comparison results
and limitations. The older baseline description follows.

## Matching dataset preview

The Matches page requests `GET /matches/dataset` from the backend. The endpoint
reads `item_matching/data/lost_items.json`, `data/found_items.json`, and
`text_results.json` relative to the repository, regardless of the working directory.
It joins optional `image_results.json` cosine scores by lost/found IDs. Text scores
of at least 70/100 are included by default (`?min_score=50` changes the cutoff).
Image scores are shown separately and do not affect the text cutoff.

After editing dataset items, regenerate saved results from the repository root:

```bash
python3 item_matching/matching/text_matcher.py
# Optional; requires requirements-image.txt dependencies and local images:
python3 item_matching/matching/image_matcher.py
```

Refresh the Matches page to read the updated files. These are dataset previews,
not personal matches for the signed-in account. Confirm/dismiss actions only
last while the page is mounted and do not notify campus security. Secret codes,
user IDs, and original image URLs are excluded from the response.

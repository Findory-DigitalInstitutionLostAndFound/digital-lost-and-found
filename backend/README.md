# Backend

This folder contains the Python backend for the digital lost-and-found application.

## Prerequisites

- Python 3.10 or newer
- PowerShell, Command Prompt, or Git Bash
- Run the commands below from this `backend` directory.

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

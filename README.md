# BramHacks-2025
YarkNet is a research dashboard that predicts how the Yarkovsky effect subtly alters an asteroid’s orbit and reports the expected drift with an honest uncertainty band. It also ranks targets for follow-up by combining prediction confidence, close-approach risk (MOID), and size, and visualizes how the drift would change their paths over time.

## Running Development App Locally

Prereq: Node.js, python3, pip

From root dir of repo, install all python dependencies:

```sh
pip install -r requirements.txt
```

Start backend server:

```sh
uvicorn endpoints:app --reload --port 8080
```

In a new terminal, go to frontend dir and install dependencies:

```sh
cd frontend/
npm install
```

Start frontend live server in frontend dir:

```sh
npm start
```
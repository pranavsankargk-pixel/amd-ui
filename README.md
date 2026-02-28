# AMD UI

Front‑end for the **AI Powered Engineering Platform** API (FastAPI backend located in `AMD_HACKATHON`).
Interactive React components allow you to generate questions, full tests, interview prompts,
analyze performance, and validate math expressions using the Python server.

## Features

* **GATE question generator** – choose subject/topic/difficulty/type/language and see the generated content with optional audio playback.
* **Full test creator** – produce a complete exam paper with configurable duration, language and type (GATE/Placement).
* **Interview question generator** – supply a role/domain/difficulty and receive a structured interview question and answer.
* **Performance analytics** – paste JSON scores and get strength, weakness and readiness reports.
* **Math validator** – evaluate symbolic expressions and return solutions via Sympy.

## Development

1. Start the backend API (ensure you have Python 3.11+):
   ```bash
   cd ../AMD_HACKATHON
   python -m venv .venv   # or your preferred environment
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   # (optional) use main_demo.py for sample static responses
   ```

2. Run the UI:
   ```bash
   cd ../amd-ui
   npm install
   npm run dev
   ```

3. Browse to [http://localhost:3000](http://localhost:3000) and use the navigation bar to switch tools.

The client defaults to `http://localhost:8000` as the API base; you can override with
`NEXT_PUBLIC_API_BASE` in `.env.local`.

## Notes

* API endpoints:
  * `GET /languages`, `GET /subjects` – metadata used by forms.
  * `POST /generate-gate-question` – accept `subject`, `topic`, `difficulty`, `qtype`, `language`, `include_audio`.
  * `POST /generate-full-test` – accept `language`, `duration_minutes`, `test_type`, `include_solutions`.
  * `POST /interview-agent` – accept `role`, `domain`, `language`, `difficulty`, `include_audio`.
  * `POST /performance-analytics` – accept `{attempts: {topic:score,...}, user_id?}`.
  * `POST /validate-math` – accept `{expression, variable}`.
  * `GET /audio/{filename}` – stream generated mp3 files.

* UI components are in `app/components`. Feel free to add validation, error handling, styling or convert
  to a more polished design (tabs, modals, etc.).

* This repo uses the Next.js App Router (`app` directory) with Tailwind CSS for quick styling.

Thank you.

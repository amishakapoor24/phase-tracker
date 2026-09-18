# PhaseTracker Project File Reference

This document explains the connected PhaseTracker platform and the separate STS Assistant service that powers the voice and text assistant.

## 1. System Overview

The platform has two applications:

1. **PhaseTracker**: a React frontend, Express API, and MongoDB-backed learning management system.
2. **STS Assistant**: a FastAPI service that records speech, transcribes it, sends questions to Groq, reads the live PhaseTracker curriculum from MongoDB, and optionally returns generated speech.

The main browser flow is:

```text
React AssistantPage
  -> STS Assistant /api/stt
  -> STS Assistant /api/chat
       -> MongoDB phases and subphases
       -> Groq LLM
  -> STS Assistant /api/tts
  -> Browser audio playback
```

The regular PhaseTracker frontend uses the Express backend on port `5000`. The assistant uses the STS backend on port `8001`.

## 2. Root Documentation

### `README.md`
The main project introduction. It describes the LMS features, technology stack, setup commands, student/mentor/admin workflows, and API overview.

### `INDEX.md`
Documentation navigation page. It points readers toward the project summary, implementation guide, testing guide, quick-start documents, and architecture material.

### `PROJECT_SUMMARY.md`
High-level implementation summary. It covers completion status, the MERN stack, LMS features, approval workflows, analytics, security, and project structure.

### `COMPLETION_SUMMARY.md`
Summary of completed enhancement work and the current project state.

### `ENHANCED_TECH_STACK.md`
Explains the production-oriented additions such as Joi validation, email, analytics, security headers, rate limiting, Axios configuration, and date utilities.

### `ENHANCEMENT_CHECKLIST.md`
Checklist of enhancement tasks and their completion status.

### `ENHANCEMENT_SUMMARY.md`
Short summary of the enhancements made to the original LMS implementation.

### `GETTING_STARTED.md`
Setup and orientation guide for installing dependencies and starting the backend and frontend.

### `QUICK_START_ENHANCED.md`
Short setup path for getting the enhanced platform running quickly.

### `QUICK_REFERENCE.md`
Fast lookup for commands, routes, roles, and common project operations.

### `IMPLEMENTATION_GUIDE.md`
Detailed explanation of the approval workflow: students submit work, mentors approve or reject it, and progression is unlocked automatically.

### `PHASE_SYSTEM_REDESIGN.md`
Explains the migration from hardcoded phases to mentor-controlled dynamic phases and sub-phases. It documents starting and ending phase flags and dynamic learning paths.

### `SYSTEM_ARCHITECTURE.md`
Architecture description for frontend, backend, MongoDB, authentication, workflows, and service relationships.

### `TESTING_GUIDE.md`
Manual test plan for registration, login, phase creation, sub-phase completion, mentor approval, reflections, and progression.

### `.gitignore`
Git exclusions for local files, dependencies, build output, environment files, and generated artifacts.

## 3. PhaseTracker Backend

Location: `phasetracker/backend`

The backend is an Express application connected to MongoDB through Mongoose.

### `backend/package.json`
Defines the Node backend package and scripts:

- `npm start`: starts `server.js` with Node.
- `npm run dev`: starts the server with Nodemon.
- Dependencies include Express, Mongoose, JWT, bcrypt, Joi, Helmet, CORS, rate limiting, Multer, Cloudinary, and Nodemailer.

### `backend/package-lock.json`
Locks exact dependency versions for reproducible npm installs.

### `backend/.env`
Private runtime configuration. It contains the MongoDB URI, JWT secret, port, frontend URL, email configuration, and rate-limit settings. Never commit or expose this file.

### `backend/server.js`
Main Express entry point. It:

- Loads environment variables.
- Enables Helmet security headers.
- Configures CORS.
- Adds JSON parsing and API rate limiting.
- Serves uploaded files.
- Registers authentication, phase, progress, quiz, admin, sub-phase, upload, house, announcement, analytics, and audit routes.
- Connects to MongoDB.
- Starts the server after a successful database connection.

### `backend/create-admin.js`
One-time utility for creating an administrator account in MongoDB.

### `backend/migrateProgress.js`
Migration utility for updating existing progress documents when the phase/sub-phase workflow changes.

## 4. PhaseTracker Backend Middleware

### `backend/middleware/auth.js`
Authentication and authorization middleware. It validates JWTs, loads the current user, and exposes role checks such as mentor or admin access.

### `backend/middleware/admin.js`
Admin-specific authorization middleware. It prevents non-admin users from accessing admin-only operations.

### `backend/middleware/error.js`
Central Express error handler. It converts thrown route errors into consistent HTTP responses.

### `backend/middleware/validation.js`
Reusable Joi validation schemas and validation middleware for request bodies and route inputs.

## 5. PhaseTracker MongoDB Models

All models are Mongoose schemas used by the Express routes.

### `backend/models/User.js`
User accounts and roles. It stores identity, credentials, role, house, and account metadata. Roles are primarily student, mentor, and admin.

### `backend/models/House.js`
House/group records. The platform uses houses to organize students, including groups such as Bhairav, Bhageshree, and Malhar.

### `backend/models/Phase.js`
Dynamic learning phases. Important fields include:

- `id`: stable phase identifier.
- `name`: display name.
- `description`: learning goal.
- `order`: learning order.
- `isStarting`: configured starting phase.
- `isEnding`: configured ending phase.
- `createdBy`: mentor/admin owner.

### `backend/models/SubPhase.js`
Projects or learning units inside a phase. It stores title, description, order, and requirements such as GitHub, deployment, video, and reflection requirements.

### `backend/models/Progress.js`
Student progression through phases and sub-phases. It tracks locked, unlocked, pending, and completed states and supports automatic unlocking.

### `backend/models/Question.js`
Quiz question records associated with phases. Used by quiz and result flows.

### `backend/models/ApprovalRequest.js`
Mentor approval requests submitted by students for completed sub-phases.

### `backend/models/Submission.js`
Student work submissions and drafts. It can contain messages, GitHub links, deployment links, video links, attachments, and reflection text.

### `backend/models/Reflection.js`
Reflection records created after a student completes the sub-phases of a phase.

### `backend/models/Notification.js`
Application notification records for approval updates, announcements, and workflow events.

### `backend/models/Announcement.js`
Admin or mentor announcements shown to users.

### `backend/models/AuditLog.js`
Security and activity history for important actions such as phase creation, sub-phase edits, approvals, and deletions.

## 6. PhaseTracker Backend Routes

### `backend/routes/auth.js`
Registration, login, password reset, and authentication-related operations. It creates JWT-backed sessions and initializes student progress against the current dynamic phases.

### `backend/routes/phases.js`
Public phase reads. It returns all phases sorted by order and supports retrieving a single phase by its stable ID.

### `backend/routes/subphases.js`
Sub-phase management and approval workflow. It handles:

- Reading sub-phases for a phase.
- Creating, editing, deleting, and reordering sub-phases.
- Draft submissions.
- Completion/approval requests.
- Mentor approval and rejection.
- Progress unlocking.
- Reflection workflow.

### `backend/routes/progress.js`
Student progress reads and updates. It powers the dashboard learning path and phase/sub-phase status.

### `backend/routes/quiz.js`
Quiz question retrieval, quiz submission, scoring, and result-related progression.

### `backend/routes/admin.js`
Admin and mentor management actions, including users, phases, sub-phases, approvals, and other administrative operations.

### `backend/routes/analytics.js`
Analytics endpoints for totals, phase completion, house statistics, student distributions, mentor activity, approval timelines, and individual performance.

### `backend/routes/houses.js`
House listing and house-related administration.

### `backend/routes/announcements.js`
Announcement creation, listing, updating, and deletion.

### `backend/routes/uploads.js`
File upload handling. It uses Multer and can integrate with Cloudinary for hosted assets.

## 7. PhaseTracker Backend Services

### `backend/services/analyticsService.js`
Database aggregation and calculation logic used by analytics routes.

### `backend/services/auditService.js`
Creates audit-log records for important user and administrator actions.

### `backend/services/emailService.js`
Nodemailer configuration and email templates for welcome emails, approvals, rejection feedback, reflection status, and workflow notifications.

## 8. PhaseTracker Frontend

Location: `phasetracker/frontend`

The frontend is a React 18 single-page application using React Router, Axios, Context API, and plain CSS.

### `frontend/package.json`
Defines frontend dependencies and scripts:

- `npm start` / `npm run dev`: starts Create React App development mode on port `3000`.
- `npm run build`: creates the production bundle.
- The development proxy points normal `/api` requests to the Express backend on port `5000`.

### `frontend/package-lock.json`
Locks exact frontend dependency versions.

### `frontend/public/index.html`
HTML shell containing the root element where React mounts.

### `frontend/update_alerts.js`
Small frontend utility related to updating or maintaining alert content.

### `frontend/src/index.js`
React entry point. It mounts the application and imports the global CSS.

### `frontend/src/index.css`
Global reset, fonts, CSS variables, colors, buttons, cards, forms, page utilities, and shared visual rules.

### `frontend/src/App.js`
Application router and access-control boundary. It defines:

- Public pages.
- Student private pages.
- Mentor-only pages.
- Admin-only pages.
- The `/assistant` route.
- Redirect behavior for unauthenticated or incorrectly privileged users.

### `frontend/src/context/AuthContext.js`
Global authentication state. It loads the stored user from local storage, configures Axios authorization headers, implements login/register/logout, and exposes the current user to pages.

## 9. Shared Frontend Components and Utilities

### `frontend/src/components/Navbar.js`
Shared navigation bar. It changes available links based on the logged-in user's role.

### `frontend/src/components/Navbar.css`
Navbar layout, logo, links, actions, and responsive styles.

### `frontend/src/utils/axiosConfig.js`
Axios configuration and interceptors. It centralizes API requests, token handling, and common error behavior.

### `frontend/src/utils/dateUtils.js`
Day.js-based date formatting and relative-time helpers.

### `frontend/src/utils/validation.js`
Client-side Joi validation schemas and validation helpers.

## 10. Frontend Student and Public Pages

### `frontend/src/pages/HomePage.js` / `HomePage.css`
Public landing page and its styling.

### `frontend/src/pages/LoginPage.js`
Login form and authentication submission.

### `frontend/src/pages/RegisterPage.js`
Registration form, role/house selection, and account creation.

### `frontend/src/pages/AuthPage.css`
Shared authentication-page styling.

### `frontend/src/pages/ForgotPasswordPage.js`
Requests a password-reset email.

### `frontend/src/pages/ResetPasswordPage.js`
Accepts a reset token and changes the password.

### `frontend/src/pages/DashboardPage.js` / `DashboardPage.css`
Student dashboard. It displays phases, progress, locked/unlocked states, announcements, statistics, and navigation into phase details.

### `frontend/src/pages/StudentPhaseDetail.js` / `StudentPhaseDetail.css`
Phase detail view. It lists sub-phases, requirements, progress state, submissions, and completion actions.

### `frontend/src/pages/StudentProgressPage.js`
Progress-focused view used for student or mentor progress inspection.

### `frontend/src/pages/QuizPage.js` / `QuizPage.css`
Loads phase-specific quiz questions, accepts answers, and submits the quiz.

### `frontend/src/pages/ResultPage.js` / `ResultPage.css`
Displays quiz results, pass/fail status, and the next dynamically ordered phase.

### `frontend/src/pages/UserProfilePage.js` / `UserProfilePage.css`
Displays user profile information and profile-related actions.

### `frontend/src/pages/NotificationsPage.js`
Displays application notifications.

## 11. Frontend Mentor and Admin Pages

### `frontend/src/pages/MentorDashboard.js`
Mentor landing dashboard and mentor workflow navigation.

### `frontend/src/pages/MentorApprovals.js` / `MentorApprovals.css`
Central mentor review screen for pending submissions, feedback, approval, and rejection.

### `frontend/src/pages/AdminPage.js` / `AdminPage.css`
Admin dashboard and links to management areas.

### `frontend/src/pages/AdminPhases.js` / `AdminPhases.css`
Create, edit, delete, order, and configure dynamic phases, including starting and ending phase flags.

### `frontend/src/pages/AdminSubPhases.js` / `AdminSubPhases.css`
Create, edit, delete, and reorder sub-phases and configure their requirements.

### `frontend/src/pages/AdminQuestions.js` / `AdminQuestions.css`
Manage quiz questions associated with learning phases.

### `frontend/src/pages/AdminUsers.js` / `AdminUsers.css`
Manage users, roles, houses, and student account information.

### `frontend/src/pages/AdminHouses.js`
Manage houses and student grouping.

### `frontend/src/pages/AdminAnnouncements.js`
Create and manage announcements.

### `frontend/src/pages/AdminAnalytics.js` / `AdminAnalytics.css`
Charts and metrics for users, houses, progress, phases, approvals, and activity.

### `frontend/src/pages/AdminAuditLogs.js` / `AdminAuditLogs.css`
Admin-only audit-log viewer.

## 12. Frontend Assistant

### `frontend/src/pages/AssistantPage.js`
The browser assistant experience. It supports four modes:

- **STS**: speech input, AI response, optional spoken output.
- **STT**: speech input and transcript only.
- **TTS**: typed input and spoken AI response.
- **TTT**: typed input and text-only AI response.

It manages microphone recording, sends audio to the STT service, sends transcribed or typed text to chat, requests TTS audio when enabled, plays audio, stops speech, replays the latest response, clears the conversation, and displays status messages.

The assistant uses the STS backend directly at `http://localhost:8001` for `/api/stt/`, `/api/chat/`, and `/api/tts/`.

### `frontend/src/pages/AssistantPage.css`
Responsive assistant workspace styling: mode tabs, conversation bubbles, recording controls, status cards, text composer, responsive mobile layout, and voice-control states.

## 13. STS Assistant Backend

Location: `sts-assistant/backend`

This is a separate FastAPI application. It is not the PhaseTracker Express backend.

### `sts-assistant/backend/.env`
Private assistant configuration. It contains the Groq API key and frontend URL. The service also reads the PhaseTracker Mongo URI from the PhaseTracker backend `.env` by default. Do not expose either environment file.

Recommended deployment variables:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `FRONTEND_URL`
- `PHASETRACKER_MONGO_URI`
- `PHASETRACKER_MONGO_DB`
- `PHASETRACKER_ENV_FILE`

### `sts-assistant/backend/requirements.txt`
Python dependencies for FastAPI, Uvicorn, dotenv loading, Groq, speech recognition, gTTS, multipart forms, HTTP, Pydantic, and PyMongo.

### `sts-assistant/backend/main.py`
FastAPI entry point. It loads environment variables, configures CORS, registers chat/STT/TTS routers, and exposes root and health endpoints.

### `sts-assistant/backend/routes/__init__.py`
Python package marker for route modules.

### `sts-assistant/backend/routes/chat.py`
Chat API contract:

- `POST /api/chat/`
- Accepts `text` with a maximum length of 2,000 characters.
- Accepts up to 12 previous conversation messages.
- Validates message roles as `user` or `assistant`.
- Calls the Groq-backed chat service.
- Returns `{ success: true, response: "..." }`.
- Returns development details for provider failures and a generic production error.

### `sts-assistant/backend/routes/stt.py`
Speech-to-text API. It accepts uploaded audio and delegates transcription to the STT service.

### `sts-assistant/backend/routes/tts.py`
Text-to-speech API. It accepts text and returns generated audio bytes for browser playback.

### `sts-assistant/backend/services/chat_service.py`
LLM orchestration layer. It:

- Creates the Groq client from `GROQ_API_KEY`.
- Loads a PhaseTracker-focused system prompt.
- Adds bounded conversation history.
- Adds live MongoDB curriculum context.
- Requests a response from the configured Groq model.
- Retries empty completions once.
- Removes markdown decoration so output sounds natural in chat and speech.
- Returns a safe fallback if the provider returns no text.

The service intentionally does not hardcode answers. Groq generates the answer using the live curriculum context.

### `sts-assistant/backend/services/curriculum_service.py`
MongoDB retrieval layer. It:

- Reads the PhaseTracker Mongo URI from an explicit environment variable or the PhaseTracker `.env` file.
- Uses the `test` database by default because that is the current database selected by the existing PhaseTracker Mongo URI.
- Reads only public curriculum fields from `phases` and `subphases`.
- Groups sub-phases under their phases.
- Caches curriculum data for 60 seconds.
- Builds a compact phase index for overview questions.
- Adds detailed phase/project/sub-phase content for topic and project questions.
- Includes starting and ending phase markers.
- Fails gracefully if MongoDB is temporarily unavailable.

It does not read student progress, passwords, JWT secrets, mentor feedback, or private account data.

### `sts-assistant/backend/services/stt_service.py`
Speech-to-text implementation used by the STT route. It converts uploaded speech into text using the configured speech recognition service.

### `sts-assistant/backend/services/tts_service.py`
Text-to-speech implementation used by the TTS route. It turns generated text into audio bytes.

### `sts-assistant/backend/services/__init__.py`
Python package marker for service modules.

### `sts-assistant/backend/.gitignore`
Excludes Python environments, caches, local configuration, and generated files.

## 14. API and Runtime Map

### PhaseTracker Express API: `http://localhost:5000`

- `/api/auth`: registration, login, password reset.
- `/api/phases`: public dynamic phases.
- `/api/progress`: student progress.
- `/api/quiz`: questions and quiz submissions.
- `/api/subphases`: sub-phase and approval workflow.
- `/api/admin`: administrative operations.
- `/api/analytics`: metrics.
- `/api/houses`: house management.
- `/api/announcements`: announcements.
- `/api/uploads`: file uploads.

### STS FastAPI: `http://localhost:8001`

- `/`: service status.
- `/api/health`: health check.
- `/api/stt/`: speech-to-text.
- `/api/chat/`: Groq chat with Mongo curriculum context.
- `/api/tts/`: text-to-speech.
- `/docs`: FastAPI-generated API documentation.

## 15. Data Flow for a Student

1. A student registers through `RegisterPage.js`.
2. `auth.js` creates the account and initializes phase progress.
3. `DashboardPage.js` loads phases and progress.
4. The student opens `StudentPhaseDetail.js`.
5. The student works through ordered sub-phases.
6. A submission is created through `subphases.js`.
7. `MentorApprovals.js` lets a mentor review the work.
8. Approval updates `Progress.js` and unlocks the next sub-phase.
9. Completing all sub-phases enables a reflection.
10. Reflection approval completes the phase and unlocks the next configured phase.

## 16. Data Flow for the Assistant

1. `AssistantPage.js` records microphone audio or accepts typed text.
2. STT mode sends audio to `/api/stt/`.
3. The returned transcript is sent to `/api/chat/`.
4. `chat.py` validates the request.
5. `chat_service.py` loads recent conversation context.
6. `curriculum_service.py` reads public phases and sub-phases from MongoDB.
7. Groq receives the system instructions, curriculum context, recent conversation, and current question.
8. The response is normalized to plain text.
9. TTS mode sends the response to `/api/tts/`.
10. The browser plays the returned audio unless voice output is disabled.

## 17. Setup

### PhaseTracker

```powershell
cd C:\Users\navgurukul\Desktop\phasetracker\backend
npm install
npm run dev
```

In another terminal:

```powershell
cd C:\Users\navgurukul\Desktop\phasetracker\frontend
npm install
npm start
```

### STS Assistant

Use the configured Conda environment because it contains the working Uvicorn and Groq dependencies:

```powershell
cd C:\Users\navgurukul\Desktop\sts-assistant\backend
C:\Users\navgurukul\anaconda3\envs\sts-assistant\python.exe -m uvicorn main:app --port 8001
```

Open the frontend at `http://localhost:3000/assistant`.

## 18. Files Intentionally Excluded from This Reference

- `node_modules/`: installed JavaScript dependencies.
- `frontend/build/`: generated production bundle.
- `backend/uploads/`: uploaded user/project assets; contents are data, not application source.
- Python `venv/`: installed Python environment.
- Python `__pycache__/`: generated bytecode.
- `.env` files: private secrets and environment configuration.
- Lockfiles are documented but their individual generated dependency entries are not explained one by one.

## 19. Current Operational Notes

- The PhaseTracker backend and STS backend are separate processes.
- The frontend assistant must use port `8001` for STT, chat, and TTS.
- The current Mongo curriculum database is `test`; set `PHASETRACKER_MONGO_DB` explicitly in deployment if the database name changes.
- The assistant reads public curriculum metadata only. Student-specific progress is not currently supplied to the LLM.
- Groq model output can vary. The service retries empty completions and normalizes formatting, but provider availability and model quality remain external dependencies.
- Production should add authentication and rate limiting to the STS service before exposing it publicly.

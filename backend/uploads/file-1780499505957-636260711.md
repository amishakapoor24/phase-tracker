# PhaseTracker - Approval Workflow Implementation Guide

## Overview
The approval workflow system is now fully functional! Students can request approval for completing sub-phases, mentors can review and approve/reject those requests, and the system automatically unlocks next phases and sends reflections when appropriate.

---

## System Architecture

### Role-Based Access
- **Students**: View phases, submit sub-phase completion requests, submit reflections, see approval status
- **Mentors/Admins**: Manage phases, create sub-phases, manage questions, review and approve student requests, approve reflections

---

## User Workflows

### For Students

#### 1. Starting a Phase
1. Click "Dashboard" in navbar
2. See learning path with all phases (locked/unlocked/completed)
3. Click "Sub-phases →" button on an unlocked phase

#### 2. Submitting Sub-Phase Completion
1. View all sub-phases for the phase (ordered sequentially)
2. Sub-phases are locked until previous one is completed
3. First sub-phase is always unlocked
4. Click "Submit Completion" button on an unlocked sub-phase
5. Modal appears with:
   - Sub-phase title and description
   - Optional message textarea for what they learned
6. Click "Submit for Approval" 
7. Status changes to "⏳ Awaiting Approval"
8. Wait for mentor approval

#### 3. Reflection Workflow
1. When all sub-phases are completed, "Phase Reflection" card appears
2. Click "Start Reflection" button
3. Modal appears for writing reflection
4. Submit reflection
5. Shows "Awaiting Approval" status
6. Once mentor approves, see "✨ Phase Complete!" message

#### 4. Progress Tracking
- Each sub-phase shows status: 🔒 Locked | ⏳ Awaiting Approval | ✓ Completed
- Order number shows pending count or checkmark
- Color-coded by status (blue=unlocked, orange=pending, green=completed)

---

### For Mentors/Admins

#### 1. Managing Phases
1. Go to **Dashboard** → click "Manage Phases" card or "Manage Phases" in navbar
2. See all phases in table with Edit/Delete buttons
3. Click "Add Phase" to create new
4. After creating phase, option card appears with:
   - "Add Sub-Phases" → takes to sub-phase management
   - "Add Questions" → takes to question management  
   - "Create Another Phase" → resets form
   - "Back to Dashboard" → returns to admin home

#### 2. Managing Sub-Phases
1. From phase list, click "📋 Manage Sub-Phases" button
2. See form for creating new sub-phase with:
   - Sub-Phase ID (unique, lowercase, immutable)
   - Title
   - Description
   - Order (sequence number)
3. After creating, get success card with options:
   - "Add Another Sub-Phase"
   - "Back to Phases"
4. Table shows all sub-phases with Edit/Delete buttons

#### 3. Reviewing Approval Requests
1. Go to **Approvals** link in navbar or click "Approvals" card on dashboard
2. See all approval requests with filters:
   - "All" - shows all requests
   - "Pending" - shows only awaiting approval
3. Each request shows:
   - Student name with house emoji (🦁/🌸/🌊)
   - Student email and house name
   - Request type (📝 Sub-Phase or 📌 Reflection)
   - Phase and sub-phase info
   - Student's submission message
   - Status badge (pending/approved/rejected)

#### 4. Approving/Rejecting Requests
1. Click on an approval card to open modal
2. Modal shows:
   - Student details
   - Request type, phase, sub-phase
   - Student's message
   - Textarea for feedback/message
3. Choose "✓ Approve" or "✕ Reject"
4. Request list updates immediately
5. Student's progress updates automatically:
   - On sub-phase approve: Next sub-phase unlocks
   - On reflection approve: Phase marked complete, next phase unlocks

#### 5. Managing Questions
1. Go to **Dashboard** → click "Manage Questions" or "Manage Questions" in navbar
2. Select phase from dropdown
3. Create questions with 4 options and radio button for correct answer
4. View all questions for phase with success card after each creation

---

## Backend API Endpoints

### Sub-Phases CRUD (Admin Only)
```
GET    /api/subphases/phases/:phaseId/subphases
POST   /api/subphases/phases/:phaseId/subphases
PUT    /api/subphases/:subPhaseId
DELETE /api/subphases/:subPhaseId
```

### Approval Workflow (Student)
```
POST /api/subphases/approval-request
  {
    phaseId: string,
    subPhaseId: string,
    type: 'subphase',
    submissionMessage: string (optional)
  }

POST /api/subphases/reflection-request
  {
    phaseId: string,
    submissionMessage: string (optional)
  }
```

### Approval Review (Mentor Only)
```
GET  /api/subphases/approval-requests/pending

POST /api/subphases/approval-request/:requestId/respond
  {
    approve: boolean,
    approvalMessage: string (optional)
  }

POST /api/subphases/reflection-request/:requestId/approve
  {
    approve: boolean,
    approvalMessage: string (optional)
  }
```

### Progress (Student)
```
GET /api/progress/my-progress
  Returns user's progress with:
  - phases: array with phaseId, status, subPhases, reflectionStatus
  - subPhases: array with subPhaseId, status, approvalRequested, approvalStatus
```

---

## Database Models

### SubPhase
```javascript
{
  phaseId: string,
  id: string (unique, lowercase),
  title: string,
  description: string,
  order: number,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### ApprovalRequest
```javascript
{
  student: ObjectId (User),
  phaseId: string,
  subPhaseId: string,
  type: 'subphase' | 'reflection',
  status: 'pending' | 'approved' | 'rejected',
  submissionMessage: string,
  approvalMessage: string,
  approvedBy: ObjectId (User),
  approvedAt: Date,
  createdAt: Date
}
```

### Progress (Updated)
```javascript
{
  user: ObjectId,
  phases: [{
    phaseId: string,
    status: 'locked' | 'unlocked' | 'reflection-ready' | 'completed',
    subPhases: [{
      subPhaseId: string,
      status: 'locked' | 'unlocked' | 'completed',
      approvalRequested: boolean,
      approvalStatus: 'pending' | 'approved' | 'rejected',
      completedAt: Date
    }],
    reflectionStatus: 'not-ready' | 'ready-for-review' | 'approved' | 'rejected',
    attempts: array,
    bestScore: number,
    unlockedAt: Date,
    completedAt: Date
  }],
  currentPhase: string,
  totalScore: number,
  updatedAt: Date
}
```

---

## Frontend Routes

### Public Routes
```
/                          - HomePage
/login                     - LoginPage
/register                  - RegisterPage
```

### Student Routes (Protected)
```
/dashboard                 - DashboardPage (with phase cards, quiz buttons, sub-phase buttons)
/phase/:phaseId           - StudentPhaseDetail (approval workflow UI)
/quiz/:phaseId            - QuizPage
/result/:phaseId          - ResultPage
```

### Admin/Mentor Routes (Protected)
```
/admin                         - AdminPage (dashboard with 4 cards)
/admin/phases                  - AdminPhases (phase CRUD with sub-phase link)
/admin/subphases/:phaseId     - AdminSubPhases (sub-phase CRUD)
/admin/questions              - AdminQuestions (question CRUD)
/admin/approvals              - MentorApprovals (approval dashboard)
```

---

## Frontend Components

### Student-Facing
- **StudentPhaseDetail.js** - Shows sub-phases with approval workflow
- **DashboardPage.js** - Updated with sub-phase navigation button

### Admin/Mentor-Facing
- **AdminPage.js** - Dashboard with 4 action cards (Phases, Questions, Approvals, Student Progress)
- **AdminPhases.js** - Phase CRUD with sub-phase management link
- **AdminSubPhases.js** - Sub-phase CRUD interface
- **MentorApprovals.js** - Approval request dashboard with review modal
- **Navbar.js** - Updated with "Approvals" link for mentors

---

## Key Features Implemented

✅ **Multi-Stage Approval**: Students submit → Mentors review → Auto-unlock next sub-phase  
✅ **Reflection Workflow**: All sub-phases complete → Reflection option unlocks → Mentor approves → Next phase unlocks  
✅ **Progress Tracking**: Real-time status updates with color-coded indicators  
✅ **Role-Based Access**: Different UIs for students/mentors  
✅ **Sequential Unlocking**: Phases unlock automatically based on completion  
✅ **Status Management**: Automatic transitions (pending → approved → completed)  
✅ **House System**: Students grouped by house with visual indicators  
✅ **Mentor Dashboard**: Centralized place to manage all requests  

---

## Next Steps (Optional Enhancements)

1. **Email Notifications**
   - Setup nodemailer
   - Send emails on approval/rejection
   - Email templates for different scenarios

2. **Timeline View**
   - Show student's completion timeline
   - Visual representation of approval status

3. **Approval Analytics**
   - Track average approval time
   - Show mentor workload
   - Rejection reasons report

4. **Student Feedback Loop**
   - Show mentor's feedback on rejected submissions
   - Option for students to resubmit

---

## Testing the Workflow

### Setup
1. Register as Student (choose a house)
2. Register as Mentor
3. Login as Mentor and create phases
4. Create sub-phases for each phase
5. Create questions for phase

### Testing Flow
1. Login as Student
2. Go to Dashboard
3. Click "Sub-phases →" on first phase
4. Submit first sub-phase with message
5. Login as Mentor
6. Go to Approvals
7. Approve the request
8. Logout and login as Student
9. Verify sub-phase status changed to "✓ Completed"
10. Next sub-phase should now be "Unlocked"
11. Continue until all sub-phases done
12. Should see "Phase Reflection" card
13. Submit reflection
14. Login as Mentor
15. Approve reflection
16. Verify phase shows "✓ Completed" and next phase unlocks

---

## Troubleshooting

### Sub-phases not showing
- Ensure admin has created sub-phases for the phase
- Check `/api/subphases/phases/:phaseId/subphases` endpoint

### Approvals not appearing
- Ensure student has submitted approval request
- Check network tab for POST `/api/subphases/approval-request`

### Progress not updating
- Verify mentor clicked "Approve" button
- Check Progress document in MongoDB for user

### Next phase not unlocking
- Ensure reflection is approved (not just submitted)
- Check that this is last sub-phase of phase

---

## File Structure

```
backend/
  models/
    SubPhase.js          (NEW)
    ApprovalRequest.js   (NEW)
    Progress.js          (UPDATED)
  routes/
    subphases.js         (NEW) - All approval workflow endpoints
    progress.js          (UPDATED) - Added /my-progress
    auth.js, phases.js, quiz.js, admin.js

frontend/
  pages/
    StudentPhaseDetail.js        (NEW) - Student approval UI
    MentorApprovals.js           (NEW) - Mentor dashboard
    AdminSubPhases.js            (NEW) - Sub-phase CRUD
    AdminPhases.js               (UPDATED) - Added sub-phase link
    AdminPage.js                 (UPDATED) - Added Approvals card
    DashboardPage.js             (UPDATED) - Added sub-phase button
  components/
    Navbar.js                    (UPDATED) - Added Approvals link
```

---

This workflow system is production-ready! All features are implemented and tested.

# Quick Start Testing Guide

## Step 1: Start the Application

### Backend
```bash
cd backend
npm install  # if not done
npm run dev
```

### Frontend
```bash
cd frontend
npm install  # if not done
npm start
```

---

## Step 2: Create Test Data

### Register Users

**Register Student 1**
- URL: http://localhost:3000/register
- Name: Arjun Sharma
- Email: arjun@test.com
- Password: test123
- Role: Student
- House: Bhairav 🦁
- Click Register

**Register Mentor**
- URL: http://localhost:3000/register
- Name: Priya Mentors
- Email: priya@test.com
- Password: test123
- Role: Mentor
- Click Register

---

## Step 3: Create Learning Content (Mentor Login)

### Login as Mentor
1. http://localhost:3000/login
2. Email: priya@test.com
3. Password: test123
4. Click Login

### Create Phases
1. Click "Manage Phases" in navbar
2. Click "✕ Cancel" or "✕ New Phase"
3. Click "+ New Phase"
4. Fill form:
   - Phase ID: `web101`
   - Phase Name: `Web Fundamentals`
   - Description: `Learn web development basics`
   - Icon: `🌐`
   - Order: `1`
5. Click "Create Phase"
6. On success card, click "➕ Add Sub-Phases"

### Create Sub-Phases
1. Fill sub-phase form:
   - ID: `intro`
   - Title: `Introduction to Web`
   - Description: `Learn what the web is and how it works`
   - Order: `1`
2. Click "Create Sub-Phase"
3. On success card, click "➕ Add Another Sub-Phase"
4. Repeat for more sub-phases:
   - ID: `basics`, Title: `HTML Basics`, Order: `2`
   - ID: `advanced`, Title: `Advanced Concepts`, Order: `3`
5. Click "⬅ Back to Phases"

### Add Questions
1. Click "Manage Questions" in navbar
2. Select "Web Fundamentals" from phase dropdown
3. Fill question form:
   - Question: `What does HTML stand for?`
   - Options: 
     - `Hyper Text Markup Language`
     - `High Tech Markup Language`
     - `Home Tool Markup Language`
     - `Hyper Tool Markup Language`
   - Correct: First option (radio button)
4. Click "Create Question"
5. Add more questions for practice

---

## Step 4: Test Student Workflow

### Login as Student
1. Logout from mentor account
2. http://localhost:3000/login
3. Email: arjun@test.com
4. Password: test123
5. Click Login

### View Dashboard
1. You should see dashboard with phase "Web Fundamentals"
2. See stat cards: Completed: 0, Remaining: 1, etc.
3. See phase card for "Web Fundamentals"
4. Phase has two buttons:
   - "Quiz →" (takes to quiz)
   - "Sub-phases →" (takes to approval workflow)

### Start Sub-Phase Workflow
1. Click "Sub-phases →" button
2. See phase title "🌐 Web Fundamentals"
3. See all sub-phases in grid:
   - "1 Introduction to Web" - Badge: "Unlocked" (blue)
   - "2 HTML Basics" - Badge: "Locked" (gray)
   - "3 Advanced Concepts" - Badge: "Locked" (gray)

### Submit First Sub-Phase
1. Click "Submit Completion" on first sub-phase
2. Modal opens with:
   - Sub-phase title
   - Description
   - Textarea for optional message
3. Type message: `I learned what HTML is and how to structure documents`
4. Click "✓ Submit for Approval"
5. Modal closes
6. First sub-phase now shows status: "⏳ Awaiting Approval"

---

## Step 5: Test Mentor Approval

### Login as Mentor
1. Logout from student
2. http://localhost:3000/login
3. Email: priya@test.com
4. Password: test123

### Review Approval Requests
1. Click "Approvals" in navbar
2. See "📋 Approval Requests" page
3. See the request card:
   - Student: "Arjun Sharma"
   - House: "🦁 Bhairav"
   - Type: "📝 Sub-Phase"
   - Phase: "web101"
   - Sub-Phase: "intro"
   - Status: "pending" (orange badge)

### Approve Request
1. Click on the approval card
2. Modal opens with:
   - Student details (name, email, house)
   - Request type, phase, sub-phase
   - Student's message: "I learned what HTML is..."
   - Textarea for feedback
3. Type feedback: `Great work! Your understanding is clear. Approved!`
4. Click "✓ Approve" button
5. Modal closes
6. Request list updates - status changes to "approved" (green)

---

## Step 6: Verify Auto-Unlock

### Login as Student
1. Logout from mentor
2. Login as student again
3. Go to Dashboard
4. Click "Sub-phases →"
5. Verify:
   - First sub-phase: "✓ Completed" (green badge)
   - Second sub-phase: Now shows "Unlocked" (blue badge) instead of "Locked"
   - Can now click "Submit Completion" on second sub-phase

---

## Step 7: Test Reflection Workflow

### Submit All Remaining Sub-Phases
1. Click "Submit Completion" on second sub-phase
2. Add message and submit
3. Login as mentor, approve it
4. Return to student, refresh page
5. Click "Sub-phases →" again
6. Third sub-phase should now be unlocked
7. Submit it too
8. Mentor approves

### View Reflection Card
1. As student, go to Dashboard
2. Click "Sub-phases →"
3. All sub-phases show "✓ Completed"
4. Below sub-phases, see "Phase Reflection" card:
   - "🎯 Phase Reflection"
   - "Congratulations! You've completed all sub-phases. Now reflect on what you've learned."
   - "Start Reflection" button

### Submit Reflection
1. Click "Start Reflection"
2. Modal opens:
   - Title: "Phase Reflection: Web Fundamentals"
   - Large textarea for reflection
   - Instructions about what to write
3. Type reflection:
   ```
   Through this phase, I learned the fundamentals of web development.
   I understand how HTML structures content, and I can now create
   basic web pages. The most challenging part was understanding
   semantic HTML, but it makes sense now. I'm excited to learn CSS next!
   ```
4. Click "✓ Submit Reflection"
5. Message: "✓ Reflection request submitted! Waiting for mentor approval."

### Mentor Approves Reflection
1. Login as mentor
2. Go to Approvals
3. See new request:
   - Type: "📌 Reflection"
   - Phase: "web101"
   - Same student
4. Click to open modal
5. See student's reflection
6. Add feedback: `Excellent reflection! You've clearly understood the concepts. Phase approved!`
7. Click "✓ Approve"

### See Completion Message
1. Login as student
2. Go to Dashboard
3. Click "Sub-phases →"
4. See message:
   - "✨ Phase Complete!"
   - "Your reflection has been approved. The next phase will be unlocked soon."
5. Go back to dashboard
6. Phase card should now show:
   - Badge: "✓ Passed"
   - "Retake quiz" button instead of "Start quiz"

---

## Testing Checklist

- [x] Phases created by mentor
- [x] Sub-phases created for phase
- [x] Questions created for phase
- [x] Student can see unlocked phases
- [x] Student can submit first sub-phase
- [x] Mentor can see approval request
- [x] Mentor can approve request
- [x] Student sees "✓ Completed" after approval
- [x] Next sub-phase auto-unlocks
- [x] After all sub-phases, reflection option appears
- [x] Student can submit reflection
- [x] Mentor can approve reflection
- [x] Phase shows as "✓ Passed"
- [x] Next phase unlocks (if created)

---

## Useful URLs

| Page | URL | User |
|------|-----|------|
| Home | http://localhost:3000 | Any |
| Register | http://localhost:3000/register | Any |
| Login | http://localhost:3000/login | Any |
| Dashboard | http://localhost:3000/dashboard | Student |
| Sub-Phases | http://localhost:3000/phase/web101 | Student |
| Quiz | http://localhost:3000/quiz/web101 | Student |
| Admin | http://localhost:3000/admin | Mentor |
| Phases | http://localhost:3000/admin/phases | Mentor |
| Sub-Phases | http://localhost:3000/admin/subphases/web101 | Mentor |
| Questions | http://localhost:3000/admin/questions | Mentor |
| Approvals | http://localhost:3000/admin/approvals | Mentor |

---

## API Testing (with curl)

### Create Phase
```bash
curl -X POST http://localhost:5000/api/admin/phases \
  -H "Authorization: Bearer YOUR_MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "web101",
    "name": "Web Fundamentals",
    "description": "Learn web dev",
    "icon": "🌐",
    "color": "#FF6B6B",
    "bg": "#FFE5E5",
    "order": 1
  }'
```

### Create Sub-Phase
```bash
curl -X POST http://localhost:5000/api/subphases/phases/web101/subphases \
  -H "Authorization: Bearer YOUR_MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "intro",
    "title": "Introduction",
    "description": "Learn intro",
    "order": 1
  }'
```

### Submit Approval Request
```bash
curl -X POST http://localhost:5000/api/subphases/approval-request \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phaseId": "web101",
    "subPhaseId": "intro",
    "type": "subphase",
    "submissionMessage": "I learned the basics"
  }'
```

### Get Pending Approvals
```bash
curl -X GET http://localhost:5000/api/subphases/approval-requests/pending \
  -H "Authorization: Bearer YOUR_MENTOR_TOKEN"
```

---

Enjoy testing! 🎉

# PhaseTracker Quick Reference Card

## 🚀 Quick Start

### Start Backend
```bash
cd backend && npm run dev
```

### Start Frontend
```bash
cd frontend && npm start
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: Check `.env` for connection string

---

## 👥 User Types & Access

| User Type | Can Do | Routes |
|-----------|--------|--------|
| **Student** | View phases, submit sub-phases, submit reflections | `/dashboard`, `/phase/:id` |
| **Mentor** | Manage phases, manage sub-phases, approve requests | `/admin`, `/admin/approvals` |
| **Admin** | All mentor features + system administration | `/admin/*` |

---

## 📚 Phase Hierarchy

```
Phase (e.g., "Web Fundamentals")
├── Sub-Phase 1 (e.g., "Introduction")
│   └── Status: Unlocked / Locked / Completed
├── Sub-Phase 2 (e.g., "HTML Basics")
│   └── Status: Unlocked / Locked / Completed
└── Sub-Phase 3 (e.g., "Advanced")
    └── Status: Unlocked / Locked / Completed
```

---

## 🔄 Student Workflow

```
1. Login → Dashboard
2. Click "Sub-phases →"
3. Submit first sub-phase
4. Wait for mentor approval ⏳
5. See "✓ Completed" badge
6. Next sub-phase unlocks 🔓
7. Repeat for all sub-phases
8. See "Phase Reflection" card
9. Submit reflection
10. Wait for mentor approval ⏳
11. See "✨ Phase Complete!"
12. Next phase unlocks 🎯
```

---

## ✅ Mentor Workflow

```
1. Login → Navbar "Approvals" or Dashboard
2. See all pending requests
3. Click request to open modal
4. Read student's message
5. Type feedback (optional)
6. Click "✓ Approve" or "✕ Reject"
7. View updates immediately
8. Student's progress auto-updates
```

---

## 🎯 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Student Sub-Phase UI | `StudentPhaseDetail.js` | Submit and track sub-phase completion |
| Mentor Dashboard | `MentorApprovals.js` | Review and approve requests |
| Admin Sub-Phases | `AdminSubPhases.js` | Create and manage sub-phases |
| Dashboard | `DashboardPage.js` | Show phases with sub-phase button |

---

## 🔌 Main API Endpoints

### Student Endpoints
```
POST /api/subphases/approval-request
  → Submit sub-phase for approval
  
POST /api/subphases/reflection-request
  → Submit phase reflection

GET /api/progress/my-progress
  → Get my progress data
```

### Mentor Endpoints
```
GET /api/subphases/approval-requests/pending
  → View all pending requests
  
POST /api/subphases/approval-request/:id/respond
  → Approve or reject sub-phase request
  
POST /api/subphases/reflection-request/:id/approve
  → Approve reflection
```

### Admin Endpoints
```
POST /api/subphases/phases/:phaseId/subphases
  → Create sub-phase
  
PUT /api/subphases/:subPhaseId
  → Update sub-phase
  
DELETE /api/subphases/:subPhaseId
  → Delete sub-phase
```

---

## 🎨 Status Colors

| Status | Color | Emoji | Meaning |
|--------|-------|-------|---------|
| Completed | 🟢 Green | ✓ | Done and approved |
| Awaiting Approval | 🟠 Orange | ⏳ | Submitted, waiting for mentor |
| Unlocked | 🔵 Blue | 🔓 | Ready to submit |
| Locked | ⚪ Gray | 🔒 | Waiting for previous to complete |

---

## 📊 Data Models

### SubPhase
- `phaseId` - Which phase it belongs to
- `id` - Unique identifier
- `title` - Display name
- `description` - What students learn
- `order` - Sequence number

### ApprovalRequest
- `student` - Which student requested
- `phaseId` - Which phase
- `subPhaseId` - Which sub-phase
- `type` - "subphase" or "reflection"
- `status` - "pending", "approved", or "rejected"
- `submissionMessage` - What student wrote
- `approvalMessage` - What mentor wrote

### Progress
- `phases[].subPhases[]` - Array of sub-phases
- `phases[].reflectionStatus` - Reflection state
- `phases[].status` - Phase status

---

## 🔐 Authentication

**How it works:**
1. User registers with role (student/mentor/admin)
2. Login creates JWT token
3. Token stored in localStorage as `pt_user`
4. Token sent in `Authorization: Bearer <token>` header
5. Middleware checks token and attaches user to request

**Token expires:** 30 days

---

## 🧪 Testing Checklist

- [ ] Can create phases
- [ ] Can create sub-phases
- [ ] Student can submit sub-phase
- [ ] Mentor can see approval request
- [ ] Mentor can approve request
- [ ] Sub-phase shows as completed
- [ ] Next sub-phase unlocks
- [ ] All sub-phases complete = reflection card shows
- [ ] Student can submit reflection
- [ ] Mentor can approve reflection
- [ ] Phase shows as completed

---

## 🐛 Debugging Tips

**Network Issues:**
- Open DevTools (F12) → Network tab
- Check request/response
- Look for HTTP status codes (200 = good, 4xx/5xx = error)

**State Issues:**
- React DevTools extension
- Check localStorage (`pt_user`)
- Check console for JavaScript errors

**Database Issues:**
- Check MongoDB Atlas console
- Verify connection string in `.env`
- Check network access (IP whitelist)

**Code Changes:**
- Save files (Ctrl+S)
- Backend auto-reloads with nodemon
- Frontend auto-reloads with Create React App
- Refresh browser if stuck

---

## 📁 Project Structure

```
phasetracker/
├── backend/
│   ├── models/
│   │   ├── SubPhase.js (NEW)
│   │   ├── ApprovalRequest.js (NEW)
│   │   └── Progress.js (UPDATED)
│   ├── routes/
│   │   ├── subphases.js (NEW)
│   │   └── progress.js (UPDATED)
│   └── server.js (UPDATED)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── StudentPhaseDetail.js (NEW)
│       │   ├── AdminSubPhases.js (NEW)
│       │   ├── MentorApprovals.js (NEW)
│       │   └── [other pages] (UPDATED)
│       └── App.js (UPDATED with new routes)
│
├── IMPLEMENTATION_GUIDE.md (NEW)
├── TESTING_GUIDE.md (NEW)
└── COMPLETION_SUMMARY.md (NEW)
```

---

## 💡 Pro Tips

1. **Before testing:** Make sure backend is running (`npm run dev`)
2. **House system:** Students grouped by 🦁 Bhairav, 🌸 Bhageshree, 🌊 Malhar
3. **First phase:** Always unlocked for students
4. **Approval flow:** Is one-way (can't revert approval)
5. **Reflection:** Only appears when ALL sub-phases are completed
6. **Next phase:** Auto-unlocks after reflection approval
7. **Permissions:** Check role before allowing actions
8. **Error messages:** Show in alerts or console logs

---

## 🆘 Quick Fixes

**Page not loading?**
- Check if backend is running: `curl http://localhost:5000`
- Refresh page (Ctrl+R)
- Clear browser cache (Ctrl+Shift+Delete)

**Button not working?**
- Check console for errors (F12)
- Make sure you have permission (right role)
- Check network tab to see API response

**Data not saving?**
- Check MongoDB connection in backend logs
- Verify `.env` has correct `MONGO_URI`
- Check backend error logs

**Styles look broken?**
- Restart frontend: `npm start`
- Clear CSS cache: Ctrl+Shift+R
- Check if CSS file exists and imports properly

---

## 📞 Reference

**Documentation Files:**
- `IMPLEMENTATION_GUIDE.md` - Full system documentation
- `TESTING_GUIDE.md` - Step-by-step testing instructions
- `COMPLETION_SUMMARY.md` - Project completion summary
- This file - Quick reference

**Key Files to Edit:**
- Backend routes: `backend/routes/subphases.js`
- Student UI: `frontend/src/pages/StudentPhaseDetail.js`
- Mentor UI: `frontend/src/pages/MentorApprovals.js`
- Routes: `frontend/src/App.js`
- Navbar: `frontend/src/components/Navbar.js`

---

## ✨ Success!

You now have a production-ready approval workflow system! 

Start with the TESTING_GUIDE.md for hands-on walkthrough. 🚀

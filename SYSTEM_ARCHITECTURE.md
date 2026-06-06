# 🏗️ PhaseTracker - Complete System Architecture

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PhaseTracker MERN LMS                       │
│                      Version 2.0 Enhanced                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
            FRONTEND      BACKEND       DATABASE
            (React)      (Node.js)      (MongoDB)
```

---

## 📱 Frontend Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│                   (localhost:3000)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐      ┌─────────────┐               │
│  │ Auth Context   │─────→│ Global      │               │
│  │ (AuthContext)  │      │ State       │               │
│  └────────────────┘      └─────────────┘               │
│         △                       │                       │
│         │                       │                       │
│  ┌──────┴────────┐       ┌──────┴──────────┐           │
│  │               │       │                 │           │
│  │ Pages         │       │ Components      │           │
│  │ ───────────   │       │ ───────────────│           │
│  │ •Login        │       │ • Navbar       │           │
│  │ •Register     │       │ • PrivateRoute│           │
│  │ •Dashboard    │       │ • AdminRoute   │           │
│  │ •SubPhaseDetail       │ • Modals       │           │
│  │ •MentorApprovals      │               │           │
│  │ •AdminAnalytics       │               │           │
│  │ •QuizPage     │       │               │           │
│  └────────────────┘      └─────────────────┘          │
│         │                       │                       │
│  ┌──────┴──────────────────────┴──────────┐            │
│  │          Axios Interceptor             │            │
│  │  (Auto token, error handling)          │            │
│  └───────────┬──────────────────────────┬─┘            │
│              │      API Calls           │              │
│              │   (Bearer Token)         │              │
│  ┌───────────┴──────────────────────────┴────┐         │
│  │            Utils Layer                    │         │
│  │ ────────────────────────────────────────  │         │
│  │ • axiosConfig.js    (API interceptor)    │         │
│  │ • validation.js     (Joi client-side)    │         │
│  │ • dateUtils.js      (Day.js helpers)     │         │
│  └──────────────┬───────────────────────────┘          │
│                 │                                       │
│  ┌──────────────┴──────────────────────────┐           │
│  │   UI Libraries                          │           │
│  │ • React 18.2                           │           │
│  │ • React Router 6.21                    │           │
│  │ • React-Toastify (notifications)       │           │
│  │ • Recharts (optional)                  │           │
│  │ • Plain CSS                            │           │
│  └─────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────┘
```

---

## 🖥️ Backend Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Node.js Backend                            │
│                   (localhost:5000)                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │              Express.js Server                          │  │
│ │  ───────────────────────────────────────────────────    │  │
│ │  • Helmet.js (security headers)                        │  │
│ │  • CORS (localhost:3000 only)                         │  │
│ │  • Rate Limiting (100/15min)                          │  │
│ │  • Error Middleware                                   │  │
│ └──────────┬────────────────────────────────────────────┘  │
│            │                                                │
│  ┌─────────┴────────────────────────────────────────┐       │
│  │              API Routes Layer                    │       │
│  │  ────────────────────────────────────────────── │       │
│  │ POST   /api/auth/register                       │       │
│  │ POST   /api/auth/login                          │       │
│  │ GET    /api/auth/me                             │       │
│  │ GET    /api/phases                              │       │
│  │ POST   /api/subphases/approval-request          │       │
│  │ GET    /api/subphases/approval-requests/pending │       │
│  │ POST   /api/subphases/approval-request/:id/respond      │
│  │ POST   /api/subphases/reflection-request        │       │
│  │ POST   /api/subphases/reflection-request/:id/approve    │
│  │ GET    /api/analytics/overall                   │       │
│  │ GET    /api/analytics/houses                    │       │
│  │ GET    /api/analytics/phases                    │       │
│  │ GET    /api/analytics/student/:id               │       │
│  │ ... (20+ total endpoints)                       │       │
│  └─────────┬──────────────────────────────────────┘        │
│            │                                                │
│  ┌─────────┴────────────────────────────────────────┐       │
│  │          Middleware Layer                        │       │
│  │  ────────────────────────────────────────────── │       │
│  │ • auth.js (JWT verification)                   │       │
│  │ • validation.js (Joi validation)               │       │
│  │ • adminOnly (role check)                       │       │
│  │ • error (error handling)                       │       │
│  └─────────┬──────────────────────────────────────┘        │
│            │                                                │
│  ┌─────────┴────────────────────────────────────────┐       │
│  │          Services Layer                          │       │
│  │  ────────────────────────────────────────────── │       │
│  │ • emailService.js                              │       │
│  │   ├─ sendEmail()                               │       │
│  │   ├─ getStatusUpdateTemplate()                 │       │
│  │   ├─ getReflectionReadyTemplate()              │       │
│  │   └─ getWelcomeTemplate()                      │       │
│  │                                                 │       │
│  │ • analyticsService.js                          │       │
│  │   ├─ getOverallStats()                         │       │
│  │   ├─ getHouseStats()                           │       │
│  │   ├─ getPhaseStats()                           │       │
│  │   ├─ getMentorStats()                          │       │
│  │   ├─ getApprovalTimeline()                     │       │
│  │   └─ getStudentPhasePerformance()              │       │
│  └─────────┬──────────────────────────────────────┘        │
│            │                                                │
│  ┌─────────┴────────────────────────────────────────┐       │
│  │          Models Layer (Mongoose)                 │       │
│  │  ────────────────────────────────────────────── │       │
│  │ • User.js                                      │       │
│  │ • Phase.js                                     │       │
│  │ • SubPhase.js                                  │       │
│  │ • Progress.js                                  │       │
│  │ • ApprovalRequest.js                           │       │
│  │ • Question.js                                  │       │
│  │ • Notification.js                              │       │
│  │ • AuditLog.js                                  │       │
│  └──────────┬───────────────────────────────────┘         │
│             │                                              │
│  ┌──────────┴──────────────────────────────────────┐       │
│  │        External Services                        │       │
│  │  ────────────────────────────────────────────  │       │
│  │ • Nodemailer (Email - SMTP/Gmail)             │       │
│  │ • Multer + Cloudinary (File uploads)          │       │
│  │ • JWT (Authentication)                        │       │
│  │ • bcryptjs (Password hashing)                 │       │
│  │ • Joi (Validation)                            │       │
│  └──────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Architecture

```
MongoDB Collections (Atlas Cloud)
├── users
│   ├── _id
│   ├── name
│   ├── email
│   ├── password (hashed)
│   ├── role (student|mentor|admin)
│   ├── house (Bhairav|Bhageshree|Malhar)
│   ├── createdAt
│   └── updatedAt
│
├── phases
│   ├── _id
│   ├── id (unique)
│   ├── name
│   ├── description
│   ├── icon
│   ├── order
│   └── timestamps
│
├── subphases
│   ├── _id
│   ├── phaseId (reference)
│   ├── id (unique per phase)
│   ├── title
│   ├── description
│   ├── order
│   ├── createdBy (ref: User)
│   └── timestamps
│
├── progress
│   ├── _id
│   ├── user (ref: User)
│   ├── phases: [{
│   │   ├── id
│   │   ├── status (locked|unlocked|completed)
│   │   ├── subPhases: [{
│   │   │   ├── subPhaseId
│   │   │   ├── status
│   │   │   ├── approvalStatus
│   │   │   └── completedAt
│   │   ├── reflectionStatus
│   │   └── completedAt
│   └── timestamps
│
├── approval_requests
│   ├── _id
│   ├── student (ref: User)
│   ├── phaseId
│   ├── subPhaseId
│   ├── type (subphase|reflection)
│   ├── status (pending|approved|rejected)
│   ├── submissionMessage
│   ├── approvalMessage
│   ├── approvedBy (ref: User)
│   ├── approvedAt
│   └── timestamps
│
├── questions
│   ├── _id
│   ├── phaseId
│   ├── question
│   ├── options: [4 options]
│   ├── answer (index: 0-3)
│   └── timestamps
│
├── notifications
│   ├── _id
│   ├── recipient
│   ├── subject
│   ├── body (HTML)
│   ├── type
│   ├── status (sent|failed)
│   └── timestamps
│
└── audit_logs (for future)
    ├── _id
    ├── action
    ├── performedBy
    ├── timestamp
    └── metadata
```

---

## 🔄 Data Flow: Student Submission Workflow

```
┌─ STUDENT ──────────────────────┐
│                                │
│  1. View Phase                 │
│     (GET /api/phases)          │
│        ↓                        │
│  2. View Sub-Phases            │
│     (GET /api/subphases/...)   │
│        ↓                        │
│  3. Submit Work                │
│     (POST /api/subphases/      │
│      approval-request)         │
│        ↓                        │
│  Status: ⏳ Pending             │
│  Waits for approval            │
│        ↓                        │
│  4. Receives Approval Notification
│     (via Email)                │
│        ↓                        │
│  5. Checks Progress            │
│     (GET /api/progress/        │
│      my-progress)              │
│        ↓                        │
│  See: ✓ Sub-phase 1 Complete   │
│  See: 🔓 Sub-phase 2 Unlocked  │
│        ↓                        │
│  Repeat for all sub-phases     │
│        ↓                        │
│  When all done:                │
│  6. Submit Reflection          │
│     (POST /api/subphases/      │
│      reflection-request)       │
│        ↓                        │
│  7. Receive Final Approval     │
│        ↓                        │
│  ✨ Phase Complete!            │
│  🔓 Next Phase Unlocked        │
│                                │
└─────────────────────────────────┘
        │
        │ (Triggers)
        │
┌─ BACKEND ──────────────────────┐
│                                │
│  ApprovalRequest Created       │
│  (status: pending)             │
│        ↓                        │
│  Email queued                  │
│  (Send to Mentor)              │
│        ↓                        │
│  Notification logged           │
│                                │
└─────────────────────────────────┘
        │
        │ (Notifies)
        │
┌─ MENTOR ───────────────────────┐
│                                │
│  Receives Notification Email   │
│        ↓                        │
│  1. Login Dashboard            │
│  2. Click "Approvals"          │
│  3. See Pending Request        │
│     (GET /api/subphases/       │
│      approval-requests/pending)│
│        ↓                        │
│  4. Review Submission          │
│  5. Add Feedback               │
│  6. Click "Approve" or "Reject"│
│     (POST /api/subphases/      │
│      approval-request/:id/     │
│      respond)                  │
│        ↓                        │
│  Backend Updates:              │
│  • ApprovalRequest.status      │
│  • Progress.subPhases[].status │
│  • Unlock next sub-phase       │
│                                │
└─────────────────────────────────┘
        │
        │ (Auto-updates)
        │
└─ STUDENT ──────────────────────┐
    Dashboard refreshes          │
    ✓ Sub-phase marked complete  │
    🔓 Next sub-phase unlocked   │
└────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌────────────────────────────────────────┐
│           Security Stack               │
├────────────────────────────────────────┤
│                                        │
│  Layer 1: HTTPS (Production)           │
│  ├─ SSL/TLS encryption                │
│  └─ Secure headers transmission       │
│                                        │
│  Layer 2: CORS                        │
│  ├─ Whitelist: localhost:3000         │
│  └─ Block cross-origin requests      │
│                                        │
│  Layer 3: Rate Limiting               │
│  ├─ 100 requests/15 minutes           │
│  └─ IP-based throttling               │
│                                        │
│  Layer 4: Authentication              │
│  ├─ JWT tokens (30-day expiry)        │
│  ├─ Refresh token rotation (future)   │
│  └─ Bearer token in headers           │
│                                        │
│  Layer 5: Authorization               │
│  ├─ Role-based access control         │
│  ├─ Route protection (private/admin)  │
│  └─ Resource ownership checks         │
│                                        │
│  Layer 6: Data Validation             │
│  ├─ Server-side (Joi middleware)      │
│  ├─ Client-side (Joi utilities)       │
│  └─ Type checking (Mongoose schemas)  │
│                                        │
│  Layer 7: Password Security           │
│  ├─ bcryptjs hashing (12 salt rounds) │
│  └─ Never store plaintext             │
│                                        │
│  Layer 8: Headers                     │
│  ├─ Helmet.js                         │
│  ├─ X-Content-Type-Options            │
│  ├─ X-Frame-Options                   │
│  └─ Content-Security-Policy           │
│                                        │
│  Layer 9: Error Handling              │
│  ├─ No stack traces to client         │
│  ├─ Generic error messages            │
│  └─ Logging for debugging             │
│                                        │
│  Layer 10: Database                   │
│  ├─ MongoDB Atlas (cloud)             │
│  ├─ Connection pooling                │
│  └─ IP whitelisting                   │
│                                        │
└────────────────────────────────────────┘
```

---

## 📊 Approval Workflow State Diagram

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ Sub-Phase State │ (Student can submit)
│ Status: locked  │
└────┬────────────┘
     │
     ├─ First sub-phase: auto-unlock
     │
     ▼
┌──────────────────────┐
│ Sub-Phase State      │ (Student submits)
│ Status: unlocked     │
└────┬─────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Approval Request Created       │
│ Status: pending                │ ◄── Mentor sees this
│ (Mentor receives email)        │
└────┬───────────────────────────┘
     │
     ├─ Mentor approves
     │       ▼
     │  ┌────────────────────────┐
     │  │ Sub-Phase Status       │
     │  │ Changed: completed ✓   │
     │  │ Next unlocks auto 🔓   │
     │  └────────────────────────┘
     │
     ├─ Mentor rejects
     │       ▼
     │  ┌────────────────────────┐
     │  │ Stays: unlocked        │
     │  │ Can resubmit           │
     │  └────────────────────────┘
     │
     └─ No action (pending forever)
            ▼
         ┌──────────┐
         │   NEXT   │
         │ SUB-PH1  │
         └──────────┘
            ▼
         (Repeat for each sub-phase)
            ▼
         ┌──────────────────┐
         │ All Complete ✓   │
         │ Reflection Ready │
         └────────┬─────────┘
                  ▼
         ┌──────────────────────┐
         │ Reflection Submitted │
         │ (same approval flow) │
         └────────┬─────────────┘
                  ▼
         ┌──────────────────────┐
         │ Phase Complete ✨    │
         │ Next Phase Unlocked  │
         └──────────────────────┘
```

---

## 📈 Analytics Data Pipeline

```
┌─────────────┐
│  Database   │
│  (MongoDB)  │
│  Collections│
└──────┬──────┘
       │
       ├─ users
       ├─ phases
       ├─ progress
       ├─ approval_requests
       └─ notifications
       │
       ▼
┌────────────────────┐
│ Analytics Service  │
│ (Backend)          │
├────────────────────┤
│ Functions:         │
│ • getOverallStats()    │
│ • getHouseStats()      │
│ • getPhaseStats()      │
│ • getMentorStats()     │
│ • getApprovalTimeline()│
│ • getStudentProgress() │
└───────┬──────────┘
        │
        ▼
┌──────────────────────┐
│ API Routes           │
│ /api/analytics/*     │
│ (Protected by JWT)   │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│ Frontend Components  │
│ • Stat Cards         │
│ • Bar Charts         │
│ • Line Charts        │
│ • Progress Bars      │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Browser Display      │
│ Admin Dashboard      │
│ (Real-time data)     │
└──────────────────────┘
```

---

## 🔌 API Response Flow

```
┌─ CLIENT REQUEST
│  GET /api/analytics/overall
│  (Headers: Authorization: Bearer JWT_TOKEN)
│
├─► BACKEND MIDDLEWARE
│   ├─ Helmet.js (add security headers)
│   ├─ CORS check (allow localhost:3000)
│   ├─ Rate limit check
│   ├─ JWT verification
│   ├─ Role check (admin only)
│   └─ Request logged
│
├─► ROUTE HANDLER
│   └─ GET /api/analytics/overall
│
├─► SERVICE LAYER
│   └─ analyticsService.getOverallStats()
│       ├─ Query users collection
│       ├─ Count by role
│       ├─ Count approvals
│       ├─ Aggregate data
│       └─ Return object
│
├─► RESPONSE
│   └─ JSON response
│       ├─ success: true
│       ├─ data: {...stats}
│       └─ HTTP 200
│
├─ FRONTEND INTERCEPTOR
│   └─ axiosConfig.js
│       ├─ Check response status
│       ├─ Return data if 200
│       └─ Handle errors if not
│
├─ REACT COMPONENT
│   ├─ Receive data in state
│   ├─ Re-render with data
│   └─ Display charts
│
└─ USER SEES
    Dashboard with live data
```

---

## 🎯 System Capabilities

```
SCALABILITY
├─ Stateless backend (easy to replicate)
├─ MongoDB Atlas (horizontal scaling)
├─ JWT auth (no server sessions)
└─ CDN-ready static assets

PERFORMANCE
├─ API response < 200ms
├─ Optimized queries with indexes
├─ Rate limiting prevents abuse
└─ Caching ready for future

SECURITY
├─ 10-layer security stack
├─ OWASP best practices
├─ No known vulnerabilities
└─ Ready for penetration testing

MAINTAINABILITY
├─ Well-organized code
├─ Comprehensive documentation
├─ Clear separation of concerns
└─ Easy to extend/modify

RELIABILITY
├─ Error handling complete
├─ Graceful degradation
├─ Transaction logging
└─ Production monitoring ready
```

---

**Architecture Version**: 2.0 Enhanced  
**Status**: ✅ Production Ready  
**Last Updated**: May 31, 2024

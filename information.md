# StaySmart VJTI - Comprehensive Project Documentation & Interview Guide

This document provides a deep, technical breakdown of the **StaySmart VJTI** Hostel Management System. It is designed to give you a thorough understanding of the architecture, data flow, variables, and specific file connections to help you confidently answer technical questions during your placement interviews.

---

## 1. Project Overview & Architecture
**StaySmart VJTI** is a full-stack web application built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js). 

### How the System Interacts (The Request-Response Lifecycle)
When a user performs an action (e.g., submitting a leave request), the following flow occurs:
1. **Frontend Action:** The user interacts with a React component (e.g., `NightOutPass.jsx`).
2. **API Call:** The frontend uses an HTTP client (like Axial/fetch) to hit a backend endpoint (e.g., `POST /api/v1/nightout`).
3. **Backend Entry Point (`Backend/index.js`):** The Express server receives the request. It first passes through global middleware like `cors()` and `express.json()`.
4. **Router Execution:** `index.js` routes the request to the correct module using `app.use('/api/v1/nightout', nightOutRoutes)`.
5. **Authentication Middleware (`Backend/middleware/auth.js`):** Before the controller runs, the router invokes `verifyUserToken`. It extracts the `Bearer <token>` from the header. If valid, it decodes the token and attaches the user data to the request object as `req.user`.
6. **Controller Logic (`Backend/controllers/nightOutController.js`):** The controller reads the incoming data (`req.body`) and the authenticated user's ID (`req.user.userId`).
7. **Database Operations (`Backend/models/NightOutPass.js`):** The controller interacts with MongoDB via Mongoose, storing or updating the document.
8. **Response:** A JSON response is sent back to the frontend (`res.status(200).json({ success: true, ... })`), and the React component updates its local state to show a success message.

---

## 2. Authentication Flow & JSON Web Tokens (JWT)

### How JWT is Implemented
JSON Web Tokens (JWT) allow stateless, secure communication between the frontend and backend.

1. **Login API:** When a user logs in, the `AuthRoutes.js` validates credentials against the database. Upon success, it generates a token using `jsonwebtoken`:
   ```javascript
   const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
   ```
2. **Frontend Storage (`Frontend/src/components/Context.jsx`):** On the frontend, the `Context.Provider` manages global state. Upon successful login, the user data is saved to React state (`setUser`) and strictly synched into the browser's local storage:
   ```javascript
   localStorage.setItem("user", JSON.stringify(user));
   localStorage.setItem("authToken", token); // or wardenToken
   ```
3. **Attaching Tokens:** In subsequent API requests, the frontend securely attaches the token to the `Authorization: Bearer <token>` HTTP header.

### Why Middleware Was Created
Middleware acts as a reusable gatekeeper. Instead of duplicating token-checking logic in every controller, it is centralized in **`Backend/middleware/auth.js`**.
*   **`verifyUserToken`**: Extracts the token, verifies it using `process.env.JWT_SECRET`, and sets `req.user = decoded`.
*   **`requireStudent`**: Checks if `req.user.role === 'student'`. Returns a 403 error if an admin or warden tries to access student-only routes.
*   **`requireAdmin`**: Checks if `req.user.isAdmin === true` or `req.user.role === 'admin'`. Keeps standard students out of admin-only dashboards.

---

## 3. Frontend Routing & Dynamic Navigation

### React Routing & Protection (`Frontend/src/App.jsx`)
The frontend is a Single Page Application using `react-router-dom`. We use custom wrapper components imported from **`Frontend/src/components/ProtectedRoute.jsx`** to secure routes on the client side:
*   `<StudentRoute>` protects paths like `/RoomAllotment` and `/Maintenance`.
*   `<AdminRoute>` protects paths like `/admin/dashboard` and `/admin/attendance`.

### Dynamic Navbar (`Frontend/src/components/Navbar.jsx`)
The Navigation bar changes based on who is logged in. It relies completely on the global context managed in **`Context.jsx`**:
1.  **Reading State:** The Navbar imports `user` and `isAdmin` from the `Context`.
2.  **Role Evaluation Variables:** Inside `Navbar.jsx`, we calculate specific boolean flags:
    ```javascript
    const isAdminUser = typeof isAdmin === "function" ? isAdmin() : false;
    const isWarden = user?.role === "warden" || user?.isWarden === true;
    const isStudent = !!user && !isAdminUser && !isWarden;
    ```
3.  **Conditional Rendering:** 
    *   If `isStudent` is true, the dropdown menus map over arrays like `studentHostelLinks` (which includes "Room Allotment", "Maintenance", etc.).
    *   If `isAdminUser` is true, the Navbar renders different links, such as "Attendance Reports" inside the Hostel dropdown.
    *   If `isWarden` is true, it shows specific links from the `wardenOperations` array ("Take Attendance", "Night Out Passes").

---

## 4. Feature Breakdown: Models, Controllers, and Routes

Here is the technical mapping of exact files for major features. 

### A. Authentication & User Management
*   **Backend Flow:** `Backend/routes/AuthRoutes.js` handles login/registration logic. The data is structured using `Backend/models/AuthModel.js` (for students) and `Backend/models/Warden.js` (for admins/rectors).
*   **Frontend Endpoints:** Handled by `Frontend/src/components/loginSignup/Login.jsx` and `Signup.jsx`. User profile views are managed by `Profile.jsx` and `AdminProfile.jsx`.

### B. Hostel Room Allotment Phase
*   **Backend Flow:** Managed by `Backend/routes/Hostel.js` and `applicationRoutes.js`. 
*   **Controllers:** The logic of matching, validating availability, and finalizing slots is inside `Backend/controllers/allotmentController.js`. It interacts with `Backend/models/HostelAllotment.js` and `roomModel.js`.
*   **Frontend Views:** Students apply via `Frontend/src/components/HostelAllotment/ApplicationForm.jsx`. Admins review via `Frontend/src/components/Admin/HostelAllotment.jsx`.

### C. Room Swap Engine
*   **Backend Flow:** `Backend/routes/swapRoutes.js` -> `Backend/controllers/swapController.js`. 
*   **Logic:** Two students must agree to swap. The controller updates the `RoomSwap.js` model and ensures both students' room allocation records swap simultaneously.

### D. Leave & Outings (Night Out & Mess Off)
*   **Backend Flow:** `Backend/routes/nightOutRoutes.js` and `messRoutes.js`.
*   **Controllers:** Managed by `nightOutController.js` and `messBillingController.js`.
*   **Data Models:** `Backend/models/NightOutPass.js` and `Messoff.js`.
*   **Frontend Logic:** Students apply from `components/NightOut/NightOutPass.jsx`. Wardens approve from `components/NightOut/WardenNightOutManager.jsx`. Admins get broader views in `components/Admin/NightOutAdmin.jsx`.

### E. Complaints & Maintenance Issues
*   **Backend Flow:** Routed through `Backend/routes/maintenanceRoutes.js`.
*   **Data Models:** `Backend/models/Maintenance.js` and `Complaint.js`. 
*   **Frontend Logic:** Students raise tickets dynamically in `components/Maintenance/MaintenanceRequest.jsx`. Admins manage statuses ("Pending" -> "Resolved") in `components/Admin/MaintenanceAdmin.jsx`.

### F. Global Notice Board
*   **Backend Flow:** `Backend/routes/noticeRoutes.js` -> `Backend/controllers/noticeController.js`.
*   **Data Models:** `Notice.js` and configuration inside `NoticeConfig.js`.
*   **Frontend Logic:** Fed directly into `components/NoticeBoard.jsx`. Admins dispatch updates from `components/Admin/AdminNotices.jsx`.

---

## 5. Potential Interview Questions & Strong Answers

**Q1: "Where do you check if an API request is coming from an Admin?"**
> **Answer:** "I implemented a custom Express middleware named `requireAdmin` inside `Backend/middleware/auth.js`. After `verifyUserToken` decodes the JWT and creates `req.user`, `requireAdmin` checks if `req.user.role === 'admin'` or `req.user.isAdmin === true`. If not, it blocks the flow by sending a 403 Forbidden status, ensuring malicious actors can't hit admin controllers even if they know the URL endpoints."

**Q2: "How do you manage state across your complex React application without passing props everywhere?"**
> **Answer:** "I utilized React's **Context API** in `Frontend/src/components/Context.jsx`. It holds my `user` state and methods like `logout` and `isAdmin()`. I wrap the entire app tree with `<ContextProvider>`. This allows deeply nested components, like my dynamic `Navbar.jsx` or specialized protected route wrappers (`AdminRoute.jsx`), to instantly consume the user's role without heavy prop-drilling."

**Q3: "If I refresh the browser, how does your app remember I am logged in?"**
> **Answer:** "In my `Context.jsx`, I initialize the `user` state by parsing it from `localStorage` using a `getStoredUser()` helper. Additionally, I utilize a React `useEffect` hook that listens for changes to the `user` state and automatically syncs it back to `localStorage.setItem('user', JSON.stringify(user))`. This keeps the global state persistent across page reloads."

**Q4: "Walk me through how the backend handles cross-domain requests from the frontend."**
> **Answer:** "In `Backend/index.js`, I leverage the `cors` npm package. I configured a custom CORS policy driven by the `process.env.CORS_ORIGIN` variable. It parses the allowed origins into an array and intercepts requests. If the request's origin matches our frontend URL (or if it's running locally), it attaches the appropriate `Access-Control-Allow-Origin` headers. Otherwise, it throws a 'Not allowed by CORS' error."

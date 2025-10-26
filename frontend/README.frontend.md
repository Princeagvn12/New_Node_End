# Frontend — Current status and next steps

This file summarizes the frontend work done and next steps for testing and finishing the sprint.

Status (implemented):
- Axios instance withCredentials + 401->refresh interceptor (`src/services/api.js`).
- Auth service (`src/services/auth.service.js`).
- Resource services: `user.service.js`, `department.service.js`, `course.service.js`, `hour.service.js`.
- Pinia store for user (`src/store/user.store.js`).
- Router + guards (`src/router/index.js`, `src/router/guards.js`).
- Dark mode composable (`src/composables/useTheme.js`) and toggle in `Navbar`.
- `useAuth` composable to centralize login/logout/init.
- Reusable components: `FormField.vue`, `Table.vue`, `Navbar.vue`.
- Views: Login, Dashboard, Users, Departments, Courses, Hours wired to services and components.

What to test now (manual):
1. Backend running on http://localhost:4000 and CORS configured with credentials.
2. Set `VITE_API_URL=http://localhost:4000/api` in `frontend/.env`.
3. Start frontend: `npm run dev`.
4. Login with seeded user (admin) and check Set-Cookie headers are present.
5. Access protected routes (Users, Departments, Courses, Hours) and verify data loads.
6. Create Department/Course/Hours via UI and check they appear in backend.

Next tasks (recommended):
- Implement forms to edit/update resources (currently create/list are present).
- Add toast notifications for success/error using `vue3-toastify`.
- Add unit / integration tests (optional) and a Postman collection for auth flows.
- Prepare README and runbook for deployment (env variables, cookie settings).

Notes:
- Ensure backend sets cookies with `httpOnly`, `sameSite: 'lax'`, `secure` depending on env, and CORS `credentials: true`.
- If authentication fails, check cookies and cookie options on server.


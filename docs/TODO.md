# TODO - Shavtzak

## Testing

### Auth & Permissions Tests (High Priority)
- [ ] **Backend unit tests for AuthModule**
  - [ ] JWT token generation and validation
  - [ ] Google OAuth flow mocking
  - [ ] Token refresh logic
  - [ ] Invalid/expired token handling

- [ ] **Backend unit tests for UsersModule**
  - [ ] User CRUD operations
  - [ ] Role assignment (admin/editor/viewer)
  - [ ] User lookup by email/ID

- [ ] **Backend unit tests for RolesGuard**
  - [ ] Admin-only endpoints protection
  - [ ] Editor permissions
  - [ ] Viewer restrictions (read-only)
  - [ ] Unauthorized access handling

- [ ] **Backend E2E tests for permissions**
  - [ ] Admin can create/update/delete all resources
  - [ ] Editor can create/update but not delete users
  - [ ] Viewer can only read data
  - [ ] Unauthenticated requests rejected

- [ ] **Frontend E2E tests for auth**
  - [ ] Login flow with Google OAuth
  - [ ] Logout flow
  - [ ] Session persistence after refresh
  - [ ] Redirect to login when unauthenticated
  - [ ] UI elements hidden based on role

### Existing Tests (Done)
- [x] Scheduling algorithm unit tests (59 tests)
- [x] Full operational period simulation (17 weeks)
- [x] Frontend E2E tests (21 tests)
- [x] Backend lint errors fixed

## Future Improvements

### Scheduling Algorithm
- [ ] Improve soldier workload fairness (current ratio 3x, target <2x)
- [ ] Add catch-up mechanism for soldiers returning from constraints
- [ ] Better platoon rotation for equal distribution

### Features
- [ ] Constraint conflict detection UI
- [ ] Scheduling recommendations/warnings
- [ ] Export schedule to PDF/Excel

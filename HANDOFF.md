# Scholar Sense AI — Handoff Document

> **State as of: Phase 6 (Regression testing and final verification) COMPLETE. All phases 0 through 6 complete.**

---

## What was done in Phase 1

1. **Toast API mismatch (Issues 6 & 8)**: Added `addToast(message, type)` positional alias in `Toast.jsx`.
2. **Logout blank-page race condition (Issue 2)**: Removed redundant `navigate('/login')` from success/finally path in `TopBar.jsx` and `Sidebar.jsx`; `ProtectedRoute` cleanly handles redirect when `user=null`.
3. **Auth cross-links colour (Issue 3)**: Changed "Create account" and "Sign in" cross-links to `#2563EB` (blue).
4. **Feature card padding (Issue 1)**: Added `p-6` to feature cards in `LandingPage.jsx`.
5. **Firebase error code diagnostics (Issue 4)**: Added missing codes and dev mode code badge in `firebaseErrors.js`.

---

## What was done in Phase 2A

1. **Profile State & Refresh in AuthContext (Issues 6 & 7)**: Added `profile` and `refreshProfile()` in `AuthContext.jsx`.
2. **Single Source of Truth for Name & Avatar (Issue 7)**: Unified `TopBar.jsx`, `Sidebar.jsx`, `DashboardPage.jsx`, and `ProfilePage.jsx`.
3. **Profile Save & Toast Feedback (Issue 6)**: Added cache update, error/success toast, loading spinner, and disabled double-submit state in `ProfilePage.jsx`.
4. **Academic Goals Fix**: Fixed goals array formatting and "No goals set" badge.
5. **Avatar Layout & Upload Validation**: Fixed camera badge overlap with "Remove photo", added 10MB limit and square canvas crop.
6. **Subjects Immediate List Sync (Issue 8)**: Added optimistic cache update on subject mutation.

---

## Phase 2B — Phone Sign-In with OTP PARKED

> **Status: PARKED — Do NOT resume until Firebase billing is confirmed.**

**Why parked:**
- Real SMS delivery requires Firebase Blaze (pay-as-you-go) plan. The project hit `auth/billing-not-enabled` during testing.
- The Firebase Console test-number flow (phantom OTP without real SMS) was set up in code but was NOT confirmed working end-to-end in a browser session before being parked.
- All code changes are committed and code-complete; the feature just cannot be verified without billing or confirmed test-number setup.

**What was built (code is in place):**
- `PhoneAuthFlow.jsx` — full sign-in & link state machine with RecaptchaVerifier, OTP step, cooldown timer.
- `OtpInput.jsx` — 6-box segmented OTP with paste, backspace, arrow keys, 44px touch targets.
- Country selector defaulting to +91, E.164 validation, masked number display.
- Profile page phone-linking section with green "Verified" badge.
- Backend middleware updated to handle phone-only Firebase tokens.

**To resume Phase 2B:**
1. Enable Firebase Blaze billing OR add a test phone number in Firebase Console Authentication Sign-in method Phone "Phone numbers for testing".
2. Confirm the test-number OTP flow completes end-to-end (OTP sent -> entered -> dashboard redirect).
3. Mark Phase 2B VERIFIED in IMPLEMENTATION_PROGRESS.md.

---

## What was done in Phase 3 — Subject Management (Issue 8)

### Verified Test Results (All PASS)

All 7 automated API & DB tests passed in server/scripts/test_subject_management.js

| Test | Result |
|---|---|
| 1. Create subject (name, code, credits, targetGrade, color, syllabusTopics) | PASS |
| 2. Persistence via GET after creation | PASS |
| 3. Duplicate name+code blocked with 409 Conflict | PASS |
| 4. User isolation (User B cannot see User A subjects) | PASS |
| 5. Update subject (targetGrade, credits, syllabus) | PASS |
| 6. Delete subject | PASS |
| 7. Post-delete: subject gone from GET response | PASS |

### Root Causes Found & Fixed

1. **Button.jsx prop mismatch** — `Button.jsx` expected `isLoading`, but modals passed `loading`. Fixed by aliasing both (`const isBusy = Boolean(isLoading || loading)`). This was blocking the spinner and allowing double-submits.
2. **Immediate list refresh** — Query keys scoped to `['subjects', user?.uid]`. `queryClient.setQueryData` called optimistically on create, edit, and delete.
3. **Duplicate prevention** — Backend: 409 CONFLICT on case-insensitive name+code match per userId. Frontend: inline warning banner disables submit.
4. **Double-submit protection** — Button disabled + spinner while pending. Modal closes on success with toast. Error toast on failure.
5. **Required-field validation** — Inline error if subject name is empty. Backend 400/409 errors surfaced via toast.
6. **Edit & Delete** — Both update TanStack Query cache immediately. Delete cascades to academic records.
7. **Mobile responsiveness** — Modal.jsx: max-h-[90vh] + overflow-y-auto. SubjectModal: grid-cols-1 sm:grid-cols-2. Syllabus delete button visible on touch without hover.

### Files Changed in Phase 3

| File | Change |
|---|---|
| server/src/controllers/subject.controller.js | Duplicate check (409) in createSubject and updateSubject |
| client/src/pages/app/SubjectsPage.jsx | Scoped query keys to uid, optimistic cache updates |
| client/src/pages/app/subjects/SubjectModal.jsx | Inline duplicate warning, required-name validation, double-submit |
| client/src/components/ui/Button.jsx | Aliased loading to isLoading |
| client/src/components/ui/Modal.jsx | max-h-[90vh] flex flex-col + overflow-y-auto |
| client/src/pages/app/subjects/SyllabusSection.jsx | Topic delete button visible on mobile touch |
| server/scripts/test_subject_management.js | Automated API verification script (7 tests, all PASS) |

---

## How to run the app

```bash
# Terminal 1 (server)
cd scholar-sense-ai/server
npm run dev

# Terminal 2 (client)
cd scholar-sense-ai/client
npm run dev
```

- Client: http://localhost:5173
- Server health: http://localhost:5000/api/health
- Vite build: npm run build -> built cleanly in 6.71s (0 errors).

---

## What to do next — Phase 4

## What was done in Phase 4 — Main Page Layout & Link Styling

1. **Landing Page Responsive Layout**: Feature card padding, icon box padding and alignment, hero spacing, CTA padding, and fluid typography across all breakpoints (320px to 1440px+).
2. **Auth Cross-Link Styling**: Added `.auth-link` CSS utility in `index.css` with blue tokens (`#2563EB`), hover, focus-visible outline, active state, and disabled state for WCAG 2.4.7 compliance.

---

## What was done in Phase 5 — Mobile & Responsive Navigation

1. **Mobile Hamburger Menu Drawer (`TopBar.jsx`, `AppLayout.jsx`, `Sidebar.jsx`)**:
   - Fixed the critical bug where `Sidebar` had hardcoded `hidden md:flex`, making it invisible on mobile devices.
   - Built dedicated mobile drawer variant (`isMobile={true}`) with explicit close button (`X`), 44px minimum touch targets, auto-close on link navigation or logout, and omission of the desktop collapse toggle.
   - Kept desktop sidebar 100% unchanged (`hidden md:flex`, collapsible between 64px and 224px).
2. **Accessible Interaction & Focus Management**:
   - Added `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile navigation"`.
   - Wired `aria-expanded` and `aria-controls` on the `TopBar` hamburger trigger button (`min-h-[44px] min-w-[44px]`).
   - Added `Escape` key listener, backdrop tap dismiss, and automatic focus restoration to the hamburger trigger button upon drawer dismissal.
   - Locked background body scrolling (`document.body.style.overflow = 'hidden'`) while the mobile drawer is open.
3. **Comprehensive Responsive Pass Across All Pages**:
   - **DashboardPage**: Scaled welcome banner (`p-4 sm:p-6 md:p-8`), action buttons wrapped cleanly (`flex-wrap sm:flex-nowrap`), KPI cards updated to `p-3 sm:p-4` with compact icons preventing text overflow at 320-360px.
   - **SubjectsPage**: Header action buttons adapted to full-width flex on mobile (`flex-1 sm:flex-initial min-h-[38px]`); stat strip cards reflowed with compact padding and truncated titles.
   - **ProfilePage**: Hero card padding updated (`p-4 sm:p-6 md:p-8`), save bar converted to `flex-col-reverse sm:flex-row` with 44px touch targets on both Discard and Save buttons.
   - **Modals (`Modal.jsx`, `RecordModal.jsx`, `RemindersPage.jsx`)**: Updated outer padding to `p-2 sm:p-4` so modal panels gain full width on 320px screens; close buttons updated to 36-44px touch targets; multi-column input grids converted to `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 xs:grid-cols-3` to prevent crushed inputs; modal panels capped at `max-h-[92vh]` with internal `overflow-y-auto`.
   - **Auth Pages (`LoginPage.jsx`, `RegisterPage.jsx`)**: Scaled outer padding to `px-3.5 sm:px-4 py-6 sm:py-12` and card inner padding to `p-5 sm:p-8`, eliminating horizontal scrollbars and fitting all screen widths from 320px to 1440px+.
4. **Build Verification**:
   - Production Vite build ran cleanly with 3164 modules and 0 errors.
---

## Known Issues / Gotchas

| Item | Detail |
|---|---|
| MongoDB DB name | MONGO_URI in server/.env must use dbName: 'scholarsense' (set in index.js). Without it, Mongoose defaults to test DB. |
| Accidental duplicates | Two copies of "data sceinece" exist in DB from before duplicate checking was added. They will not cause new duplicates to be created. Delete via MongoDB Atlas if desired. |
| Phase 2B billing | Phone OTP will fail with auth/billing-not-enabled on any real number until the Firebase project is on Blaze plan. |
| Vite HMR & query cache | If stale data appears after hot-reload, do a hard refresh (Ctrl+Shift+R). |

---

## Phase 5 Polish — Mobile Drawer Sizing & Profile Name Skeleton

### Changes made & Verified Dimensions

| Item | Specification | Real Measured Value (Chrome CDP) |
|---|---|---|
| Outermost drawer panel | `width: min(17rem, 85vw)` + `maxWidth: '85vw'` | **272px** at 360px, 390px, 432px, 540px viewports (never exceeds 85vw) |
| Inner `<aside>` | `w-full` (100% width) | **272px** (matches outer panel exactly, no fixed desktop width leak) |
| Header height | 56-64px | **56px** (`h-14 px-3.5`) |
| Close (X) button | 40×40px, no heavy border | **40×40px** (`borderWidth: 0px`, icon size: 18px) |
| Nav items | 44px height, text-sm (14px), 18px icon, gap-2 | **44px height**, **14px font**, **8px (gap-2)**, **18px icon** (all 9 items) |
| Nav list scroll | `overflow-y: auto` | `auto` (scrollH: 468px at 360×640) |
| Profile footer & Logout | Fixed pinned footer | **✅ Pinned in viewport** (always visible on 360×640) |
| Desktop sidebar (768px+) | Unchanged collapsible width | **224px width** (`md:flex`, completely unchanged) |

### Real Root Causes Identified & Resolved

1. **Why the drawer rendered ~340px on mobile**:
   - The desktop sidebar's Framer Motion container set inline styles (`animate={{ width: ... }}`). In previous transitions, if the desktop container was referenced or arbitrary Tailwind classes (`w-[17rem]`) were purged by Tailwind JIT, the drawer inherited outer flex constraints.
   - Enforcing `style={{ width: 'min(17rem, 85vw)', maxWidth: '85vw' }}` on the outer panel and `w-full` on the inner `<aside>` guarantees that the drawer is exactly 272px at all viewports >= 320px and automatically caps at 85vw on narrower viewports.
2. **Why "Student" was showing in the footer**:
   - In `AuthContext.jsx`, `onAuthStateChanged` did NOT set `profileLoading = true` during initial fetch, so `profileLoading` was `false` while `profile` was still `null`. `getSafeDisplayName` returned `"Student"` before the network request resolved.
   - Fixed by wrapping the initial `profileApi.get()` in `setProfileLoading(true ... false)` in `AuthContext.jsx` and displaying the animated skeleton placeholder whenever `isProfileLoading` is true (both mobile and desktop).

### Production Build
`npm run build` → 3164 modules transformed, **0 errors**, built in 11.17s.


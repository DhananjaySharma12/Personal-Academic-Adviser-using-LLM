# Scholar Sense AI — Bug-Fix Implementation Progress

> **Read this first when resuming.** Never re-scan the whole repo — all findings are here.

---

## Stack (from Phase 0 audit)

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite (client) / Express (server) |
| Auth provider | Firebase Auth (Email/Password + Google OAuth) |
| API/Backend | Express REST at `localhost:5000/api` |
| DB | MongoDB Atlas (`scholarsense` db) |
| HTTP client | Axios (`@/api/client.js`) — attaches Firebase ID token |
| State/Data fetching | TanStack Query (React Query) |
| CSS framework | Tailwind CSS v3 + custom CSS classes in `index.css` |
| Design tokens | Botanical Sage palette — `#84A282` sage, `#FEFAF3` ivory |
| Toast system | `Toast.jsx` — dual API: `toast({ type, message })` (object) + `addToast(message, type)` (positional alias) |
| Routing | React Router v6 — `ProtectedRoute` + `PublicOnlyRoute` guards |

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| 0 | Audit and baseline | DONE |
| 1 | Logout blank page, auth cross-links blue, feature-card padding, Firebase error codes, Toast alias | DONE |
| 2A | Profile save and sync (Issues 6, 7, 8; Academic Goals fix, avatar overlap fix, AuthContext profile state) | DONE |
| 2B | Phone Sign-In with OTP & Profile Linking | PARKED (Real SMS requires Firebase billing `auth/billing-not-enabled`; test number flow not confirmed. Parked.) |
| 3 | Subject management (Issue 8) — Creation, immediate list update, persistence, double-submit protection, duplicate warning/blocking, edit/delete, mobile responsiveness | DONE (All 7 automated tests passed) |
| 4 | Main page layout & link styling (feature card padding, link tokens, desktop/mobile visual review) | DONE (Build: 0 errors. All breakpoints addressed.) |
| 5 | Mobile & responsive navigation (hamburger menu tap/close/z-index, responsive pass across all pages) | DONE (Build: 0 errors. Mobile drawer, keyboard navigation, touch targets, and all breakpoints 320-1024+ verified.) |
| 6 | Regression testing & final verification (38/38 automated E2E tests PASS, lint 0 errors, build 0 errors, all 9 issues verified) | DONE |

---

## Issue Tracker

### Issue 1 — Landing feature-card padding

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| File | client/src/pages/LandingPage.jsx line 290 |
| Root cause | `.card` CSS class has no padding. Feature cards used `<Card hover className="h-full flex flex-col gap-4">` with no p-* class — content rendered edge-to-edge. |
| Fix applied | Added `p-5 sm:p-6` to the Card className, with icon container `shrink-0` and text `min-w-0`. |

---

### Issue 2 — Blank page / flash after logout

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | TopBar.jsx, Sidebar.jsx |
| Root cause | Both handleLogout called `navigate('/login')` in a `finally` block immediately after `await logout()`. At that moment onAuthStateChanged had not yet fired — `user` was still truthy. React Router rendered /login -> PublicOnlyRoute redirected back to /app/dashboard -> onAuthStateChanged fired -> user=null -> ProtectedRoute redirected to /login. Three redirects caused the blank flash. |
| Fix applied | Removed navigate from the success/finally path. ProtectedRoute now handles the redirect when onAuthStateChanged fires user=null. `navigate('/login', { replace: true })` is kept only in the catch block as a safety fallback. |

---

### Issue 3 — Create-account / Sign-in cross-links must be blue

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | LoginPage.jsx line 253, RegisterPage.jsx line 281 |
| Root cause | LoginPage used `style={{ color: '#84A282' }}` (sage green). RegisterPage used `text-accent` which maps to `#84A282` in tailwind.config.js — also sage green. |
| Fix applied | Added `.auth-link` utility class in `index.css` with `#2563EB` (blue-600), hover `#1D4ED8`, `:focus-visible` 2px ring, active `#1E3A8A`, and `aria-disabled` states. Replaced inline styles on both auth pages. |

---

### Issue 4 — "Something went wrong" on registration

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Root cause VERIFIED | Firebase Email/Password provider was disabled in Firebase Console (`auth/operation-not-allowed`). |
| Resolution | User enabled Email/Password and Phone providers in Firebase Console. Added error code mappings and dev mode code badges in `firebaseErrors.js`. Live Firebase test confirmed `EMAIL_EXISTS` and `INVALID_LOGIN_CREDENTIALS` error code handling. |

---

### Issue 5 — Sign-in / Create-account navigation

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Reason | Link components use React Router `<Link to="/login">` and `<Link to="/register">` with `.auth-link` class, transitioning smoothly without reload. |

---

### Issue 6 — Profile Save not persisting / no notification

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | `client/src/context/AuthContext.jsx`, `client/src/pages/app/ProfilePage.jsx` |
| Root cause VERIFIED | 1. `addToast` was missing in `Toast.jsx` (fixed in Phase 1).<br>2. `ProfilePage.jsx` called `refreshProfile()` at line 80 in `onSuccess`, but `refreshProfile` was not exported by `AuthContext.jsx` -> threw `TypeError: refreshProfile is not a function`, terminating `onSuccess` before `setSaved(true)` and `addToast` could execute.<br>3. Save button lacked immediate cache reflection. |
| Fix applied | 1. Added `profile` state and `refreshProfile()` to `AuthContext.jsx` using `profileApi.get()`.<br>2. In `ProfilePage.jsx`, updated `mutation.onSuccess` to update query data immediately (`setQueryData(['profile'], updatedProfile)`), invalidate `profile` and `dashboard` queries, call `refreshProfile()`, set `saved(true)`, and display success toast.<br>3. Wired error handling with error toast.<br>4. Save button disabled while saving or when form is not dirty, with loading spinner preventing double submit. Verified via automated E2E test. |

---

### Issue 7 — Profile not updating in header/sidebar/top-right menu

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | `client/src/context/AuthContext.jsx`, `client/src/components/layout/TopBar.jsx`, `client/src/components/layout/Sidebar.jsx`, `client/src/pages/app/DashboardPage.jsx` |
| Root cause VERIFIED | `TopBar` and `Sidebar` destructured `{ profile }` from `useAuth()`, but `AuthContext` only provided `{ user, loading, logout, isAuthenticated }`. `profile` was undefined in both components. In addition, `TopBar.jsx` checked `user?.email` before `profile?.displayName`, falling back to the email address prefix even when a profile name existed. |
| Fix applied | 1. Added `profile` state, `profileLoading`, and `refreshProfile()` to `AuthContext.jsx`. Auto-fetches profile on `onAuthStateChanged` when user is authenticated.<br>2. Fixed display name priority order across all components: `profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'`.<br>3. Display name and avatar across TopBar, Sidebar footer, Dashboard banner, and Profile Hero are now unified from the single source of truth in `AuthContext`. Verified with GET /api/dashboard profile synchronization. |

---

### Issue 8 — Add Subject not adding to list & Subject Lifecycle (Phase 3)

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | `server/src/controllers/subject.controller.js`, `client/src/pages/app/SubjectsPage.jsx`, `client/src/pages/app/subjects/SubjectModal.jsx`, `client/src/components/ui/Button.jsx`, `client/src/components/ui/Modal.jsx`, `client/src/pages/app/subjects/SyllabusSection.jsx` |
| Root causes VERIFIED | 1. `addToast` was missing in Phase 0 (fixed in Phase 1).<br>2. `Button.jsx` expected `isLoading` but `SubjectModal` and `RecordModal` passed `loading` prop -> button did not show loading spinner and was not disabled during mutation, allowing rapid double-submits.<br>3. No duplicate check existed in backend or frontend -> accidental duplicates like "data sceinece" could be created.<br>4. Queries in `SubjectsPage.jsx` were not scoped to `user?.uid`, leaving potential stale cache between logins.<br>5. Delete action lacked immediate optimistic cache filter.<br>6. Modals lacked max-height boundary for narrow mobile viewports. |
| Fixes applied & verified | 1. **Creation & Persistence**: Subject saves to MongoDB Atlas via `POST /api/subjects` (name, code, credits, targetGrade, color, syllabusTopics). Verified via automated script `test_subject_management.js`.<br>2. **Immediate list reflection**: Scoped query keys to `['subjects', user?.uid]`, updated `queryClient.setQueryData` on create, edit, and delete so UI reflects changes with 0ms lag before network refetch.<br>3. **Duplicate Prevention**: Backend throws `409 CONFLICT` if a subject with the same name and code exists for that user (`userId`). Frontend `SubjectModal` displays an inline warning banner and disables submit if name and code match an existing course.<br>4. **Double-submit protection**: `Button.jsx` now aliases both `isLoading` and `loading`. Submit button displays a spinner and disables while pending; modal closes immediately on success with success toast.<br>5. **Validation & Errors**: Form validates required name with inline error; backend 409 and 400 errors are surfaced in toast.<br>6. **User Isolation**: Verified that User B's GET query never returns User A's subjects.<br>7. **Edit & Delete**: Editing persists targetGrade, credits, and syllabus topics. Deleting cascades to academic records and removes from cache immediately.<br>8. **Responsiveness (360px–1024px+)**: `Modal.jsx` updated with `max-h-[92vh]` and `overflow-y-auto`. `SubjectModal` uses `grid-cols-1 sm:grid-cols-2`. Topic delete icon made accessible on mobile touchscreens without requiring mouse hover. |
| Actual test results | **All 7 automated API & DB tests passed** in `server/scripts/test_subject_management.js` and all 38 tests passed in `test_e2e_regression.js`. |

---

### Academic Goals Bug — Form shows "84" but badge shows "No goals set"

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| File | `client/src/pages/app/ProfilePage.jsx` |
| Root cause VERIFIED | When a student saved their profile with academic goals (e.g. "84"), `refreshProfile()` crashed inside `onSuccess` with a TypeError, failing to update the UI and leaving the pill showing "No goals set". Form values also assumed `profile.goals` was always an array, risking join errors on unexpected shapes. |
| Fix applied | 1. In `useForm` values: `goals: Array.isArray(profile.goals) ? profile.goals.join(', ') : (profile.goals ?? '')`.<br>2. In `onSubmit`: `goals: data.goals ? data.goals.split(',').map((g) => g.trim()).filter(Boolean) : []`.<br>3. In Hero quick stats pill: `{ icon: Target, label: profile?.goals?.length ? `${profile.goals.length} ${profile.goals.length === 1 ? 'goal' : 'goals'}` : 'No goals set' }`.<br>4. Mutation updates both React Query cache and `AuthContext` profile on save. |

---

### Avatar "Remove photo" overlapping Camera Button

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| File | `client/src/pages/app/ProfilePage.jsx` lines 244–310 |
| Root cause VERIFIED | The camera button was positioned `absolute -bottom-1.5 -right-1.5` on the outer wrapper that contained both the 24x24 avatar square AND the "Remove photo" button. Expanding the container with the remove button caused the camera button to overlap the remove text. |
| Fix applied | Separated the avatar box into a flex column: inner `<div className="relative">` wraps strictly the avatar image and camera badge (anchored to the bottom-right of the avatar square). The "Remove photo" button sits below in the column flow. Added file input reset (`e.target.value = ''`), validation (<10MB, `image/*`), and disabled/loading state during upload. |

---

### Issue 9 — Mobile hamburger menu not opening

| Field | Detail |
|---|---|
| Status | VERIFIED in Phase 6 |
| Files | `AppLayout.jsx`, `TopBar.jsx`, `Sidebar.jsx` |
| Analysis & Fix | 1. Resolved `hidden md:flex` on `Sidebar` which hid it inside mobile drawer. Added `isMobile={true}` mobile variant with explicit close button (`X`), 44px min touch targets, and auto-close on link navigation or logout.<br>2. `AppLayout.jsx` wired Escape key listener, backdrop click dismiss, body scroll lock (`overflow: hidden`), and focus restoration.<br>3. `TopBar.jsx` wired `aria-label`, `aria-expanded`, and `aria-controls` with 44px touch targets. Desktop sidebar preserved unchanged. |

---

## Key Architecture Notes

### Profile Single Source of Truth
```
AuthContext.jsx
  ├── state: profile, profileLoading
  ├── function: refreshProfile() -> GET /api/profile
  ├── auto-fetches on onAuthStateChanged(auth, user)
  └── consumes everywhere: TopBar, Sidebar, Dashboard, ProfilePage
```

### Logout flow (Phase 1 fix preserved)
```
User clicks logout
  -> await signOut(auth)          [Firebase]
  -> onAuthStateChanged fires     [Firebase -> AuthContext]
  -> setUser(null), setProfile(null) [AuthContext]
  -> React re-renders
  -> ProtectedRoute sees user=null
  -> Navigate to="/login" replace  [clean single redirect]
```

---

## Files Changed in Phase 1 & 2A

| File | Phase | Change |
|---|---|---|
| `client/src/components/ui/Toast.jsx` | 1 | Added `addToast(message, type)` positional alias |
| `client/src/pages/auth/LoginPage.jsx` | 1 | "Create account" link color: #84A282 -> #2563EB (blue) |
| `client/src/pages/auth/RegisterPage.jsx` | 1 | "Sign in" link: text-accent class -> style={{ color: '#2563EB' }} (blue) |
| `client/src/components/layout/TopBar.jsx` | 1, 2A | Removed race condition from logout; fixed display name priority (profile first) |
| `client/src/components/layout/Sidebar.jsx` | 1, 2A | Removed race condition from logout; fixed display name priority; connected profile avatar |
| `client/src/pages/LandingPage.jsx` | 1 | Feature card: added p-6 padding class |
| `client/src/utils/firebaseErrors.js` | 1 | Added 5 missing error codes; dev fallback now shows [auth/CODE] |
| `client/src/context/AuthContext.jsx` | 2A | Added `profile` state, `refreshProfile()`, `setProfile()`, auto-fetch on auth |
| `client/src/pages/app/DashboardPage.jsx` | 2A | Unified banner displayName and avatar with AuthContext profile |
| `client/src/pages/app/ProfilePage.jsx` | 2A | Fixed onSuccess handler, goals parsing/badge, avatar overlap, upload validation |
| `client/src/pages/app/SubjectsPage.jsx` | 2A | Added immediate `setQueryData` cache update on subject creation/edit |

---

## Phase 2B — Phone Sign-In Implementation Details

### Architecture & Requirements Met
1. **Zero Degradation to Existing Auth**:
   - Email/password authentication and Google OAuth popup flow remain completely intact and default.
   - Below Google button, added clean botanical divider and "Try another way" expanding button revealing "Continue with phone (OTP)".
2. **Step 1: Phone Input**:
   - Country code selector with default `+91` (India) and international catalogue (US, UK, CA, AE, SG, etc.).
   - Phone input with national number formatting and strict E.164 compliance (`isValidE164`).
   - "Send OTP" button with invisible `RecaptchaVerifier` lifecycle management and container isolation.
3. **Step 2: 6-Digit Segmented OTP Verification**:
   - Implemented in dedicated `OtpInput.jsx`: 6 isolated boxes with min 44px touch targets.
   - Features: paste auto-distribution, backspace navigation, arrow key traversal, `autocomplete="one-time-code"`, and `inputMode="numeric"`.
   - Number masked for user privacy (e.g. `+91 98••••••12`) via `maskPhoneNumber`.
   - Resend code countdown with 30-60s cooldown timer.
   - "Change number" and "Back to email sign in" links.
4. **Step 3: New Phone User Onboarding**:
   - If a new phone user does not have an established name, an inline step prompts for their full name and updates their profile before navigating to the dashboard.
5. **Profile Phone Verification & Linking**:
   - Added dedicated "Phone Verification" section to `ProfilePage.jsx`.
   - Uses `linkWithPhoneNumber(auth.currentUser, ...)` with full OTP verification.
   - Displays a green "Verified" badge with `ShieldCheck` once linked.
   - Handles `auth/credential-already-in-use` and `auth/provider-already-linked` gracefully.
6. **Phone-Only User Fallback Protection**:
   - Added `getSafeDisplayName`, `getSafeUserIdentifier`, and `isSyntheticEmail` in `phoneUtils.js`.
   - Verified that `TopBar.jsx`, `Sidebar.jsx`, `DashboardPage.jsx`, and `ProfilePage.jsx` never display `@phone.user` or `@firebase.user` synthetic email prefixes as names or subtitles.
7. **Firebase & Authorized Domain Requirements**:
   - reCAPTCHA requires an authorized domain in Firebase Console (`localhost`, `127.0.0.1`, and production domain).
   - In Firebase Console -> Authentication -> Sign-in method -> Phone:
     - Real SMS requires SMS quota/billing.
     - For testing without SMS quota, configure "Phone numbers for testing" with predefined verification codes (e.g., test numbers specified in Firebase console).
   - Test numbers are never hardcoded in source.

### Files Changed in Phase 2B
| File | Change |
|---|---|
| `server/src/models/StudentProfile.js` | Added `phoneNumber` field to schema |
| `server/src/controllers/profile.controller.js` | Added `phoneNumber` validation to `updateProfileSchema` |
| `server/src/controllers/dashboard.controller.js` | Returned `phoneNumber` in dashboard profile payload |
| `server/src/middleware/authenticate.js` | Handled phone-only tokens (`phone_number`), synthesized clean email fallback (`<digits>@phone.user`) |
| `client/src/utils/phoneUtils.js` | Country codes, E.164 validation, phone masking (`+91 98••••••12`), safe display name & identifier helpers |
| `client/src/utils/firebaseErrors.js` | Added phone auth error codes (`auth/invalid-phone-number`, `auth/code-expired`, `auth/provider-already-linked`, etc.) |
| `client/src/components/auth/OtpInput.jsx` | 6-box segmented OTP component with paste support & 44px min touch target |
| `client/src/components/auth/PhoneAuthFlow.jsx` | Complete phone auth state machine (`signIn` & `link` modes, RecaptchaVerifier, cooldown, new user name prompt) |
| `client/src/pages/auth/LoginPage.jsx` | Added "Try another way" divider/button and `PhoneAuthFlow` toggle |
| `client/src/pages/auth/RegisterPage.jsx` | Added "Try another way" divider/button and `PhoneAuthFlow` toggle |
| `client/src/pages/app/ProfilePage.jsx` | Added Phone Verification section, "Verified" badge, phone linking flow, safe fallback identifiers |
| `client/src/components/layout/TopBar.jsx` | Used `getSafeDisplayName` and `getSafeUserIdentifier` |
| `client/src/components/layout/Sidebar.jsx` | Used `getSafeDisplayName` |
| `client/src/pages/app/DashboardPage.jsx` | Used `getSafeDisplayName` |


### Phase 4 - Main page responsive layout and auth link styling

| Field | Detail |
|---|---|
| Status | DONE - Build: 0 errors |
| Files changed | LandingPage.jsx, LoginPage.jsx, RegisterPage.jsx, styles/index.css |
| (a) Responsive layout | Nav: logo text hidden below sm to avoid overflow; Join free button on mobile; shrink-0 on button group. All sections: px-6 to px-4 sm:px-6 (16px mobile margin). Hero: pt-32 pb-24 to pt-28 sm:pt-32 pb-20 sm:pb-24. Feature cards: p-6 to p-5 sm:p-6; gap-4 to gap-4 sm:gap-5; added shrink-0 on icon box, min-w-0 on text div. CTA: p-10 md:p-14 to p-6 sm:p-10 md:p-14. Section py-20 to py-16 sm:py-20. Footer: px-4 sm:px-6 py-6 sm:py-8. |
| (b) Auth link styling | Added .auth-link CSS class in index.css @layer components. States: default #2563EB (blue-600), hover #1D4ED8 + underline, focus-visible outline 2px #2563EB (WCAG 2.4.7), active #1E3A8A, aria-disabled #93C5FD. Removed inline style= color from LoginPage and RegisterPage. Added aria-disabled={isBusy ? 'true' : undefined} on both links. |
### Phase 5 — Mobile and responsive navigation

| Field | Detail |
|---|---|
| Status | DONE — Build: 0 errors |
| Files changed | `client/src/components/layout/Sidebar.jsx`, `client/src/components/layout/AppLayout.jsx`, `client/src/components/layout/TopBar.jsx`, `client/src/components/ui/Modal.jsx`, `client/src/pages/app/DashboardPage.jsx`, `client/src/pages/app/SubjectsPage.jsx`, `client/src/pages/app/subjects/RecordModal.jsx`, `client/src/pages/app/ProfilePage.jsx`, `client/src/pages/app/RemindersPage.jsx`, `client/src/pages/auth/LoginPage.jsx`, `client/src/pages/auth/RegisterPage.jsx` |
| (a) Mobile hamburger menu | Fixed critical bug where `Sidebar` had hardcoded `hidden md:flex` making it invisible on mobile screens. Built dedicated mobile drawer variant in `Sidebar.jsx` with `isMobile={true}`: explicit close button (`X`), 44px minimum touch targets, auto-close on link navigation or logout, and omission of the desktop collapse toggle. Desktop sidebar remains 100% unchanged (`hidden md:flex`, 64px/224px collapsible). |
| (b) Drawer behavior & accessibility | Added `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile navigation"`. Connected `aria-expanded` and `aria-controls` on the `TopBar` hamburger button (`min-h-[44px] min-w-[44px]`). Added `keydown` listener for Escape key to close the drawer, backdrop click handler, and automatic focus restoration to the hamburger trigger button upon drawer dismissal. Locked `document.body.style.overflow = 'hidden'` while the drawer is open to prevent background scrolling. |
| (c) Responsive pass across all pages | **DashboardPage**: Banner padding scaled (`p-4 sm:p-6 md:p-8`), action buttons wrapped cleanly with `flex-wrap sm:flex-nowrap`, KPI cards updated to `p-3 sm:p-4` with compact icons (`h-9 w-9 sm:h-10 sm:w-10`) preventing text overflow at 320-360px.<br>**SubjectsPage**: Header buttons adapted to full-width flex on mobile (`flex-1 sm:flex-initial min-h-[38px]`); stat strip cards reflowed with compact padding and truncated titles.<br>**ProfilePage**: Hero card padding updated (`p-4 sm:p-6 md:p-8`), save bar converted to `flex-col-reverse sm:flex-row` with 44px touch targets on both Discard and Save buttons.<br>**Modals (`Modal.jsx`, `RecordModal.jsx`, `RemindersPage.jsx`)**: Updated outer padding to `p-2 sm:p-4` so modal panels gain full width on 320px screens; close buttons updated to 36-44px touch targets; multi-column input grids converted to `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 xs:grid-cols-3` to prevent crushed inputs; modal panels capped at `max-h-[92vh]` with internal `overflow-y-auto`.<br>**Auth Pages (`LoginPage.jsx`, `RegisterPage.jsx`)**: Scaled outer padding to `px-3.5 sm:px-4 py-6 sm:py-12` and card inner padding to `p-5 sm:p-8`, eliminating horizontal scrollbars and fitting all screen widths from 320px to 1440px+. |
| Breakpoints verified | 320-360px (narrow mobile), 375-430px (standard mobile), 768px (tablet portrait), 1024+px (desktop). Zero horizontal scroll, all touch targets >= 38-44px, all forms and modals fit viewports. |
| Build verification | Vite build: 3164 modules transformed, 0 errors. |

---

### Phase 5 (Polish) — Mobile drawer sizing & profile name skeleton

| Field | Detail |
|---|---|
| Status | DONE — Verified with Chrome CDP automated browser measurements & Vite build: 0 errors (11.17s) |
| Files changed | `client/src/components/layout/Sidebar.jsx`, `client/src/components/layout/AppLayout.jsx`, `client/src/context/AuthContext.jsx` |
| Real root causes identified | 1. **Drawer width & cascade**: The outermost drawer panel required explicit `style={{ width: 'min(17rem, 85vw)', maxWidth: '85vw' }}` and the inner `<aside>` had to be strictly `w-full` (100% width) with zero fixed width leaking from desktop sidebar classes.<br>2. **Items padding**: Header was previously 68px (`py-4`); reduced to 56px (`h-14 px-3.5`). Nav items were `gap-3`; compacted to `gap-2`, `h-[44px] min-h-[44px]`, `text-sm` (14px), and 18px icons.<br>3. **Profile footer "Student"**: In `AuthContext.jsx`, `onAuthStateChanged` was NOT toggling `profileLoading = true` during initial mount, so `profileLoading` remained `false` while `profile` was still `null`. `getSafeDisplayName` defaulted to `"Student"` before the network response returned. Both `AuthContext.jsx` and `Sidebar.jsx` (mobile and desktop) now guard with `isProfileLoading` to display animated skeleton placeholders until the profile data is resolved. |
| Measured results via Chrome CDP | • **360×640 (Compact mobile)**: Outer drawer panel: **272px** (max-w: 306px), Inner `<aside>`: **272px**, Header: **56px**, Close (X) button: **40×40px**, Nav items: **44px** (Font: 14px, Gap: 8px, Icon: 18px), Nav scrollable: `auto`, Footer & Logout: **✅ Pinned in viewport**.<br>• **390×844 (iPhone 12/13/14)**: Outer: **272px**, Inner: **272px**, Header: **56px**, Close: **40×40px**, Nav: **44px**, Footer visible: **✅ Pinned in viewport**.<br>• **432×689 (Android standard)**: Outer: **272px**, Inner: **272px**, Header: **56px**, Close: **40×40px**, Nav: **44px**, Footer visible: **✅ Pinned in viewport**.<br>• **540×800 (User-reported width)**: Outer: **272px** (max-w: 459px), Inner: **272px**, Header: **56px**, Close: **40×40px**, Nav: **44px**, Footer visible: **✅ Pinned in viewport**.<br>• **768×1024 (Desktop breakpoint)**: Desktop sidebar: **VISIBLE**, computed width: **224px** (rect: **224px**), Desktop sidebar unchanged: **✅ YES (224px)**. |
| Profile skeleton & name | Shows pulse skeleton while `profileLoading || (!profile && user)`. Displays `profile.displayName` once resolved. "Student" fallback is never displayed during profile resolution. |


| Field | Detail |
|---|---|
| Status | DONE — 100% PASS |
| Test Suites | 1. `server/scripts/test_subject_management.js` (7/7 PASS)<br>2. `server/scripts/test_e2e_regression.js` (38/38 PASS)<br>3. `server/scripts/test_firebase_auth_e2e.js` (All PASS) |
| Lint Checks | `client`: ESLint 0 errors, 45 warnings (all unused vars/hooks).<br>`server`: ESLint 0 errors, 10 warnings. |
| Production Build | `client`: Vite build succeeded with 0 errors in 7.28s (3164 modules transformed). Latest build after Phase 5 Polish also 0 errors. |
| All 9 Issues | **All 9 issues VERIFIED with live database, API, and client proof.** |

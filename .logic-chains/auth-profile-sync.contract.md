# Logic Chain Contract: AuthProfileSync

**Version**: 1.0
**Owner**: src/lib/auth.tsx (AuthProvider)
**Status**: Implementation Required

---

## 1. Chain Identity

**ChainName**: AuthProfileSync
**Trigger**: `supabase.auth.onAuthStateChange` callback (auth.tsx:85)
**Entry Point**: `fetchProfile(userId: string, email: string)` (auth.tsx:39)

---

## 2. Inputs

### DTO Shape
```typescript
{
  userId: string;      // Supabase user.id (UUID)
  email: string;       // user.email (validated by Supabase)
}
```

### Normalization Rules
- `userId`: Must be non-empty UUID (enforced by Supabase)
- `email`: Must contain `@` for username derivation (enforced by Supabase auth)
- No additional normalization required at boundary (Supabase guarantees valid values)

### Invariants (Preconditions)
- **Domain invariant**: `userId` corresponds to an authenticated Supabase session
- **Boundary invariant**: `email` is a valid email string
- **Infra invariant**: Supabase client is initialized and connected

---

## 3. Outputs / Resolution

### Return Type
```typescript
Promise<void>  // Side effects only (setProfile state update)
```

### Terminal States
1. **Success (Update)**: Profile row exists → `last_seen_at` updated → `setProfile(updated)`
2. **Success (Insert)**: No row exists → profile created → `setProfile(inserted)`
3. **Failure (Insert)**: Insert fails → warning logged → `setProfile` NOT called (degraded state)
4. **Failure (Update)**: Update returns null → assumed no row → proceeds to insert path

---

## 4. State Machine

### Ordered Steps

#### Step 1: Targeted Update
**Name**: `UpdateLastSeen`
**Inputs**: `userId`, `now` (ISO timestamp)
**Invariants**:
- Update is atomic (single SQL UPDATE)
- Only `last_seen_at` modified (preserves user-customized `username`)
**State Mutation**: None (read-only from chain perspective)
**Side Effects**:
- DB write: `profiles.last_seen_at = now WHERE id = userId`
- If row exists: returns `updated` record
- If row missing: returns `null`

#### Step 2: Check Update Result
**Name**: `CheckUpdateSuccess`
**Inputs**: `updated` (Profile | null)
**Invariants**:
- `updated !== null` → profile exists → transition to Success(Update)
- `updated === null` → profile missing → transition to Step 3
**State Mutation**: If `updated`, call `setProfile(updated)`
**Side Effects**: None

#### Step 3: Insert New Profile
**Name**: `InsertProfile`
**Inputs**: `userId`, `email`, `now`
**Invariants**:
- Username derived from email prefix: `email.split("@")[0]`
- Insert is atomic
- Duplicate key conflicts handled by DB (idempotent)
**State Mutation**: None (pending result)
**Side Effects**:
- DB write: `INSERT INTO profiles (id, username, last_seen_at) VALUES (...)`
- Returns `{ data: inserted, error }`

#### Step 4: Handle Insert Result
**Name**: `HandleInsertResult`
**Inputs**: `inserted` (Profile | null), `error` (PostgrestError | null)
**Invariants**:
- If `error`, log warning and return (non-fatal)
- If `inserted`, call `setProfile(inserted)`
**State Mutation**: If `inserted`, call `setProfile(inserted)`
**Side Effects**:
- Console log: `[void] Profile sync failed — continuing with degraded profile.` (if error)

---

## 5. Invariants (Research-Grade)

### Domain Invariants (Must Never Be Violated)
1. **Profile Existence**: After successful auth, profile row MUST exist (eventually consistent)
2. **Username Preservation**: Targeted update MUST NOT overwrite user-customized `username` (BUG-03)
3. **State Consistency**: `setProfile` MUST be called iff DB operation succeeds
4. **Non-Fatal Degradation**: Insert failure MUST NOT block authentication

### Boundary Invariants
1. **Input Validity**: `userId` is valid UUID (guaranteed by Supabase)
2. **Email Format**: `email` contains `@` for username derivation

### Infra Invariants
1. **DB Connection**: Supabase client connected
2. **Atomic Writes**: Each DB operation is atomic (no torn writes within operation)
3. **Idempotency**: Duplicate insert attempts handled by DB unique constraint

---

## 6. Failure Semantics

### Typed Error Taxonomy

#### UpdateFailure (non-error)
- **Condition**: Update returns `null` (row does not exist)
- **Classification**: Non-retryable (expected path for new users)
- **State Impact**: Proceed to insert path
- **Retryability**: N/A (not an error)

#### InsertFailure
- **Condition**: Insert returns `{ error }`
- **Classification**:
  - Retryable transient: network timeout, connection loss
  - Retryable safe: idempotent (duplicate key conflict)
  - Non-retryable: permission denied, schema mismatch
- **State Impact**: Profile remains `null` (degraded state)
- **Retryability**: Safe to retry (idempotent insert), but NOT implemented (non-fatal)

### Failure State Transitions
- **UpdateFailure** → InsertProfile (Step 3)
- **InsertFailure** → Degraded (profile=null, user authenticated, console warning)

---

## 7. Idempotency & Concurrency Model

### Idempotency Key
None required — DB operations are naturally idempotent:
- Update: `WHERE id = userId` (upsert-like; repeated calls safe)
- Insert: `id` is primary key (duplicate inserts fail gracefully)

### Concurrency Expectations
**Known Hazard (LC-A)**: `fetchProfile` may be invoked twice concurrently on session restore due to Supabase v2 `onAuthStateChange` firing `INITIAL_SESSION` immediately on subscribe.

**Current State**: Fixed by removing redundant `getSession()` call (auth.tsx:83 comment)

**Concurrency Model**:
- **Race condition**: Two concurrent updates are safe (last-write-wins on `last_seen_at`)
- **Race condition**: Two concurrent inserts trigger unique constraint violation on second insert (handled by `.maybeSingle()` / error path)
- **Mitigation**: Single listener (no duplicate `getSession()`) reduces likelihood

### Duplicate Delivery Handling
- **At-Least-Once**: Auth state changes may fire multiple times (session refresh, token renewal)
- **Handling**: Updates are idempotent; inserts are deduplicated by DB

---

## 8. Atomicity Boundaries

### Atomic Units
1. **Update Operation**: Single SQL UPDATE (atomic at DB level)
2. **Insert Operation**: Single SQL INSERT (atomic at DB level)

### Partial Success Scenarios
- **Allowed**: Update succeeds, but `setProfile` skipped (React state update)
- **Allowed**: Insert fails, user remains authenticated (degraded profile state)

### Compensations
None — non-fatal failures are acceptable (logged and degraded gracefully)

### Audit Trail
- Console warning: `[void] Profile sync failed — continuing with degraded profile.` (error.message)

---

## 9. Observability Contract

### Structured Logs (Required Fields)

#### Start Log
```typescript
console.debug('[AuthProfileSync] START', {
  userId,
  email_prefix: email.split('@')[0],
  timestamp: new Date().toISOString()
});
```

#### Step Transition Logs
```typescript
// After update
console.debug('[AuthProfileSync] UPDATE_RESULT', {
  userId,
  updated: !!updated,
  timestamp: new Date().toISOString()
});

// Before insert
console.debug('[AuthProfileSync] INSERT_ATTEMPT', {
  userId,
  username: email.split('@')[0],
  timestamp: new Date().toISOString()
});

// After insert
console.debug('[AuthProfileSync] INSERT_RESULT', {
  userId,
  inserted: !!inserted,
  error: error?.message || null,
  timestamp: new Date().toISOString()
});
```

#### End Log (Always Fires)
```typescript
console.debug('[AuthProfileSync] END', {
  userId,
  outcome: 'success_update' | 'success_insert' | 'degraded_failure',
  profile_set: !!profile,
  timestamp: new Date().toISOString()
});
```

#### Error Classification Logs
```typescript
// On insert failure
console.warn('[void] Profile sync failed — continuing with degraded profile.', {
  userId,
  error: error.message,
  cause: error.code,
  timestamp: new Date().toISOString()
});
```

### Correlation Fields
- `userId`: primary correlation ID (links to Supabase user)
- `timestamp`: ISO 8601 timestamp for chronological ordering

### Metrics (Optional)
- Existing substrate does not support metrics
- If added: `auth_profile_sync_duration_ms`, `auth_profile_sync_failure_count`

---

## 10. Exit Criteria (Named Tests)

### Minimum Suite

#### Test 1: HappyPath_ExistingProfile
**Proves**: Update path succeeds, setProfile called with updated record
**Scenario**: User with existing profile logs in → `last_seen_at` updated
**Assertions**:
- Supabase `.update()` called with correct params
- `setProfile` called exactly once with updated profile
- No insert operation triggered

#### Test 2: HappyPath_NewProfile
**Proves**: Insert path succeeds, setProfile called with inserted record
**Scenario**: First-time user logs in → profile created
**Assertions**:
- Supabase `.update()` returns null (no existing row)
- Supabase `.insert()` called with derived username
- `setProfile` called exactly once with inserted profile

#### Test 3: InsertFailure_DegradedState
**Proves**: Insert error is non-fatal, setProfile NOT called
**Scenario**: DB insert fails (network error, permission denied)
**Assertions**:
- Console warning logged with error message
- `setProfile` NOT called
- Function returns without throwing

#### Test 4: Idempotency_DoubleInvocation
**Proves**: Concurrent double invocation is safe (no corruption)
**Scenario**: `fetchProfile` called twice with same userId concurrently
**Assertions**:
- Both calls complete without error
- `setProfile` called at least once (last-write-wins)
- No duplicate insert errors propagate

#### Test 5: UsernamePreservation_BUG03
**Proves**: Targeted update preserves user-customized username (BUG-03 regression guard)
**Scenario**: User with custom username logs in → update called, NOT upsert
**Assertions**:
- `.update()` called (not `.upsert()`)
- Only `last_seen_at` modified
- Username NOT overwritten

### Invariant-to-Test Mapping

| Invariant | Test |
|-----------|------|
| Profile Existence (eventual) | Test 1, Test 2 |
| Username Preservation (BUG-03) | Test 5 |
| State Consistency (setProfile) | Test 1, Test 2, Test 3 |
| Non-Fatal Degradation | Test 3 |
| Idempotency (concurrent calls) | Test 4 |

---

## 11. Known Limitations

1. **Concurrent Insert Race**: Two simultaneous first-logins could trigger duplicate insert attempts; second fails with unique constraint violation (handled by error path, but generates unnecessary DB error)
2. **No Retry Logic**: Transient failures (network timeouts) do not auto-retry; user must refresh page
3. **No Correlation ID Propagation**: Logs use `userId` but no session-level trace ID
4. **Update Failure Detection**: If update silently fails (permissions), chain assumes "no row" and attempts insert (may fail again)

---

## 12. Related Chains

- **Chain 2 (AppSelection)**: Depends on `user` state set by parent AuthProvider
- **Catalog UserSection**: Displays `profile.username` and `profile.created_at`

---

## Contract Sign-Off

This contract represents the acceptance specification for AuthProfileSync. Implementation must match this contract. Tests must prove all invariants.

**Contract Status**: ✅ Complete
**Implementation Status**: ⚠️  Requires observability enhancement
**Test Status**: ❌ Zero tests (requires full suite)
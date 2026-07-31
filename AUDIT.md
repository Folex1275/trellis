# Trellis Codebase Audit

> **Date:** 2026-07-30
> **Scope:** Full codebase audit — frontend (React/TypeScript), contracts (Soroban Rust), CLI (Rust)
> **Total Issues Found:** 69

---

## Summary

| Severity | Frontend | Contracts | CLI | Total |
|----------|----------|-----------|-----|-------|
| CRITICAL | 5        | 0         | 3   | 8     |
| HIGH     | 5        | 6         | 0   | 11    |
| MEDIUM   | 10       | 9         | 0   | 19    |
| LOW      | 20       | 8         | 3   | 31    |
| **Total**| **40**   | **23**    | **6**| **69**|

---

## CRITICAL ISSUES

### C-1. `ExplorerLink` missing import in `StatusPage.tsx`

- **File:** `frontend/src/pages/StatusPage.tsx` (lines 121, 125, 129, 133, 137)
- **Description:** `<ExplorerLink>` is used 5 times but never imported. This will cause a `ReferenceError` at runtime when rendering any agreement page.
- **Fix:** Add `import { ExplorerLink } from '../components/ExplorerLink'`

### C-2. `Buffer` is not defined in browser — `useAgreement.ts`

- **File:** `frontend/src/hooks/useAgreement.ts:15`
- **Description:** `Buffer.from(agreementId, 'hex')` — `Buffer` is a Node.js global and is not available in the browser. This will throw `ReferenceError: Buffer is not defined`.
- **Fix:** Replace with `Uint8Array`-based hex decoding, or add `import { Buffer } from 'buffer'` and configure Vite to provide the `buffer` polyfill via `vite.config.ts`.

### C-3. `Buffer` is not defined in browser — `useAgreementEvents.ts`

- **File:** `frontend/src/hooks/useAgreementEvents.ts:35`
- **Description:** Same `Buffer.from(agreementId, 'hex')` issue. Will crash at runtime.
- **Fix:** Same as C-2.

### C-4. `Buffer` is not defined in browser — `MilestoneActions.tsx`

- **File:** `frontend/src/components/MilestoneActions.tsx:33, 55, 80, 102`
- **Description:** `Buffer.from(agreement.agreement_id, 'hex')` used in 4 places. Will crash at runtime.
- **Fix:** Same as C-2.

### C-5. `__APP_VERSION__` is not defined

- **File:** `frontend/src/App.tsx:55`
- **Description:** `__APP_VERSION__` is used as a Vite global but it is never defined in `vite.config.ts`. This will throw a `ReferenceError` at runtime.
- **Fix:** Define it in `vite.config.ts` via the `define` option, or use `import.meta.env.VITE_APP_VERSION`.

### C-6. `confirm_action` function does not exist — CLI will not compile

- **File:** `cli/trellis_cli/src/commands/mod.rs:352, 420, 515`
- **Description:** `confirm_action(...)` is called in three places (`run_init`, `run_submit_work`, `run_resolve_dispute`) but the function is never defined. This will cause a **compilation failure**.
- **Fix:** Define the `confirm_action` helper function.

### C-7. `yes` variable used but not in scope — CLI will not compile

- **File:** `cli/trellis_cli/src/commands/mod.rs:357, 422, 519`
- **Description:** `confirm_action(..., yes)` is called but `yes` is not a parameter of `run_init`, `run_submit_work`, or `run_resolve_dispute`, and the dispatch match arms (lines 220, 239, 256) do not destructure `yes` from the command structs. This will cause a **compilation failure**.
- **Fix:** Add `yes: bool` parameter to each function and pass it from the dispatch match arms.

### C-8. Extra quotes wrapping `agreement_id` in `run_milestone_status`

- **File:** `cli/trellis_cli/src/commands/mod.rs:591`
- **Description:** `format!("\"{}\"", agreement_id)` wraps the agreement ID in literal double-quote characters. When passed via `Command::new("stellar").args(...)`, the quotes are part of the argument value, not shell escaping. The `stellar` CLI will receive `--agreement-id "0x..."` with literal quotes, causing the invocation to fail.
- **Fix:** Use `agreement_id` directly without wrapping quotes:
  ```rust
  "--agreement-id".to_string(),
  agreement_id,
  ```

---

## HIGH SEVERITY ISSUES

### H-1. `verbatimModuleSyntax` violation in `ThemeContext.tsx`

- **File:** `frontend/src/context/ThemeContext.tsx:1`
- **Description:** `import { ..., ReactNode } from 'react'` — `ReactNode` is a **type-only** export. With `"verbatimModuleSyntax": true` in `tsconfig.app.json`, TypeScript emits this import as-is into JavaScript, causing a runtime error because `ReactNode` is not a value.
- **Fix:** Change to `import { ..., type ReactNode } from 'react'`.

### H-2. `BigInt(non-integer)` throws on fractional amounts

- **File:** `frontend/src/pages/CreateAgreementPage.tsx:96` (also `CreatePage.tsx` if similar)
- **Description:** `BigInt(parseFloat(m.amount) * 1e7)` — floating point multiplication like `0.1 * 1e7` produces `1000000.0000000001`, which throws `TypeError: Cannot convert 1000000.0000000001 to a BigInt`.
- **Fix:** `BigInt(Math.round(parseFloat(m.amount) * 1e7))`

### H-3. Wrong validator for token/contract addresses

- **File:** `frontend/src/pages/CreateAgreementPage.tsx:47`
- **Description:** `StrKey.decodeEd25519PublicKey(address)` validates G... addresses (Ed25519 public keys), but `formData.token` is a contract ID (C...). Contract IDs use `StrKey.decodeContractId`. This will reject valid contract addresses.
- **Fix:** Use `StrKey.isValidContractId` for the token field.

### H-4. Wrong explorer entity type for agreement ID

- **File:** `frontend/src/pages/AgreementHistoryPage.tsx:115`
- **Description:** `ExplorerLink type="contract" value={entry.agreementId}` — the agreement ID is a 64-char hex string, not a Stellar contract ID (C...). This creates a link to a non-existent contract page on Stellar Expert (404).
- **Fix:** Remove the `ExplorerLink` for agreement IDs, or use a custom explorer type.

### H-5. Navbar test expects ALL links to match Stellar Expert

- **File:** `frontend/src/components/Navbar.test.tsx:35`
- **Description:** The test asserts `link.getAttribute('href')` matches `/^https:\/\/stellar\.expert\/explorer\//` for ALL links, but the Navbar contains `<Link>` components with internal paths like `/`, `/create`, `/status`, `/history` which render as `<a href="/">` etc. These will fail the regex.
- **Fix:** Filter out internal links or use a more specific selector.

### H-6. Missing space in CSS class name in `HowItWorks.tsx`

- **File:** `frontend/src/components/HowItWorks.tsx:64`
- **Description:** `text-navy-900${typeof step.icon === 'string' ? ' font-bold text-sm' : ''}` — the `${` immediately follows `900` with no space, producing `text-navy-900font-bold text-sm` (joined `900font`). This class will be ignored by Tailwind.
- **Fix:** Add a space: `text-navy-900 ${typeof step.icon === 'string' ? 'font-bold text-sm' : ''}`

### H-7. `.env` file committed to version control (or at risk of being)

- **File:** `contracts/trellis_core/.env`
- **Description:** The `.env` file contains `TRELLIS_CONTRACT_ID`, `STELLAR_RPC_URL`, `STELLAR_NETWORK_PASSPHRASE`, and `TRELLIS_SOURCE_KEY`. While `.gitignore` currently excludes it, the `.env.example` explicitly warns "Never commit a .env file that contains real secret keys." The pattern is dangerous — one misconfigured git command could leak secrets.
- **Fix:** Ensure `.env` remains in `.gitignore`. Consider using `git secret` or GitHub Actions secrets for CI. Add a pre-commit hook.

### H-8. Secret key passed as CLI argument (visible in process list)

- **File:** `cli/trellis_cli/src/rpc.rs:62-64`
- **Description:** `TRELLIS_SOURCE_KEY` can be either a named identity (safe) or a raw `S...` secret key. If it's a raw secret key, it is passed as a command-line argument to `stellar contract invoke`, which is visible to all users on the system via `ps`/`procfs`.
- **Fix:** Use a temporary file or environment variable to pass the secret key, or validate that the value is not an `S...` key at the config level.

### H-9. `test_happy_path` event assertion is effectively a no-op

- **File:** `contracts/trellis_core/src/test.rs:132-136`
- **Description:** The comment at line 130 states "env.events().all() returns an empty vec when mock_all_auths is used." So the test passes with zero events emitted. No event content is actually verified. The test only checks `>= 4`, not exact event names or data.
- **Fix:** Use `env.mock_all_auths_allowing_non_root_auth()` or capture events without mocking all auths. Add explicit event assertions for each emitted event.

### H-10. No authorization tests — `mock_all_auths` bypasses all auth checks

- **File:** `contracts/trellis_core/src/test.rs:46`
- **Description:** `env.mock_all_auths()` is used in `setup()` and every test inherits it. Tests never verify that `require_auth()` is correctly called with the right addresses. There are no tests for `Unauthorized` errors, no tests where an attacker tries to call a payer-only function as the payee.
- **Fix:** Add tests that call functions without appropriate authorization and verify `TrellisError::Unauthorized` is returned. Use targeted auth mocking.

### H-11. CONTRIBUTING.md lists tests that don't exist

- **File:** `CONTRIBUTING.md:113-116`
- **Description:** Lists 4 tests that are not present in `test.rs`:
  - `test_init_empty_milestones_fails`
  - `test_payer_as_resolver_rejected`
  - `test_payee_as_resolver_rejected`
  - `test_dispute_raised_event_includes_caller`
- **Fix:** Either implement the missing tests or update the documentation.

---

## MEDIUM SEVERITY ISSUES

### M-1. `StatusPage.tsx` — `useEffect` has stale closure on `initialId`

- **File:** `frontend/src/pages/StatusPage.tsx:64-69`
- **Description:** The `useEffect` has empty deps `[]` but captures `initialId` and `agreement` from the closure. If the URL param changes from `/agreement/abc` to `/agreement/def`, the effect won't re-run.
- **Fix:** Add `[initialId]` to the dependency array.

### M-2. Unsafe `as Transaction` cast in `useContractInvoke.ts`

- **File:** `frontend/src/hooks/useContractInvoke.ts:83`
- **Description:** `TransactionBuilder.fromXDR(...)` can return `Transaction | FeeBumpTransaction`. The `as Transaction` assertion will be wrong for fee bump transactions.
- **Fix:** Handle both types or add a runtime check.

### M-3. Unsafe `as T` type assertion in `useContractRead.ts`

- **File:** `frontend/src/hooks/useContractRead.ts:73`
- **Description:** `setData(resultValue as T)` — the ScVal result is cast to the generic type `T` with no runtime validation. A contract schema change could produce unexpected data shapes silently.
- **Fix:** Add runtime parsing/validation, or use a known type instead of generic `T`.

### M-4. Dead code guard in `useContractStats.ts`

- **File:** `frontend/src/hooks/useContractStats.ts:151`
- **Description:** `if (!CONTRACT_ID || !RPC_URL)` — `CONTRACT_ID` and `RPC_URL` are module-level constants from `validateEnv()` which throws if they are falsy. They can never be falsy at runtime.
- **Fix:** Remove the dead code guard.

### M-5. Dead code `!!NETWORK_PASSPHRASE` in `WalletContext.tsx`

- **File:** `frontend/src/context/WalletContext.tsx:200-204`
- **Description:** `!!NETWORK_PASSPHRASE` is always `true` since `validateEnv()` throws if falsy.
- **Fix:** Remove `!!NETWORK_PASSPHRASE &&`.

### M-6. Deprecated `onKeyPress` in `AgreementStatusPage.tsx`

- **File:** `frontend/src/pages/AgreementStatusPage.tsx:27`
- **Description:** `onKeyPress` is deprecated in React 17+ and removed in React 19.
- **Fix:** Use `onKeyDown` instead.

### M-7. `handleRetry` calls async functions without awaiting

- **File:** `frontend/src/components/MilestoneActions.tsx:119-125`
- **Description:** `handleRetry()` calls `handleLockFunds()` etc. which are `async` but the results are not awaited. Errors inside these would be unhandled promise rejections.
- **Fix:** Make `handleRetry` async and `await` the calls.

### M-8. `errorResult` could be undefined in `useContractInvoke.ts`

- **File:** `frontend/src/hooks/useContractInvoke.ts:90`
- **Description:** `sendResult.errorResult?.toXDR('base64')` — when `sendResult.status === 'ERROR'`, the `errorResult` field might still be undefined in some Soroban RPC responses, producing `"Transaction failed: undefined"`.
- **Fix:** Add a fallback error message.

### M-9. Flaky test due to `Promise.all` ordering

- **File:** `frontend/src/hooks/useContractStats.test.tsx:46-60`
- **Description:** The mock alternates response counts based on call order, but `Promise.all` in the actual code does not guarantee call order. The first `fetchEventCount('created')` and second `fetchEventCount('locked')` may execute in any order.
- **Fix:** Use a deterministic mock or match on the URL/body instead of call count.

### M-10. Mock doesn't produce real XDR in tests

- **File:** `frontend/src/hooks/useContractStats.test.tsx:20-28`
- **Description:** The mock for `@stellar/stellar-sdk` returns `Buffer.from(s).toString('base64')` which is not actual XDR base64 encoding.
- **Fix:** Use a more accurate mock or test against real encoding.

### M-11. Integer overflow in `validate_milestones` — no overflow checks in dev/test

- **Files:** `contracts/trellis_core/src/lib.rs:532`, `Cargo.toml:12-15`
- **Description:** `total += m.amount` — summing large `i128` amounts can overflow silently during development/testing. The release profile has `overflow-checks = true`, but dev/test do not.
- **Fix:** Use `total.checked_add(m.amount).ok_or(...)` or add `overflow-checks = true` to `[profile.dev]` and `[profile.test]`.

### M-12. `get_milestone` silently swallows `AgreementNotFound`

- **File:** `contracts/trellis_core/src/lib.rs:483-487`
- **Description:** If the agreement does not exist, `get_milestone` returns `None` — indistinguishable from a valid agreement with an out-of-range milestone ID.
- **Fix:** Return `Result<Option<Milestone>, TrellisError>` to distinguish errors.

### M-13. `is_transient_error` matches "network" substring too broadly

- **File:** `cli/trellis_cli/src/rpc.rs:216`
- **Description:** `lower.contains("network")` matches any error containing "network", including non-transient errors like "network passphrase mismatch".
- **Fix:** Use more specific patterns like `"network error"`, `"network timeout"`, or `"network unreachable"`.

### M-14. `extract_tx_hash` uses brittle string scanning

- **File:** `cli/trellis_cli/src/commands/mod.rs:805-815`
- **Description:** Scans stdout/stderr for any 64-character hex string and assumes it's the transaction hash. Could match false positives (e.g., a 64-char hex milestone ID, a log line containing a hex value).
- **Fix:** Parse the stellar CLI output for known structured patterns instead of scanning for any hex string.

### M-15. `extract_events` is similarly fragile

- **File:** `cli/trellis_cli/src/commands/mod.rs:819-831`
- **Description:** Matches any line containing the substring "event" case-insensitively. Will match lines like "no events found", "an unexpected event occurred", or "eventually".
- **Fix:** Parse the stellar CLI's structured event output format instead of substring matching.

### M-16. No validation of token address in `init`

- **File:** `contracts/trellis_core/src/lib.rs:54`
- **Description:** The `token` address parameter is stored as-is without verifying it's a valid Soroban token contract. If someone creates an agreement with a garbage token address, `lock_funds` will fail when attempting the cross-contract transfer, but the agreement will already exist in storage wasting space.
- **Fix:** Optionally call a view function on the token address (e.g., `token::Client::new(&env, &token).decimals()`) to verify it's a valid token contract during `init`.

### M-17. Inconsistent confirmation prompts across CLI commands

- **File:** `cli/trellis_cli/src/commands/mod.rs`
- **Description:** `run_init`, `run_submit_work`, `run_resolve_dispute` call `confirm_action`, but `run_lock_funds`, `run_approve_release`, `run_raise_dispute`, `run_cancel_milestone` do not. Some commands have a `--yes` flag that is never used.
- **Fix:** Either consistently prompt for all state-changing operations, or remove the `--yes`/`-y` flags.

### M-18. `render_json` uses `unwrap_or_default()` on JSON serialization

- **File:** `cli/trellis_cli/src/commands/mod.rs:709`
- **Description:** If `serde_json::to_string` fails, it silently prints an empty string. This could mask output errors.
- **Fix:** Handle the error explicitly or use `expect()` with a descriptive message.

### M-19. `build_milestones_json` puts amounts in JSON strings

- **File:** `cli/trellis_cli/src/commands/mod.rs:641`
- **Description:** Amounts are serialized as JSON strings (`"amount":"1000"`). This is correct for Soroban's `i128` JSON encoding convention, but the `stellar` CLI may or may not accept this format depending on the version.
- **Fix:** Verify that the `stellar` CLI version 26.x+ accepts quoted i128 values. If not, use unquoted integers.

---

## LOW SEVERITY ISSUES

### L-1. `router.ts` — Entire file is dead code

- **File:** `frontend/src/lib/router.ts`
- **Description:** This custom router module (`useRoute`, `useNavigate`, `subscribeToRoute`) is never imported anywhere. The app uses `react-router-dom` exclusively.
- **Fix:** Remove the file.

### L-2. `Layout.tsx` — Entire component is dead code

- **File:** `frontend/src/components/Layout.tsx`
- **Description:** Never imported or used. `App.tsx` renders `Navbar`, `NetworkBackground`, and footer manually.
- **Fix:** Remove the file.

### L-3. `AgreementStatusPage.tsx` — Entire page is dead code

- **File:** `frontend/src/pages/AgreementStatusPage.tsx`
- **Description:** Never imported in `App.tsx` or anywhere else. The route `/agreement/:id` maps to `StatusPage`, not `AgreementStatusPage`.
- **Fix:** Remove or wire up.

### L-4. `CreateAgreementPage.tsx` — Entire page is dead code

- **File:** `frontend/src/pages/CreateAgreementPage.tsx`
- **Description:** Never imported in `App.tsx` or anywhere else. The route `/create` maps to `CreatePage`, not `CreateAgreementPage`.
- **Fix:** Remove or wire up.

### L-5. `lib/useWallet.ts` — Confusing re-export pattern

- **File:** `frontend/src/lib/useWallet.ts`
- **Description:** Re-exports `useWallet` from `WalletContext` as `useWalletLegacy` and then re-exports it as `useWallet`. Creates ambiguity. `CreatePage.tsx` imports from `./lib/useWallet` while `CreateAgreementPage.tsx` imports from `../context/WalletContext`.
- **Fix:** Import directly from `WalletContext` everywhere and remove this file.

### L-6. `StatusPage.tsx` — `queryAgreement()` always throws

- **File:** `frontend/src/pages/StatusPage.tsx:203-207`
- **Description:** This is a stub that always throws an error. Any agreement lookup will fail.
- **Fix:** Implement the actual Soroban contract query.

### L-7. `StatusPage.tsx` — `queryEvents()` uses a stub

- **File:** `frontend/src/pages/StatusPage.tsx:209-235`
- **Description:** `queryEvents()` calls `sorobanServer.getEvents()` which is a stub returning `{ events: [] }`. Events will always be empty.
- **Fix:** Implement actual RPC event fetching.

### L-8. `CreatePage.tsx` — Form submission is entirely stubbed

- **File:** `frontend/src/pages/CreatePage.tsx:105`
- **Description:** The entire create agreement flow logs `"not yet implemented"` and sets an error. The form is non-functional.
- **Fix:** Implement the actual contract invocation.

### L-9. Invalid `role="status"` on `<a>` element in `Navbar.tsx`

- **File:** `frontend/src/components/Navbar.tsx:72`
- **Description:** The `role="status"` attribute on an anchor element is not valid ARIA. The `aria-live="polite"` on an interactive element is also incorrect.
- **Fix:** Wrap in a container div with these attributes, or use different semantics.

### L-10. Inconsistent state update pattern in `WalletContext.tsx`

- **File:** `frontend/src/context/WalletContext.tsx:156-157`
- **Description:** Line 156 uses `setPublicKey((prev) => (prev !== address ? address : prev))` to avoid unnecessary re-renders, but line 157 uses `setNetworkPassphrase(passphrase)` unconditionally.
- **Fix:** Use the same pattern for both, or document the intentional difference.

### L-11. `console.error` on import-time constants in `useContractStats.ts`

- **File:** `frontend/src/hooks/useContractStats.ts:151-158`
- **Description:** The guard checks if `CONTRACT_ID` or `RPC_URL` is falsy, but these are module-level constants that either exist or throw on import. The `console.error` and `warnIfPlaceholder` calls are dead code.
- **Fix:** Remove the dead code.

### L-12. `AbortSignal.timeout()` browser compatibility

- **File:** `frontend/src/hooks/useStellarStatus.ts:31`
- **Description:** `AbortSignal.timeout(5000)` is a relatively recent API. Older browsers (Chrome < 103, Safari < 15.4) don't support it.
- **Fix:** Use a manual timeout with `AbortController`.

### L-13. `refetch` creates new function reference every render

- **File:** `frontend/src/hooks/useAgreementEvents.ts:120`
- **Description:** `refetch: () => fetchEvents(new AbortController().signal)` creates a new arrow function on every render, causing unnecessary re-renders in consumers.
- **Fix:** Wrap in `useCallback`.

### L-14. Duplicate named + default export in `TruncatedAddress.tsx`

- **File:** `frontend/src/components/TruncatedAddress.tsx`
- **Description:** Both `export default function TruncatedAddress` and `export { TruncatedAddress }` export the same function.
- **Fix:** Use one export style.

### L-15. Redundant null/trim checks in `ExplorerLink.tsx`

- **File:** `frontend/src/components/ExplorerLink.tsx:50-52`
- **Description:** `explorerUrl()` already handles null/undefined/blank values and trims. The `!value` check and `value.trim()` are redundant.
- **Fix:** Remove the redundant checks.

### L-16. `NaN` target value causes infinite loop in `useCountUp.ts`

- **File:** `frontend/src/hooks/useCountUp.ts:21`
- **Description:** If `targetValue` is `NaN`, `Math.abs(NaN - startValue)` is `NaN`, `NaN !== 0` is `true`, so the animation starts. All arithmetic produces `NaN`.
- **Fix:** Add a guard: `if (isNaN(targetValue)) return`

### L-17. `setTimeout` in polling loop has no unmount check

- **File:** `frontend/src/hooks/useContractInvoke.ts:98`
- **Description:** The polling loop uses `await new Promise((resolve) => setTimeout(resolve, 1000))` but doesn't check for component unmount between iterations.
- **Fix:** Check an abort signal between iterations.

### L-18. `pending.forEach(clearTimeout)` — minor type concern

- **File:** `frontend/src/components/toast/ToastProvider.tsx:78`
- **Description:** `pending` is `timers.current` (a `Map`). `Map.forEach` passes `(value, key, map)` to the callback. `clearTimeout` takes the timer ID as the first arg, which is correct, but the type doesn't align perfectly.
- **Fix:** Use `pending.forEach(t => clearTimeout(t))` for clarity.

### L-19. Hardcoded text length comparison in `HomePage.tsx`

- **File:** `frontend/src/pages/HomePage.tsx:51`
- **Description:** `{heading.length < 'Trustless Escrow for Remote Work'.length` duplicates the full text string. If the text prop changes, this comparison is wrong.
- **Fix:** Store the full text in a variable.

### L-20. Non-null assertion on `publicKey` in `WalletConnect.tsx`

- **File:** `frontend/src/components/WalletConnect.tsx:71, 76`
- **Description:** `publicKey!` asserts that `publicKey` is non-null, but TypeScript already narrows the type correctly in the `connected` branch. The `!` is unnecessary.
- **Fix:** Remove the `!` assertions.

### L-21. No test for `extend_agreement_ttl` or `get_total_amount`

- **File:** `contracts/trellis_core/src/test.rs`
- **Description:** Two public entrypoints have zero test coverage. `extend_agreement_ttl` modifies state (TTL extension), and `get_total_amount` returns a computed value.
- **Fix:** Add unit tests for both entrypoints.

### L-22. Dead dependencies in CLI `Cargo.toml`

- **File:** `cli/trellis_cli/Cargo.toml:19-21`
- **Description:** `ed25519-dalek`, `sha2`, `base64` are listed but never used anywhere in the CLI code. The CLI shells out to the `stellar` CLI for all cryptographic operations.
- **Fix:** Remove unused dependencies.

### L-23. `std::thread::sleep` in tokio-based CLI

- **File:** `cli/trellis_cli/src/rpc.rs:149`
- **Description:** The CLI depends on `tokio` with `features = ["full"]`, but the retry logic uses blocking `std::thread::sleep` instead of `tokio::time::sleep`.
- **Fix:** Either make the function async with `tokio::time::sleep`, or remove the tokio dependency.

### L-24. `render_json` comment describes `tx_hash`/`events` extraction as "best-effort" but exposes them in the API

- **File:** `cli/trellis_cli/src/commands/mod.rs:700-748`
- **Description:** The JSON envelope schema `{status, result, tx_hash, events, error}` exposes `tx_hash` and `events` fields that are extracted via brittle string parsing. Downstream consumers may rely on these fields, but they are unreliable.
- **Fix:** Document that `tx_hash` and `events` are best-effort and may be `null`. Consider removing them from the schema.

### L-25. `test_properties.rs` — only tests refund-to-payer dispute path

- **File:** `contracts/trellis_core/src/test_properties.rs:167-210`
- **Description:** The dispute balance conservation property test only tests the `refund_to_payer = true` path. The `refund_to_payer = false` (payee wins) path is untested.
- **Fix:** Add a property test for the payee-winning dispute resolution path.

### L-26. `setup()` function has unused `token_client` variable

- **File:** `contracts/trellis_core/src/test.rs:67`, `test_properties.rs`
- **Description:** The `token_client` created in `setup()` is suppressed with `let _ =`. Each test creates its own `token_client` from the returned `token_address`.
- **Fix:** Remove the unused `token_client` from `setup()`.

### L-27. Event comment refers to wrong event name

- **File:** `contracts/trellis_core/src/events.rs:100-102`
- **Description:** The inline comment at line 100 says `Topics: ("disputed", agreement_id)` but the actual code at line 110 uses `symbol_short!("trlls_dspt")`. The header table at line 29 correctly says `"trlls_dspt"`.
- **Fix:** Update the inline comment to match the actual code: `Topics: ("trlls_dspt", agreement_id)`.

### L-28. `validate_environment` does not check stellar CLI version

- **File:** `cli/trellis_cli/src/main.rs:95-114`
- **Description:** The function checks if `stellar --version` runs successfully, but does not verify the version is compatible (26.x+ as stated in DEPLOYMENT.md).
- **Fix:** Parse the version output and compare against the minimum required version.

### L-29. `config.rs` `resolve()` does not validate `contract_id` format

- **File:** `cli/trellis_cli/src/config.rs:95-96`
- **Description:** The `validate()` method only checks for the sentinel string `"UNSET_CONTRACT_ID"`. It does not validate that the contract ID is a valid Stellar `C...` address format.
- **Fix:** Add a regex or prefix check to validate the contract address format in `validate()`.

### L-30. `DEPLOYMENT.md` WASM build path inconsistency

- **File:** `DEPLOYMENT.md:51, 68`
- **Description:** Step 2 says `cd contracts/trellis_core` and runs `cargo rustc --manifest-path=Cargo.toml`. Step 3 then uses `--wasm ../../target/...` which assumes the current directory is `contracts/trellis_core`. If the user ran from the workspace root, it would break.
- **Fix:** Use consistent path conventions. Either always use absolute workspace-root-relative paths or always use `cd`-based paths.

### L-31. `@testing-library/user-event` in `devDependencies` but never imported

- **File:** `frontend/package.json:26`
- **Description:** `"@testing-library/user-event": "^14.6.1"` is listed but no file in the entire codebase imports it.
- **Fix:** Remove the unused dependency.

---

## Frontend Won't Open — Root Cause Analysis

The frontend will not load due to these **critical** issues that cause runtime crashes:

1. **`Buffer` is not defined in browser** (C-2, C-3, C-4) — Any page using `useAgreement`, `useAgreementEvents`, or `MilestoneActions` will crash with `ReferenceError: Buffer is not defined`. This affects the Status page, Agreement detail, and any milestone interaction.

2. **`__APP_VERSION__` is not defined** (C-5) — The App component will crash on mount with `ReferenceError: __APP_VERSION__ is not defined`.

3. **`ExplorerLink` missing import** (C-1) — The `StatusPage` will crash when rendering any agreement detail.

4. **`verbatimModuleSyntax` violation** (H-1) — `ThemeContext.tsx` will fail at runtime because `ReactNode` is not a value.

**To fix the frontend loading issue, these 5 issues must be resolved first (in order):**
- C-5: Define `__APP_VERSION__` in vite.config.ts
- H-1: Fix type-only import in ThemeContext.tsx
- C-2, C-3, C-4: Replace `Buffer.from()` with browser-compatible hex decoding
- C-1: Add the missing `ExplorerLink` import

---

## CLI Won't Compile — Root Cause Analysis

The CLI will not compile due to these **critical** issues:

1. **`confirm_action` function does not exist** (C-6) — Compilation error.
2. **`yes` variable not in scope** (C-7) — Compilation error in 3 separate functions.

**To fix the CLI build, these must be resolved:**
- C-6: Implement `confirm_action` helper
- C-7: Add `yes: bool` parameter to `run_init`, `run_submit_work`, `run_resolve_dispute` and pass it from dispatch

---

## Suggested GitHub Issues

### For Contributors (Good First Issues)

| # | Title | Severity | Area |
|---|-------|----------|------|
| 1 | Replace `Buffer.from()` with browser-compatible hex decoding | Critical | Frontend |
| 2 | Define `__APP_VERSION__` global in Vite config | Critical | Frontend |
| 3 | Fix missing `ExplorerLink` import in `StatusPage.tsx` | Critical | Frontend |
| 4 | Fix `verbatimModuleSyntax` violation for `ReactNode` import | High | Frontend |
| 5 | Fix `BigInt` + floating point crash in amount conversion | High | Frontend |
| 6 | Fix contract address validator (Ed25519 vs Contract ID) | High | Frontend |
| 7 | Implement `confirm_action` helper and fix `yes` scope in CLI | Critical | CLI |
| 8 | Fix extra quotes wrapping `agreement_id` in CLI | Critical | CLI |
| 9 | Remove unused `router.ts` | Low | Frontend |
| 10 | Remove unused `Layout.tsx` component | Low | Frontend |
| 11 | Remove unused `AgreementStatusPage.tsx` | Low | Frontend |
| 12 | Remove unused `CreateAgreementPage.tsx` | Low | Frontend |
| 13 | Remove unused `@testing-library/user-event` dependency | Low | Frontend |
| 14 | Add authorization tests for smart contract | High | Contracts |
| 15 | Fix `test_happy_path` event assertions (currently no-op) | High | Contracts |
| 16 | Fix missing space in CSS class in `HowItWorks.tsx` | High | Frontend |
| 17 | Add overflow checks for milestone amount summing | Medium | Contracts |
| 18 | Fix `get_milestone` error handling (swallows `AgreementNotFound`) | Medium | Contracts |
| 19 | Add token address validation in `init` | Medium | Contracts |
| 20 | Implement `queryAgreement()` and `queryEvents()` in `StatusPage.tsx` | Low | Frontend |
| 21 | Implement form submission in `CreatePage.tsx` | Low | Frontend |
| 22 | Add `extend_agreement_ttl` and `get_total_amount` tests | Low | Contracts |
| 23 | Remove unused CLI dependencies (`ed25519-dalek`, `sha2`, `base64`) | Low | CLI |
| 24 | Fix `stale closure` in `StatusPage.tsx` useEffect (missing deps) | Medium | Frontend |
| 25 | Add `useCallback` to `refetch` in `useAgreementEvents` | Low | Frontend |
| 26 | Fix `handleRetry` — unhandled promise rejections | Medium | Frontend |
| 27 | Fix `errorResult` possibly undefined in `useContractInvoke` | Medium | Frontend |
| 28 | Fix `NaN` guard in `useCountUp` hook | Low | Frontend |
| 29 | Fix `Navbar.test.tsx` — internal links fail Stellar Expert regex | High | Frontend |
| 30 | Fix `AbortSignal.timeout()` browser compatibility | Low | Frontend |
| 31 | Fix `is_transient_error` matching "network" too broadly | Medium | CLI |
| 32 | Fix brittle `extract_tx_hash` / `extract_events` string parsing | Medium | CLI |
| 33 | Fix `DEPLOYMENT.md` path inconsistency | Low | Docs |
| 34 | Fix `CONTRIBUTING.md` — remove references to non-existent tests | High | Docs |
| 35 | Add stellar CLI version check in `validate_environment` | Low | CLI |
| 36 | Fix `config.rs` — validate contract_id format | Low | CLI |
| 37 | Fix inconsistent confirmation prompts across CLI commands | Medium | CLI |
| 38 | Remove dead code guard in `useContractStats.ts` | Medium | Frontend |
| 39 | Remove dead code `!!NETWORK_PASSPHRASE` in `WalletContext.tsx` | Medium | Frontend |
| 40 | Fix `render_json` silent failure on `unwrap_or_default()` | Medium | CLI |
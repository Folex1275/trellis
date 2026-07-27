use soroban_sdk::{symbol_short, Address, BytesN, Env, String};

// ---------------------------------------------------------------------------
// Event emitters — the only place that calls env.events().publish().
//
// Namespace convention
// --------------------
// All event topic Symbols are prefixed with `trellis_` to prevent cross-
// contract event misattribution by off-chain indexers.  When multiple
// contracts are composed together (e.g. a factory calling into Trellis), a
// generic topic like `"created"` could be emitted by *any* contract; the
// `trellis_` prefix makes every event unambiguously attributable to this
// contract.
//
// Symbol length limits:
//   • `symbol_short!` accepts ≤9 characters and stores the symbol as an
//     inline 64-bit integer — no heap allocation on the guest WASM side.
//   • `symbol_short!` is used where the prefixed name is exactly 9 chars or
//     fewer.  Any name that exceeds 9 chars uses `Symbol::new(env, "…")`,
//     which stores the string in the host's symbol table.
//
// Prefixed topic names and their lengths:
//   1. "trellis_cr"  (10 chars) → Symbol::new   — agreement_created
//   2. "trlls_lckd"  ( 9 chars) → symbol_short! — funds_locked       (abbreviated to stay ≤9)
//   3. "trlls_sbmt"  ( 9 chars) → symbol_short! — work_submitted     (abbreviated)
//   4. "trlls_rlsd"  ( 9 chars) → symbol_short! — funds_released     (abbreviated)
//   5. "trlls_dspt"  ( 9 chars) → symbol_short! — dispute_raised     (abbreviated)
//   6. "trlls_rslv"  ( 9 chars) → symbol_short! — milestone_resolved (abbreviated)
//   7. "trlls_cncl"  ( 9 chars) → symbol_short! — milestone_cancelled(abbreviated)
//
// All abbreviations follow the pattern: drop the vowels from the root word
// while keeping enough consonants to be unambiguous.  They are intentional
// and documented here so indexers can rely on them as stable identifiers.
//
// The contract emits exactly 7 events:
//   1. "trlls_crte"  – agreement_created
//   2. "trlls_lckd"  – funds_locked
//   3. "trlls_sbmt"  – work_submitted
//   4. "trlls_rlsd"  – funds_released
//   5. "trlls_dspt"  – dispute_raised
//   6. "trlls_rslv"  – milestone_resolved   (dispute rulings only)
//   7. "trlls_cncl"  – milestone_cancelled  (payer withdrawing an unfunded milestone)
//
// "trlls_rslv" and "trlls_cncl" are deliberately distinct: an indexer must be
// able to tell an arbitrated dispute outcome apart from a payer walking back a
// milestone that was never funded, since only the former involves token
// movement and resolver involvement.
// ---------------------------------------------------------------------------

/// Emitted when a new escrow agreement is created.
///
/// Topics: `("trlls_crte", agreement_id)`
/// Data:   `(payer, payee)`
pub fn agreement_created(env: &Env, agreement_id: BytesN<32>, payer: Address, payee: Address) {
    env.events().publish(
        (symbol_short!("trlls_crte"), agreement_id.clone()),
        (payer, payee),
    );
}

/// Emitted when funds for a specific milestone are locked into the escrow.
///
/// Topics: `("trlls_lckd", agreement_id)`
/// Data:   `(milestone_id, amount)`
pub fn funds_locked(env: &Env, agreement_id: BytesN<32>, milestone_id: u32, amount: i128) {
    env.events().publish(
        (symbol_short!("trlls_lckd"), agreement_id.clone()),
        (milestone_id, amount),
    );
}

/// Emitted when a payee submits proof of work for a milestone.
///
/// Topics: `("trlls_sbmt", agreement_id)`
/// Data:   `(milestone_id, proof_uri)`
///
/// `proof_uri` is `None` when the milestone was submitted without a proof
/// link; it is never an empty string.
pub fn work_submitted(
    env: &Env,
    agreement_id: BytesN<32>,
    milestone_id: u32,
    proof_uri: Option<String>,
) {
    env.events().publish(
        (symbol_short!("trlls_sbmt"), agreement_id.clone()),
        (milestone_id, proof_uri),
    );
}

/// Emitted when a payer approves a milestone and funds are released to the payee.
///
/// Topics: `("trlls_rlsd", agreement_id)`
/// Data:   `(milestone_id, amount)`
pub fn funds_released(env: &Env, agreement_id: BytesN<32>, milestone_id: u32, amount: i128) {
    env.events().publish(
        (symbol_short!("trlls_rlsd"), agreement_id.clone()),
        (milestone_id, amount),
    );
}

/// Emitted when either party raises a dispute on a funded or work-submitted milestone.
///
/// Topics: `("trlls_dspt", agreement_id)`
/// Data:   `(milestone_id, caller)`
pub fn dispute_raised(env: &Env, agreement_id: BytesN<32>, milestone_id: u32, caller: Address) {
    env.events().publish(
        (symbol_short!("trlls_dspt"), agreement_id.clone()),
        (milestone_id, caller),
    );
}

/// Emitted when the dispute resolver settles a disputed milestone.
///
/// This event means an arbitration ruling was made and tokens moved. It is
/// **not** emitted for cancellations — see [`milestone_cancelled`].
///
/// Topics: `("trlls_rslv", agreement_id)`
/// Data:   `(milestone_id, refunded_to_payer)`
///
/// `refunded_to_payer = true`  → locked funds returned to payer.
/// `refunded_to_payer = false` → locked funds awarded to payee.
pub fn milestone_resolved(
    env: &Env,
    agreement_id: BytesN<32>,
    milestone_id: u32,
    refunded_to_payer: bool,
) {
    env.events().publish(
        (symbol_short!("trlls_rslv"), agreement_id.clone()),
        (milestone_id, refunded_to_payer),
    );
}

/// Emitted when a payer cancels a milestone that was never funded.
///
/// No tokens move: the milestone simply leaves the `Pending` state without
/// ever having been escrowed. Indexers should treat this as a withdrawal of a
/// proposal, not as a dispute outcome.
///
/// Topics: `("trlls_cncl", agreement_id)`
/// Data:   `(milestone_id, payer, cancelled_by)`
///
/// `payer` is the agreement's payer; `cancelled_by` is the address that
/// authorised the cancellation. These are the same address today (only the
/// payer may cancel) but are reported separately so the event stays
/// self-describing if delegated cancellation is ever added.
pub fn milestone_cancelled(
    env: &Env,
    agreement_id: BytesN<32>,
    milestone_id: u32,
    payer: Address,
    cancelled_by: Address,
) {
    env.events().publish(
        (symbol_short!("trlls_cncl"), agreement_id.clone()),
        (milestone_id, payer, cancelled_by),
    );
}

use soroban_sdk::{contracttype, BytesN, Env};

use crate::errors::TrellisError;
use crate::types::Agreement;

// ---------------------------------------------------------------------------
// DataKey — typed namespace for every ledger entry written by this contract.
// Using an enum prevents accidental key collisions as the contract grows.
// ---------------------------------------------------------------------------
#[contracttype]
pub enum DataKey {
    /// Persistent storage key for a single escrow agreement.
    /// The inner BytesN<32> is the globally unique agreement ID.
    Agreement(BytesN<32>),
}

// ---------------------------------------------------------------------------
// Time-to-live (TTL) policy
//
// Every persistent entry on Soroban carries a finite TTL measured in ledgers.
// When it lapses the entry is archived and the data becomes unreadable — for
// Trellis that would mean escrowed funds locked in a contract that no longer
// knows who they belong to.  Entries must therefore be bumped explicitly; the
// host never renews them on its own.
//
// Both values are well inside the 120-day (3_110_400 ledger) network ceiling
// for persistent entries, so `extend_ttl` cannot fail on an over-long bump.
// ---------------------------------------------------------------------------

/// Ledgers closed in a day, assuming Stellar's ~5 second close time.
pub const LEDGERS_PER_DAY: u32 = 17_280;

/// Bump an agreement only once its remaining TTL drops below ~60 days.
///
/// Extending on every access regardless would charge rent on writes that
/// change nothing about the expiry date; the threshold makes the bump a no-op
/// for agreements that are already comfortably alive.
pub const AGREEMENT_TTL_THRESHOLD: u32 = 60 * LEDGERS_PER_DAY;

/// Restore an agreement's TTL to ~90 days whenever the threshold is crossed.
///
/// The 30-day gap between threshold and target is the window in which a single
/// interaction — or an external `extend_ttl` call — keeps the agreement alive
/// indefinitely.
pub const AGREEMENT_TTL_EXTEND_TO: u32 = 90 * LEDGERS_PER_DAY;

// ---------------------------------------------------------------------------
// Storage helpers — the only place in the codebase that touches
// env.storage().persistent().  All other modules go through these functions.
// ---------------------------------------------------------------------------

/// Bump the TTL of an agreement entry that is known to exist.
///
/// Callers must have established existence first: the host traps when
/// `extend_ttl` is applied to a missing key.
fn extend_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, AGREEMENT_TTL_THRESHOLD, AGREEMENT_TTL_EXTEND_TO);
}

/// Persist an [`Agreement`] to ledger storage under its unique ID.
///
/// Writing also refreshes the entry's TTL, so any state-changing call —
/// funding a milestone, submitting work, resolving a dispute — keeps the
/// agreement alive for another [`AGREEMENT_TTL_EXTEND_TO`] ledgers.
pub fn write_agreement(env: &Env, id: &BytesN<32>, agreement: &Agreement) {
    let key = DataKey::Agreement(id.clone());
    env.storage().persistent().set(&key, agreement);
    extend_ttl(env, &key);
}

/// Retrieve an [`Agreement`] from ledger storage by its unique ID.
///
/// Reading also refreshes the entry's TTL. An agreement that is merely being
/// watched — a long dispute window, a milestone awaiting delivery — is still
/// in active use and must not be archived out from under its parties.
///
/// # Errors
/// Returns [`TrellisError::AgreementNotFound`] (code 3) when no record exists
/// for `id`. Callers may also use [`has_agreement`] to pre-check existence.
pub fn read_agreement(env: &Env, id: &BytesN<32>) -> Result<Agreement, TrellisError> {
    let key = DataKey::Agreement(id.clone());
    let agreement: Agreement = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(TrellisError::AgreementNotFound)?;

    // Reaching here proves the entry exists, so the bump is safe.
    extend_ttl(env, &key);

    Ok(agreement)
}

/// Return `true` if an [`Agreement`] with the given `id` exists in storage.
///
/// Deliberately does not bump the TTL: this is a pure existence probe used by
/// `init` to reject duplicate IDs, and it must not charge rent for asking
/// about an agreement that may not exist.
pub fn has_agreement(env: &Env, id: &BytesN<32>) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Agreement(id.clone()))
}

/// Refresh an agreement's TTL without reading or modifying its contents.
///
/// This is the escape hatch for agreements that sit idle longer than their
/// TTL — a milestone with a long delivery window, or a dispute in arbitration.
/// Without it, an agreement could expire simply because nobody happened to
/// touch it in time.
///
/// # Errors
/// Returns [`TrellisError::AgreementNotFound`] when no record exists for `id`,
/// rather than letting the host trap on a missing key.
pub fn extend_agreement_ttl(env: &Env, id: &BytesN<32>) -> Result<(), TrellisError> {
    let key = DataKey::Agreement(id.clone());

    if !env.storage().persistent().has(&key) {
        return Err(TrellisError::AgreementNotFound);
    }

    extend_ttl(env, &key);

    Ok(())
}

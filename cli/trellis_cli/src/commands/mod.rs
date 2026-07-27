use clap::Subcommand;

use crate::config::Config;
use crate::rpc::RpcClient;

// ---------------------------------------------------------------------------
// Commands enum — parsed by clap from argv
// ---------------------------------------------------------------------------

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Create a new escrow agreement on-chain.
    Init {
        /// Hex-encoded 32-byte agreement ID (64 hex chars).
        #[arg(long)]
        agreement_id: String,

        /// Stellar address of the payer (funder).
        #[arg(long)]
        payer: String,

        /// Stellar address of the payee (contractor).
        #[arg(long)]
        payee: String,

        /// SAC or token contract address used for payments.
        #[arg(long)]
        token: String,

        /// Address of the neutral dispute resolver.
        #[arg(long)]
        resolver: String,

        /// Comma-separated milestone amounts in the token's base unit.
        /// Example: --milestones "1000,2000,500"
        #[arg(long)]
        milestones: String,
    },

    /// Lock funds for a specific milestone into the escrow contract.
    LockFunds {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the milestone to fund.
        #[arg(long)]
        milestone_id: u32,
    },

    /// Submit proof of work for a funded milestone.
    SubmitWork {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the milestone being submitted.
        #[arg(long)]
        milestone_id: u32,

        /// URI pointing to delivery proof (e.g. "ipfs://...", GitHub PR URL).
        /// Omit the flag to submit without a proof link.
        #[arg(long)]
        proof_uri: Option<String>,
    },

    /// Approve submitted work and release funds to the payee.
    ApproveRelease {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the milestone to approve.
        #[arg(long)]
        milestone_id: u32,
    },

    /// Raise a dispute on a funded or work-submitted milestone.
    RaiseDispute {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the disputed milestone.
        #[arg(long)]
        milestone_id: u32,

        /// Address of the party raising the dispute (payer or payee).
        /// The contract validates the caller is one of these two roles.
        #[arg(long)]
        caller: String,
    },

    /// Resolve a disputed milestone as the designated dispute resolver.
    ResolveDispute {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the disputed milestone.
        #[arg(long)]
        milestone_id: u32,

        /// Pass true to refund locked funds to the payer (payer wins).
        /// Pass false to release funds to the payee (payee wins).
        #[arg(long, default_value = "false")]
        refund_to_payer: bool,
    },

    /// Cancel a milestone that was never funded (status = Pending).
    CancelMilestone {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the milestone to cancel.
        #[arg(long)]
        milestone_id: u32,
    },

    /// Query the current state of an agreement.
    Status {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,
    },

    /// Query the current status of a single milestone (cheaper than fetching the full agreement).
    MilestoneStatus {
        /// Agreement ID (hex-encoded, 64 chars).
        #[arg(long)]
        agreement_id: String,

        /// Zero-based index of the milestone to query.
        #[arg(long)]
        milestone_id: u32,
    },
}

// ---------------------------------------------------------------------------
// Dispatch — route each command to its handler
// ---------------------------------------------------------------------------

pub fn dispatch(cmd: Commands, config: &Config) {
    match cmd {
        Commands::Init {
            agreement_id,
            payer,
            payee,
            token,
            resolver,
            milestones,
        } => run_init(
            config,
            agreement_id,
            payer,
            payee,
            token,
            resolver,
            milestones,
        ),

        Commands::LockFunds {
            agreement_id,
            milestone_id,
        } => run_lock_funds(config, agreement_id, milestone_id),

        Commands::SubmitWork {
            agreement_id,
            milestone_id,
            proof_uri,
        } => run_submit_work(config, agreement_id, milestone_id, proof_uri),

        Commands::ApproveRelease {
            agreement_id,
            milestone_id,
        } => run_approve_release(config, agreement_id, milestone_id),

        Commands::RaiseDispute {
            agreement_id,
            milestone_id,
            caller,
        } => run_raise_dispute(config, agreement_id, milestone_id, caller),

        Commands::ResolveDispute {
            agreement_id,
            milestone_id,
            refund_to_payer,
        } => run_resolve_dispute(config, agreement_id, milestone_id, refund_to_payer),

        Commands::CancelMilestone {
            agreement_id,
            milestone_id,
        } => run_cancel_milestone(config, agreement_id, milestone_id),

        Commands::Status { agreement_id } => run_status(config, agreement_id),

        Commands::MilestoneStatus {
            agreement_id,
            milestone_id,
        } => run_milestone_status(config, agreement_id, milestone_id),
    }
}

// ---------------------------------------------------------------------------
// Active command implementations
// ---------------------------------------------------------------------------

/// `stellar contract invoke … -- init …`
///
/// Final call signature:
/// ```
/// stellar contract invoke --id <C> --source <key> --rpc-url <url>
///   --network-passphrase <p> -- init
///   --agreement-id <hex> --payer <G> --payee <G>
///   --token <C> --milestones <JSON> --dispute-resolver <G>
/// ```
fn run_init(
    config: &Config,
    agreement_id: String,
    payer: String,
    payee: String,
    token: String,
    resolver: String,
    milestones_csv: String,
) {
    let milestones_json = build_milestones_json(&milestones_csv).unwrap_or_else(|e| {
        eprintln!("Error: {e}");
        std::process::exit(1);
    });

    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--payer".to_string(),
        payer,
        "--payee".to_string(),
        payee,
        "--token".to_string(),
        token,
        "--milestones".to_string(),
        milestones_json,
        "--dispute-resolver".to_string(),
        resolver,
    ];

    let out = RpcClient::invoke(config, "init", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- lock_funds …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- lock_funds
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_lock_funds(config: &Config, agreement_id: String, milestone_id: u32) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "lock_funds", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- submit_work …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- submit_work
///   --agreement-id <hex> --milestone-id <u32> [--proof-uri <string>]
/// ```
///
/// The contract types `proof_uri` as `Option<String>`, so omitting the flag
/// sends `None` — the canonical "no proof submitted" value. Passing an empty
/// string would create a `Some("")`, which the contract does not treat as
/// absent, so the flag is dropped entirely rather than sent empty.
fn run_submit_work(
    config: &Config,
    agreement_id: String,
    milestone_id: u32,
    proof_uri: Option<String>,
) {
    let mut args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    if let Some(uri) = proof_uri.filter(|u| !u.is_empty()) {
        args.push("--proof-uri".to_string());
        args.push(format!("\"{}\"", uri));
    }

    let out = RpcClient::invoke(config, "submit_work", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- approve_and_release …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- approve_and_release
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_approve_release(config: &Config, agreement_id: String, milestone_id: u32) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "approve_and_release", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- raise_dispute …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- raise_dispute
///   --agreement-id <hex> --milestone-id <u32> --caller <G>
/// ```
///
/// `caller` is passed explicitly because the contract checks it against
/// both `agreement.payer` and `agreement.payee` before calling
/// `caller.require_auth()`, so either party can autonomously open a dispute.
fn run_raise_dispute(config: &Config, agreement_id: String, milestone_id: u32, caller: String) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
        "--caller".to_string(),
        caller,
    ];

    let out = RpcClient::invoke(config, "raise_dispute", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- resolve_dispute …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- resolve_dispute
///   --agreement-id <hex> --milestone-id <u32> --refund-to-payer <true|false>
/// ```
fn run_resolve_dispute(
    config: &Config,
    agreement_id: String,
    milestone_id: u32,
    refund_to_payer: bool,
) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
        "--refund-to-payer".to_string(),
        refund_to_payer.to_string(), // "true" or "false"
    ];

    let out = RpcClient::invoke(config, "resolve_dispute", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- cancel_unfunded_milestone …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- cancel_unfunded_milestone
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_cancel_milestone(config: &Config, agreement_id: String, milestone_id: u32) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "cancel_unfunded_milestone", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- get_agreement …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- get_agreement
///   --agreement-id <hex>
/// ```
///
/// The stellar CLI calls the contract's `get_agreement` view function and
/// returns the full Agreement struct as JSON, which is printed to stdout.
fn run_status(config: &Config, agreement_id: String) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
    ];

    let out = RpcClient::invoke(config, "get_agreement", &args);
    print_output(&out);
}

/// `stellar contract invoke … -- get_milestone …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- get_milestone
///   --agreement-id <hex> --milestone-id <u32>
/// ```
///
/// Queries a single milestone by index without fetching the full Agreement,
/// reducing deserialization cost for agreements with many milestones.
fn run_milestone_status(config: &Config, agreement_id: String, milestone_id: u32) {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "get_milestone", &args);
    print_output(&out);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/// Convert a comma-separated amount string like `"1000,2000"` into the JSON
/// array format the `stellar` CLI accepts for a `Vec<Milestone>` argument.
///
/// Amounts are parsed as `i128` to match the contract's `Milestone.amount` type.
/// Values that are not valid integers, are zero, or are negative are rejected
/// with a descriptive error — the entire command fails rather than silently
/// producing a malformed milestone list.
///
/// Each milestone is given:
/// - `id`        – its 0-based position in the list
/// - `amount`    – the parsed `i128` amount (quoted, per Soroban i128 JSON encoding)
/// - `status`    – `{"Pending":null}` (XDR union tag for EscrowStatus::Pending)
/// - `proof_uri` – `null` (XDR `Void`, i.e. `None` — no proof submitted yet)
///
/// Example output for `"1000,2000"`:
/// ```json
/// [{"id":0,"amount":"1000","status":{"Pending":null},"proof_uri":null},
///  {"id":1,"amount":"2000","status":{"Pending":null},"proof_uri":null}]
/// ```
fn build_milestones_json(csv: &str) -> Result<String, String> {
    let entries: Vec<String> = csv
        .split(',')
        .enumerate()
        .map(|(idx, part)| -> Result<String, String> {
            let trimmed = part.trim();
            let amount: i128 = trimmed.parse().map_err(|_| {
                format!(
                    "invalid milestone amount {:?} at index {} — expected a positive integer",
                    trimmed, idx
                )
            })?;
            if amount <= 0 {
                return Err(format!(
                    "milestone amount at index {} must be a positive integer, got {amount}",
                    idx
                ));
            }
            Ok(format!(
                r#"{{"id":{idx},"amount":"{amount}","status":{{"Pending":null}},"proof_uri":null}}"#,
            ))
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[{}]", entries.join(",")))
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::build_milestones_json;

    #[test]
    fn test_build_milestones_json_happy_path() {
        let json = build_milestones_json("1000,2000,500").unwrap();
        assert_eq!(
            json,
            r#"[{"id":0,"amount":"1000","status":{"Pending":null},"proof_uri":null},{"id":1,"amount":"2000","status":{"Pending":null},"proof_uri":null},{"id":2,"amount":"500","status":{"Pending":null},"proof_uri":null}]"#
        );
    }

    #[test]
    fn test_build_milestones_json_max_i128() {
        let max = i128::MAX.to_string();
        let json = build_milestones_json(&max).unwrap();
        assert!(
            json.contains(&format!("\"amount\":\"{}\"", i128::MAX)),
            "max i128 value should be preserved verbatim"
        );
    }

    #[test]
    fn test_build_milestones_json_zero_rejects() {
        let result = build_milestones_json("0");
        assert!(result.is_err(), "zero amount must be rejected");
    }

    #[test]
    fn test_build_milestones_json_negative_rejects() {
        let result = build_milestones_json("-500");
        assert!(result.is_err(), "negative amount must be rejected");
    }

    #[test]
    fn test_build_milestones_json_non_numeric_rejects() {
        let result = build_milestones_json("abc");
        assert!(result.is_err(), "non-numeric input must be rejected");
    }

    #[test]
    fn test_build_milestones_json_whitespace_trimmed() {
        let json = build_milestones_json(" 100 , 200 ").unwrap();
        assert!(json.contains("\"amount\":\"100\""));
        assert!(json.contains("\"amount\":\"200\""));
    }

    #[test]
    fn test_build_milestones_json_single_milestone() {
        let json = build_milestones_json("42").unwrap();
        assert_eq!(
            json,
            r#"[{"id":0,"amount":"42","status":{"Pending":null},"proof_uri":null}]"#
        );
    }
}

/// Print the result of an RPC call.
/// On failure, prints the full verbatim command so the user can reproduce it.
fn print_output(out: &crate::rpc::InvokeOutput) {
    if out.success {
        println!("{}", out.stdout.trim());
    } else {
        eprintln!("── Transaction failed ──────────────────────────────────");
        eprintln!("Command: {}", out.command_debug);
        if !out.stdout.is_empty() {
            eprintln!("stdout:\n{}", out.stdout.trim());
        }
        if !out.stderr.is_empty() {
            eprintln!("stderr:\n{}", out.stderr.trim());
        }
        std::process::exit(1);
    }
}

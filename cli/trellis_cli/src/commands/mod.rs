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
}

// ---------------------------------------------------------------------------
// Dispatch — route each command to its handler
// ---------------------------------------------------------------------------

pub fn dispatch(cmd: Commands, config: &Config) -> Result<(), String> {
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
) -> Result<(), String> {
    let milestones_json = build_milestones_json(&milestones_csv);

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
    print_output(&out)
}

/// `stellar contract invoke … -- lock_funds …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- lock_funds
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_lock_funds(config: &Config, agreement_id: String, milestone_id: u32) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "lock_funds", &args);
    print_output(&out)
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
) -> Result<(), String> {
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
    print_output(&out)
}

/// `stellar contract invoke … -- approve_and_release …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- approve_and_release
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_approve_release(config: &Config, agreement_id: String, milestone_id: u32) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "approve_and_release", &args);
    print_output(&out)
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
fn run_raise_dispute(config: &Config, agreement_id: String, milestone_id: u32, caller: String) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
        "--caller".to_string(),
        caller,
    ];

    let out = RpcClient::invoke(config, "raise_dispute", &args);
    print_output(&out)
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
) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
        "--refund-to-payer".to_string(),
        refund_to_payer.to_string(), // "true" or "false"
    ];

    let out = RpcClient::invoke(config, "resolve_dispute", &args);
    print_output(&out)
}

/// `stellar contract invoke … -- cancel_unfunded_milestone …`
///
/// Final call signature:
/// ```
/// stellar contract invoke … -- cancel_unfunded_milestone
///   --agreement-id <hex> --milestone-id <u32>
/// ```
fn run_cancel_milestone(config: &Config, agreement_id: String, milestone_id: u32) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
        "--milestone-id".to_string(),
        milestone_id.to_string(),
    ];

    let out = RpcClient::invoke(config, "cancel_unfunded_milestone", &args);
    print_output(&out)
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
fn run_status(config: &Config, agreement_id: String) -> Result<(), String> {
    let args = vec![
        "--agreement-id".to_string(),
        format!("\"{}\"", agreement_id),
    ];

    let out = RpcClient::invoke(config, "get_agreement", &args);
    print_output(&out)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/// Convert a comma-separated amount string like `"1000,2000"` into the JSON
/// array format the `stellar` CLI accepts for a `Vec<Milestone>` argument.
///
/// Each milestone is given:
/// - `id`        – its 0-based position in the list
/// - `amount`    – the parsed amount
/// - `status`    – `{"Pending":null}` (XDR union tag for EscrowStatus::Pending)
/// - `proof_uri` – `null` (XDR `Void`, i.e. `None` — no proof submitted yet)
///
/// Example output for `"1000,2000"`:
/// ```json
/// [{"id":0,"amount":1000,"status":{"Pending":null},"proof_uri":null},
///  {"id":1,"amount":2000,"status":{"Pending":null},"proof_uri":null}]
/// ```
fn build_milestones_json(csv: &str) -> String {
    let entries: Vec<String> = csv
        .split(',')
        .enumerate()
        .filter_map(|(idx, part)| {
            let trimmed = part.trim();
            match trimmed.parse::<u64>() {
                Ok(amount) => Some(format!(
                    r#"{{"id":{idx},"amount":"{amount}","status":{{"Pending":null}},"proof_uri":null}}"#,
                )),
                Err(_) => {
                    eprintln!(
                        "Warning: skipping invalid milestone amount {:?} at index {}",
                        trimmed, idx
                    );
                    None
                }
            }
        })
        .collect();

    format!("[{}]", entries.join(","))
}

/// Print the result of an RPC call.
/// On failure, prints the full verbatim command so the user can reproduce it.
///
/// Returns `Ok(())` on success or `Err(message)` on failure so that
/// callers (i.e. `main`) can run any cleanup before exiting with a non-zero
/// exit code.  This avoids calling `std::process::exit` inside a library
/// function, which would skip destructors and flush buffers unsafely.
fn print_output(out: &crate::rpc::InvokeOutput) -> Result<(), String> {
    if out.success {
        println!("{}", out.stdout.trim());
        Ok(())
    } else {
        let mut msg = format!(
            "── Transaction failed ──────────────────────────────────\nCommand: {}",
            out.command_debug
        );
        if !out.stdout.is_empty() {
            msg.push_str(&format!("\nstdout:\n{}", out.stdout.trim()));
        }
        if !out.stderr.is_empty() {
            msg.push_str(&format!("\nstderr:\n{}", out.stderr.trim()));
        }
        Err(msg)
    }
}

mod commands;
mod config;
mod rpc;
mod utils;

use clap::Parser;
use commands::Commands;

// ---------------------------------------------------------------------------
// Top-level CLI definition
// ---------------------------------------------------------------------------

/// Trellis Protocol CLI — milestone-based escrow on Stellar Soroban.
///
/// Configuration is read from environment variables:
///   STELLAR_RPC_URL           (default: Soroban Testnet)
///   STELLAR_NETWORK_PASSPHRASE (default: Testnet passphrase)
///   TRELLIS_CONTRACT_ID        (required for on-chain calls)
///   TRELLIS_SOURCE_KEY         (Stellar secret key or named identity)
#[derive(Parser, Debug)]
#[command(
    name = "trellis",
    version = env!("CARGO_PKG_VERSION"),
    author,
    about,
    long_about = None,
    propagate_version = true,
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

fn main() {
    let cli = Cli::parse();
    let config = config::Config::from_env();

    if let Err(missing) = config.validate() {
        eprintln!("error: the following required environment variables are not set:");
        for var in &missing {
            eprintln!("  {var}");
        }
        eprintln!();
        eprintln!("Set them before running trellis, for example:");
        eprintln!("  export TRELLIS_CONTRACT_ID=<your-contract-address>");
        eprintln!("  export TRELLIS_SOURCE_KEY=<your-stellar-secret-key-or-identity>");
        std::process::exit(1);
    }

    commands::dispatch(cli.command, &config);
}

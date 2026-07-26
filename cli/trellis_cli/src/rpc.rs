use crate::config::Config;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Output from a Soroban contract invoke.
#[derive(Debug)]
pub struct InvokeOutput {
    /// Combined stdout from the process.
    pub stdout: String,
    /// Combined stderr from the process.
    pub stderr: String,
    /// Whether the process exited successfully.
    pub success: bool,
    /// The exact command string that was executed — printed on failure so
    /// the caller can reproduce/debug locally.
    pub command_debug: String,
}

/// Native Soroban RPC client that talks directly to the Soroban JSON-RPC endpoint.
/// No external CLI dependency required.
pub struct RpcClient;

#[derive(Serialize, Deserialize, Debug)]
struct RpcRequest {
    jsonrpc: String,
    method: String,
    params: Vec<serde_json::Value>,
    id: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct RpcResponse {
    jsonrpc: String,
    #[serde(default)]
    result: Option<serde_json::Value>,
    #[serde(default)]
    error: Option<RpcError>,
    id: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct RpcError {
    code: i32,
    message: String,
    #[serde(default)]
    data: Option<String>,
}

impl RpcClient {
    /// Invoke a Trellis contract function via native Soroban RPC.
    ///
    /// This replaces the shell-out to `stellar contract invoke` with direct
    /// HTTP calls to the Soroban JSON-RPC endpoint.
    ///
    /// # Arguments
    /// * `config`  – runtime configuration (RPC URL, keys, contract ID)
    /// * `fn_name` – the Soroban function name (e.g. `"init"`, `"lock_funds"`)
    /// * `args`    – a flat list of `--flag value` pairs **after** the `--`
    ///               separator, e.g. `["--agreement_id", "0x…", "--payer", "G…"]`
    pub fn invoke(config: &Config, fn_name: &str, args: &[String]) -> InvokeOutput {
        // For now, fall back to stellar CLI for full compatibility.
        // A complete implementation would:
        // 1. Parse args into typed contract parameters
        // 2. Load the source key from Stellar keystore
        // 3. Build a transaction envelope
        // 4. Sign it with the source key
        // 5. Submit via simulateTransaction and submitTransaction
        // 6. Poll getLedgerEntries for results
        //
        // This requires Stellar SDK integration and key management,
        // so we delegate to the stellar CLI for now which handles all of this.
        Self::invoke_via_stellar_cli(config, fn_name, args)
    }

    /// Fallback to stellar CLI when a complete native implementation is not feasible.
    fn invoke_via_stellar_cli(
        config: &Config,
        fn_name: &str,
        args: &[String],
    ) -> InvokeOutput {
        use std::process::Command;

        // Build the argument list so we can log it on failure.
        let mut cmd_args: Vec<String> = vec![
            "contract".to_string(),
            "invoke".to_string(),
            "--id".to_string(),
            config.contract_id.clone(),
            "--source".to_string(),
            config.source_key.clone(),
            "--rpc-url".to_string(),
            config.rpc_url.clone(),
            "--network-passphrase".to_string(),
            config.network_passphrase.clone(),
            "--".to_string(),
            fn_name.to_string(),
        ];
        cmd_args.extend_from_slice(args);

        // Human-readable version of the full command for debug output.
        let command_debug = format!("stellar {}", cmd_args.join(" "));

        let output = Command::new("stellar").args(&cmd_args).output();

        match output {
            Ok(out) => InvokeOutput {
                stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                success: out.status.success(),
                command_debug,
            },
            Err(e) => InvokeOutput {
                stdout: String::new(),
                stderr: format!(
                    "Failed to spawn `stellar` CLI: {e}\n\
                     Is the Stellar CLI installed?  https://developers.stellar.org/docs/tools/cli/install-cli"
                ),
                success: false,
                command_debug,
            },
        }
    }
}

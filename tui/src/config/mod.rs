use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    #[serde(default)]
    pub auth: AuthConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub url: String,
    pub api_key: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AuthConfig {
    pub token: Option<String>,
}

// Default values matching mobile app
pub const DEFAULT_API_URL: &str = "https://budget.appz.wtf";
pub const DEFAULT_API_KEY: &str = "your-secret-api-key-change-this";

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                url: DEFAULT_API_URL.to_string(),
                api_key: DEFAULT_API_KEY.to_string(),
            },
            auth: AuthConfig::default(),
        }
    }
}

impl Config {
    /// Get the config directory path (~/.config/budget-tui)
    pub fn config_dir() -> Result<PathBuf> {
        let home = std::env::var("HOME").context("Could not get HOME directory")?;
        Ok(PathBuf::from(home).join(".config").join("budget-tui"))
    }

    /// Get the config file path
    pub fn config_path() -> Result<PathBuf> {
        Ok(Self::config_dir()?.join("config.toml"))
    }

    /// Load config from file, or create default if it doesn't exist
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;

        if config_path.exists() {
            let content = fs::read_to_string(&config_path).context("Failed to read config file")?;
            let config: Config = toml::from_str(&content).context("Failed to parse config file")?;
            Ok(config)
        } else {
            let config = Config::default();
            config.save()?;
            Ok(config)
        }
    }

    /// Save config to file
    pub fn save(&self) -> Result<()> {
        let config_path = Self::config_path()?;
        let config_dir = Self::config_dir()?;

        // Create directory if it doesn't exist
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir).context("Failed to create config directory")?;
        }

        let content = toml::to_string_pretty(self).context("Failed to serialize config")?;
        fs::write(&config_path, content).context("Failed to write config file")?;

        Ok(())
    }

    /// Set the auth token and save
    pub fn set_token(&mut self, token: String) -> Result<()> {
        self.auth.token = Some(token);
        self.save()
    }

    /// Clear the auth token and save
    pub fn clear_token(&mut self) -> Result<()> {
        self.auth.token = None;
        self.save()
    }

    /// Check if user is authenticated (has token)
    pub fn is_authenticated(&self) -> bool {
        self.auth.token.is_some()
    }
}

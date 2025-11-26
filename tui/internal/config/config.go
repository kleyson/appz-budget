package config

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// Default values (same as mobile app)
const (
	DefaultAPIURL  = "https://budget.appz.wtf"
	DefaultAPIKey  = "your-secret-api-key-change-this"
	DefaultVersion = "0.0.0"
	ClientPlatform = "TUI"
	configFileName = "config"
)

// Config holds the application configuration
type Config struct {
	APIBaseURL string
	APIKey     string
	ClientInfo string
	Version    string
}

// configFile holds the obfuscated config data
type configFile struct {
	APIURL string `json:"url"`
	APIKey string `json:"key"` // obfuscated
}

// getConfigDir returns the configuration directory path
func getConfigDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	// Use .config/appz-budget-tui on Unix, AppData/appz-budget-tui on Windows
	var configDir string
	if runtime.GOOS == "windows" {
		configDir = filepath.Join(homeDir, "AppData", "Local", "appz-budget-tui")
	} else {
		configDir = filepath.Join(homeDir, ".config", "appz-budget-tui")
	}

	return configDir, nil
}

// getConfigPath returns the full path to the config file
func getConfigPath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, configFileName), nil
}

// obfuscateKey obfuscates an API key using XOR cipher
func obfuscateKey(key string) string {
	if key == "" {
		return ""
	}

	// Simple XOR obfuscation with a fixed key
	obfuscationKey := []byte("appz-budget-tui-2024")
	keyBytes := []byte(key)
	result := make([]byte, len(keyBytes))

	for i := 0; i < len(keyBytes); i++ {
		result[i] = keyBytes[i] ^ obfuscationKey[i%len(obfuscationKey)]
	}

	// Base64 encode to make it safe for JSON
	return base64.StdEncoding.EncodeToString(result)
}

// deobfuscateKey deobfuscates an API key
func deobfuscateKey(obfuscated string) (string, error) {
	if obfuscated == "" {
		return "", nil
	}

	// Decode from base64
	keyBytes, err := base64.StdEncoding.DecodeString(obfuscated)
	if err != nil {
		return "", fmt.Errorf("failed to decode obfuscated key: %w", err)
	}

	// XOR deobfuscation
	obfuscationKey := []byte("appz-budget-tui-2024")
	result := make([]byte, len(keyBytes))

	for i := 0; i < len(keyBytes); i++ {
		result[i] = keyBytes[i] ^ obfuscationKey[i%len(obfuscationKey)]
	}

	return string(result), nil
}

// Load loads configuration from file and environment variables
// Environment variables take precedence over file settings
// If no config file exists, it will be created with default values
func Load() *Config {
	cfg := &Config{
		APIBaseURL: DefaultAPIURL,
		APIKey:     DefaultAPIKey,
		Version:    loadVersion(),
	}

	// Try to load from file
	fileCfg, err := loadFromFile()
	if err != nil {
		// Config file doesn't exist or is invalid - create it with defaults
		cfg.Save()
	} else {
		// Use values from file
		if fileCfg.APIURL != "" {
			cfg.APIBaseURL = fileCfg.APIURL
		}
		if fileCfg.APIKey != "" {
			cfg.APIKey = fileCfg.APIKey
		}
	}

	// Environment variables override file settings
	if envURL := os.Getenv("BUDGET_API_URL"); envURL != "" {
		cfg.APIBaseURL = envURL
	}
	if envKey := os.Getenv("BUDGET_API_KEY"); envKey != "" {
		cfg.APIKey = envKey
	}

	// Set client info
	clientInfo := os.Getenv("BUDGET_CLIENT_INFO")
	if clientInfo == "" {
		clientInfo = ClientPlatform + "/" + cfg.Version
	}
	cfg.ClientInfo = clientInfo

	return cfg
}

// loadFromFile loads configuration from the config file
func loadFromFile() (*configFile, error) {
	configPath, err := getConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var fileCfg configFile
	if err := json.Unmarshal(data, &fileCfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Deobfuscate the API key
	if fileCfg.APIKey != "" {
		deobfuscated, err := deobfuscateKey(fileCfg.APIKey)
		if err != nil {
			return nil, fmt.Errorf("failed to deobfuscate API key: %w", err)
		}
		fileCfg.APIKey = deobfuscated
	}

	return &fileCfg, nil
}

// Save saves the configuration to file
func (c *Config) Save() error {
	configDir, err := getConfigDir()
	if err != nil {
		return err
	}

	// Create config directory if it doesn't exist
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	configPath, err := getConfigPath()
	if err != nil {
		return err
	}

	// Obfuscate the API key
	obfuscatedKey := obfuscateKey(c.APIKey)

	fileCfg := configFile{
		APIURL: c.APIBaseURL,
		APIKey: obfuscatedKey,
	}

	data, err := json.MarshalIndent(fileCfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write with restricted permissions (owner read/write only)
	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// SaveAPIURL saves only the API URL to the config file
func (c *Config) SaveAPIURL(url string) error {
	c.APIBaseURL = url
	return c.Save()
}

// SaveAPIKey saves only the API key to the config file
func (c *Config) SaveAPIKey(key string) error {
	c.APIKey = key
	return c.Save()
}

// loadVersion reads the version from the VERSION file
func loadVersion() string {
	// Try multiple locations for the VERSION file
	paths := []string{
		"../VERSION",    // When running from tui directory
		"VERSION",       // When running from project root
		"../../VERSION", // Fallback
	}

	// Also try relative to the executable
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		paths = append(paths,
			filepath.Join(execDir, "../VERSION"),
			filepath.Join(execDir, "../../VERSION"),
			filepath.Join(execDir, "VERSION"),
		)
	}

	// Try relative to source file (for go run)
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		sourceDir := filepath.Dir(filename)
		paths = append(paths,
			filepath.Join(sourceDir, "../../../VERSION"),
			filepath.Join(sourceDir, "../../../../VERSION"),
		)
	}

	for _, path := range paths {
		if content, err := os.ReadFile(path); err == nil {
			version := strings.TrimSpace(string(content))
			if version != "" {
				return version
			}
		}
	}

	// Fallback to default version
	return DefaultVersion
}

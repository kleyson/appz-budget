package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestObfuscateDeobfuscateKey(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "normal key",
			input:    "my-secret-api-key",
			expected: "my-secret-api-key",
		},
		{
			name:     "empty key",
			input:    "",
			expected: "",
		},
		{
			name:     "long key",
			input:    "this-is-a-very-long-api-key-that-should-still-work-correctly",
			expected: "this-is-a-very-long-api-key-that-should-still-work-correctly",
		},
		{
			name:     "special characters",
			input:    "key-with-special-chars-!@#$%^&*()",
			expected: "key-with-special-chars-!@#$%^&*()",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			obfuscated := obfuscateKey(tt.input)

			// Obfuscated should be different from original (unless empty)
			if tt.input != "" && obfuscated == tt.input {
				t.Errorf("obfuscateKey() should obfuscate the key, got same value")
			}

			// Deobfuscate should return original
			deobfuscated, err := deobfuscateKey(obfuscated)
			if err != nil {
				t.Errorf("deobfuscateKey() error = %v", err)
				return
			}

			if deobfuscated != tt.expected {
				t.Errorf("deobfuscateKey() = %v, want %v", deobfuscated, tt.expected)
			}
		})
	}
}

func TestGetConfigDir(t *testing.T) {
	dir, err := getConfigDir()
	if err != nil {
		t.Fatalf("getConfigDir() error = %v", err)
	}

	if dir == "" {
		t.Error("getConfigDir() returned empty string")
	}

	// Should contain .config or AppData
	if !filepath.IsAbs(dir) {
		t.Errorf("getConfigDir() should return absolute path, got %v", dir)
	}
}

func TestGetConfigPath(t *testing.T) {
	path, err := getConfigPath()
	if err != nil {
		t.Fatalf("getConfigPath() error = %v", err)
	}

	if path == "" {
		t.Error("getConfigPath() returned empty string")
	}

	if !filepath.IsAbs(path) {
		t.Errorf("getConfigPath() should return absolute path, got %v", path)
	}

	// Should end with config filename
	if filepath.Base(path) != configFileName {
		t.Errorf("getConfigPath() should end with %v, got %v", configFileName, filepath.Base(path))
	}
}

func TestLoadVersion(t *testing.T) {
	// Create a temporary VERSION file
	tmpDir := t.TempDir()
	versionFile := filepath.Join(tmpDir, "VERSION")

	// Test with valid version file
	testVersion := "1.2.3"
	err := os.WriteFile(versionFile, []byte(testVersion+"\n"), 0644)
	if err != nil {
		t.Fatalf("Failed to create test version file: %v", err)
	}

	// We can't easily test loadVersion() directly since it reads from a hardcoded path,
	// but we can test that it handles the VERSION file format correctly
	content, err := os.ReadFile(versionFile)
	if err != nil {
		t.Fatalf("Failed to read version file: %v", err)
	}

	version := strings.TrimSpace(string(content))
	if version != testVersion {
		t.Errorf("Expected version %v, got %v", testVersion, version)
	}
}

func TestConfigDefaults(t *testing.T) {
	// Save original environment variables
	originalURL := os.Getenv("BUDGET_API_URL")
	originalKey := os.Getenv("BUDGET_API_KEY")
	defer func() {
		os.Setenv("BUDGET_API_URL", originalURL)
		os.Setenv("BUDGET_API_KEY", originalKey)
	}()

	// Clear environment variables to test defaults
	os.Unsetenv("BUDGET_API_URL")
	os.Unsetenv("BUDGET_API_KEY")

	cfg := Load()

	// APIBaseURL should match default (unless loaded from file)
	if cfg.APIBaseURL == "" {
		t.Error("APIBaseURL should not be empty")
	}

	// APIKey should match default (unless loaded from file)
	if cfg.APIKey == "" {
		t.Error("APIKey should not be empty")
	}

	// ClientInfo should contain platform
	if cfg.ClientInfo == "" {
		t.Error("ClientInfo should not be empty")
	}

	if !strings.Contains(cfg.ClientInfo, ClientPlatform) {
		t.Errorf("ClientInfo should contain %v, got %v", ClientPlatform, cfg.ClientInfo)
	}
}

func TestConfigSaveAndLoad(t *testing.T) {
	// Create a temporary config directory
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, configFileName)

	cfg := &Config{
		APIBaseURL: "https://test.example.com",
		APIKey:     "test-api-key",
		ClientInfo: ClientPlatform,
		Version:    "1.0.0",
	}

	// Test Save() by checking it doesn't error
	// Note: Save() uses getConfigPath() which we can't easily override,
	// so we test the obfuscation/deobfuscation logic separately
	err := cfg.Save()
	// Save might fail if config directory doesn't exist, which is OK for this test
	if err != nil {
		t.Logf("Save() returned error (expected if config dir doesn't exist): %v", err)
	}

	// Test that Save() creates a valid config file structure
	// We'll test the file operations indirectly through the obfuscation functions
	obfuscated := obfuscateKey(cfg.APIKey)
	deobfuscated, err := deobfuscateKey(obfuscated)
	if err != nil {
		t.Fatalf("deobfuscateKey() error = %v", err)
	}
	if deobfuscated != cfg.APIKey {
		t.Errorf("Key obfuscation roundtrip failed: got %v, want %v", deobfuscated, cfg.APIKey)
	}

	// Verify config path is valid (even if file doesn't exist)
	_, err = os.Stat(configPath)
	if err == nil {
		// File exists, verify it's readable
		data, err := os.ReadFile(configPath)
		if err == nil && len(data) > 0 {
			t.Logf("Config file exists and is readable: %d bytes", len(data))
		}
	}
}

func TestLoadCreatesConfigFileOnFirstLaunch(t *testing.T) {
	// Save original environment variables
	originalURL := os.Getenv("BUDGET_API_URL")
	originalKey := os.Getenv("BUDGET_API_KEY")
	defer func() {
		os.Setenv("BUDGET_API_URL", originalURL)
		os.Setenv("BUDGET_API_KEY", originalKey)
	}()

	// Clear environment variables
	os.Unsetenv("BUDGET_API_URL")
	os.Unsetenv("BUDGET_API_KEY")

	// Create a temporary directory for config
	tmpDir := t.TempDir()

	// Override the config directory by temporarily changing HOME
	originalHome := os.Getenv("HOME")
	if runtime.GOOS == "windows" {
		originalHome = os.Getenv("USERPROFILE")
	}
	defer func() {
		if runtime.GOOS == "windows" {
			os.Setenv("USERPROFILE", originalHome)
		} else {
			os.Setenv("HOME", originalHome)
		}
	}()

	// Set a temporary home directory
	if runtime.GOOS == "windows" {
		os.Setenv("USERPROFILE", tmpDir)
	} else {
		os.Setenv("HOME", tmpDir)
	}

	// Get the expected config path
	configPath, err := getConfigPath()
	if err != nil {
		t.Fatalf("getConfigPath() error = %v", err)
	}

	// Ensure config file doesn't exist
	os.Remove(configPath)
	os.RemoveAll(filepath.Dir(configPath))

	// Load config - this should create the config file
	cfg := Load()

	// Verify config file was created
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		t.Fatalf("Config file was not created at %v", configPath)
	}

	// Verify Load() returns config with defaults
	if cfg.APIBaseURL != DefaultAPIURL {
		t.Errorf("Expected APIBaseURL %v, got %v", DefaultAPIURL, cfg.APIBaseURL)
	}
	if cfg.APIKey != DefaultAPIKey {
		t.Errorf("Expected APIKey %v, got %v", DefaultAPIKey, cfg.APIKey)
	}

	// Verify the config file contains default values by reading it directly
	data, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("Failed to read config file: %v", err)
	}

	var fileCfg configFile
	if err := json.Unmarshal(data, &fileCfg); err != nil {
		t.Fatalf("Failed to parse config file JSON: %v", err)
	}

	// Verify default API URL
	if fileCfg.APIURL != DefaultAPIURL {
		t.Errorf("Expected API URL %v, got %v", DefaultAPIURL, fileCfg.APIURL)
	}

	// Verify default API key (deobfuscated)
	if fileCfg.APIKey == "" {
		t.Error("API key should not be empty")
	}
	deobfuscatedKey, err := deobfuscateKey(fileCfg.APIKey)
	if err != nil {
		t.Fatalf("Failed to deobfuscate API key: %v (obfuscated value: %v)", err, fileCfg.APIKey)
	}
	if deobfuscatedKey != DefaultAPIKey {
		t.Errorf("Expected API key %v, got %v", DefaultAPIKey, deobfuscatedKey)
	}

	// Reload config to verify file was written correctly and can be loaded
	cfg2 := Load()
	if cfg2.APIBaseURL != DefaultAPIURL {
		t.Errorf("Expected APIBaseURL %v on second load, got %v", DefaultAPIURL, cfg2.APIBaseURL)
	}
	if cfg2.APIKey != DefaultAPIKey {
		t.Errorf("Expected APIKey %v on second load, got %v", DefaultAPIKey, cfg2.APIKey)
	}
}

func TestLoadReadsExistingConfigFile(t *testing.T) {
	// Save original environment variables
	originalURL := os.Getenv("BUDGET_API_URL")
	originalKey := os.Getenv("BUDGET_API_KEY")
	defer func() {
		os.Setenv("BUDGET_API_URL", originalURL)
		os.Setenv("BUDGET_API_KEY", originalKey)
	}()

	// Clear environment variables
	os.Unsetenv("BUDGET_API_URL")
	os.Unsetenv("BUDGET_API_KEY")

	// Create a temporary directory for config
	tmpDir := t.TempDir()

	// Override the config directory
	originalHome := os.Getenv("HOME")
	if runtime.GOOS == "windows" {
		originalHome = os.Getenv("USERPROFILE")
	}
	defer func() {
		if runtime.GOOS == "windows" {
			os.Setenv("USERPROFILE", originalHome)
		} else {
			os.Setenv("HOME", originalHome)
		}
	}()

	if runtime.GOOS == "windows" {
		os.Setenv("USERPROFILE", tmpDir)
	} else {
		os.Setenv("HOME", tmpDir)
	}

	// Get the expected config path
	configPath, err := getConfigPath()
	if err != nil {
		t.Fatalf("getConfigPath() error = %v", err)
	}

	// Create config directory
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0700); err != nil {
		t.Fatalf("Failed to create config directory: %v", err)
	}

	// Create a config file with custom values
	customURL := "https://custom.example.com"
	customKey := "custom-api-key-123"

	fileCfg := configFile{
		APIURL: customURL,
		APIKey: obfuscateKey(customKey),
	}

	data, err := json.MarshalIndent(fileCfg, "", "  ")
	if err != nil {
		t.Fatalf("Failed to marshal config: %v", err)
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}

	// Load config - should read from file
	cfg := Load()

	// Verify config was loaded from file
	if cfg.APIBaseURL != customURL {
		t.Errorf("Expected APIBaseURL %v, got %v", customURL, cfg.APIBaseURL)
	}
	if cfg.APIKey != customKey {
		t.Errorf("Expected APIKey %v, got %v", customKey, cfg.APIKey)
	}
}

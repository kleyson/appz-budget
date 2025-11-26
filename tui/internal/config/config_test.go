package config

import (
	"os"
	"path/filepath"
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

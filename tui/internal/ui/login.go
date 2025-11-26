package ui

import (
	"fmt"
	"strings"

	"github.com/appz/budget-tui/internal/api"
	"github.com/appz/budget-tui/internal/config"
	"github.com/appz/budget-tui/internal/models"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// LoginModel is the login screen model
type LoginModel struct {
	client         *api.Client
	config         *config.Config
	version        string
	emailInput     textinput.Model
	passInput      textinput.Model
	showAPIConfig  bool
	apiURLInput    textinput.Model
	apiKeyInput    textinput.Model
	apiConfigFocus int
	focusIndex     int
	err            error
	loading        bool
	width          int
	height         int
}

// LoginSuccessMsg is sent when login succeeds
type LoginSuccessMsg struct {
	User  *models.User
	Token string
}

// LoginErrorMsg is sent when login fails
type LoginErrorMsg struct {
	Err error
}

// NewLoginModel creates a new login model
func NewLoginModel(client *api.Client, cfg *config.Config) LoginModel {
	emailInput := textinput.New()
	emailInput.Placeholder = "email@example.com"
	emailInput.CharLimit = 100
	emailInput.Width = 40
	emailInput.Focus()

	passInput := textinput.New()
	passInput.Placeholder = "password"
	passInput.CharLimit = 100
	passInput.Width = 40
	passInput.EchoMode = textinput.EchoPassword
	passInput.EchoCharacter = '•'

	apiURLInput := textinput.New()
	apiURLInput.Placeholder = "https://budget.appz.wtf"
	apiURLInput.CharLimit = 200
	apiURLInput.Width = 40
	apiURLInput.SetValue(cfg.APIBaseURL)

	apiKeyInput := textinput.New()
	apiKeyInput.Placeholder = "your-secret-api-key-change-this"
	apiKeyInput.CharLimit = 200
	apiKeyInput.Width = 40
	apiKeyInput.EchoMode = textinput.EchoPassword
	apiKeyInput.EchoCharacter = '•'
	apiKeyInput.SetValue(cfg.APIKey)

	// Ensure client uses the current config values
	client.SetBaseURL(cfg.APIBaseURL)
	client.SetAPIKey(cfg.APIKey)

	return LoginModel{
		client:         client,
		config:         cfg,
		version:        cfg.Version,
		emailInput:     emailInput,
		passInput:      passInput,
		apiURLInput:    apiURLInput,
		apiKeyInput:    apiKeyInput,
		focusIndex:     0,
		apiConfigFocus: 0,
		showAPIConfig:  false,
	}
}

func (m LoginModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m LoginModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}

		if m.showAPIConfig {
			handled, newModel, cmd := m.handleAPIConfigKeys(msg)
			if handled {
				return newModel, cmd
			}
			// If not handled, continue to text input updates below
			m = newModel
		}

		switch msg.String() {
		case "ctrl+c", "esc":
			return m, tea.Quit

		case "s":
			// Show API config
			m.showAPIConfig = true
			m.apiConfigFocus = 0
			m.updateAPIConfigFocus()
			return m, nil

		case "tab", "shift+tab", "up", "down":
			if msg.String() == "up" || msg.String() == "shift+tab" {
				m.focusIndex--
			} else {
				m.focusIndex++
			}

			if m.focusIndex > 3 { // Added API config button
				m.focusIndex = 0
			} else if m.focusIndex < 0 {
				m.focusIndex = 3
			}

			m.updateFocus()
			return m, nil

		case "enter":
			if m.focusIndex == 2 {
				// Login button
				return m.doLogin()
			} else if m.focusIndex == 3 {
				// API Config button
				m.showAPIConfig = true
				m.apiConfigFocus = 0
				m.updateAPIConfigFocus()
				return m, nil
			}
			// Move to next field
			m.focusIndex++
			if m.focusIndex > 3 {
				m.focusIndex = 0
			}
			m.updateFocus()
			return m, nil
		}

	case LoginSuccessMsg:
		m.loading = false
		// This will be handled by the parent App model
		return m, nil

	case LoginErrorMsg:
		m.loading = false
		m.err = msg.Err
		return m, nil
	}

	// Update text inputs
	var cmd tea.Cmd
	if m.showAPIConfig {
		m.apiURLInput, cmd = m.apiURLInput.Update(msg)
		cmds = append(cmds, cmd)

		m.apiKeyInput, cmd = m.apiKeyInput.Update(msg)
		cmds = append(cmds, cmd)
	} else {
		m.emailInput, cmd = m.emailInput.Update(msg)
		cmds = append(cmds, cmd)

		m.passInput, cmd = m.passInput.Update(msg)
		cmds = append(cmds, cmd)
	}

	return m, tea.Batch(cmds...)
}

func (m *LoginModel) updateFocus() {
	if m.focusIndex == 0 {
		m.emailInput.Focus()
		m.passInput.Blur()
	} else if m.focusIndex == 1 {
		m.emailInput.Blur()
		m.passInput.Focus()
	} else {
		m.emailInput.Blur()
		m.passInput.Blur()
	}
}

func (m *LoginModel) updateAPIConfigFocus() {
	if m.apiConfigFocus == 0 {
		m.apiURLInput.Focus()
		m.apiKeyInput.Blur()
	} else {
		m.apiURLInput.Blur()
		m.apiKeyInput.Focus()
	}
}

func (m LoginModel) handleAPIConfigKeys(msg tea.KeyMsg) (handled bool, newModel LoginModel, cmd tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.showAPIConfig = false
		m.focusIndex = 0
		m.updateFocus()
		return true, m, nil

	case "tab", "down":
		m.apiConfigFocus++
		if m.apiConfigFocus > 1 {
			m.apiConfigFocus = 0
		}
		m.updateAPIConfigFocus()
		return true, m, nil

	case "shift+tab", "up":
		m.apiConfigFocus--
		if m.apiConfigFocus < 0 {
			m.apiConfigFocus = 1
		}
		m.updateAPIConfigFocus()
		return true, m, nil

	case "enter", "ctrl+s":
		newModel, cmd := m.saveAPIConfig()
		return true, newModel, cmd
	}

	// Key not handled by special cases, let text inputs handle it
	return false, m, nil
}

func (m LoginModel) saveAPIConfig() (LoginModel, tea.Cmd) {
	apiURL := strings.TrimSpace(m.apiURLInput.Value())
	apiKey := m.apiKeyInput.Value()

	if apiURL == "" {
		m.err = fmt.Errorf("API URL is required")
		return m, nil
	}

	// Remove trailing slash
	apiURL = strings.TrimSuffix(apiURL, "/")

	// Save to config
	m.config.APIBaseURL = apiURL
	m.config.APIKey = apiKey

	// Save to file
	if err := m.config.Save(); err != nil {
		m.err = fmt.Errorf("failed to save config: %w", err)
		return m, nil
	}

	// Update client
	m.client.SetBaseURL(apiURL)
	m.client.SetAPIKey(apiKey)

	m.showAPIConfig = false
	m.focusIndex = 0
	m.updateFocus()
	m.err = nil

	return m, nil
}

func (m LoginModel) doLogin() (tea.Model, tea.Cmd) {
	email := strings.TrimSpace(m.emailInput.Value())
	password := m.passInput.Value()

	if email == "" || password == "" {
		m.err = errEmptyCredentials
		return m, nil
	}

	m.loading = true
	m.err = nil

	return m, func() tea.Msg {
		_, err := m.client.Login(email, password)
		if err != nil {
			return LoginErrorMsg{Err: err}
		}

		user, err := m.client.GetMe()
		if err != nil {
			return LoginErrorMsg{Err: err}
		}

		return LoginSuccessMsg{
			User:  user,
			Token: m.client.GetToken(),
		}
	}
}

var errEmptyCredentials = &EmptyCredentialsError{}

type EmptyCredentialsError struct{}

func (e *EmptyCredentialsError) Error() string {
	return "Please enter both email and password"
}

func (m LoginModel) View() string {
	if m.showAPIConfig {
		return m.renderAPIConfig()
	}

	var b strings.Builder

	// Logo/Title
	logo := `
    ____            __           __
   / __ )__  ______/ /___ ____  / /_
  / __  / / / / __  / __ '/ _ \/ __/
 / /_/ / /_/ / /_/ / /_/ /  __/ /_
/_____/\__,_/\__,_/\__, /\___/\__/
                  /____/
`
	logoStyled := LogoStyle.Render(logo)

	// Title
	title := TitleStyle.Copy().
		Foreground(ColorText).
		Bold(true).
		Render("Welcome to Appz Budget")

	subtitle := SubtitleStyle.Render("Manage your budget from the terminal")

	// Version
	versionText := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render("v" + m.version)

	// Form
	emailLabel := InputLabelStyle.Render("Email")
	emailField := m.emailInput.View()
	if m.focusIndex == 0 {
		emailField = InputFocusedStyle.Render(emailField)
	} else {
		emailField = InputStyle.Render(emailField)
	}

	passLabel := InputLabelStyle.Render("Password")
	passField := m.passInput.View()
	if m.focusIndex == 1 {
		passField = InputFocusedStyle.Render(passField)
	} else {
		passField = InputStyle.Render(passField)
	}

	// Login button
	var loginBtn string
	if m.loading {
		loginBtn = ButtonStyle.Render("  Logging in...  ")
	} else if m.focusIndex == 2 {
		loginBtn = ButtonFocusedStyle.Render("  Login  ")
	} else {
		loginBtn = ButtonStyle.Render("  Login  ")
	}

	// API Config button
	var apiConfigBtn string
	if m.focusIndex == 3 {
		apiConfigBtn = ButtonFocusedStyle.Render("  ⚙️ API Settings  ")
	} else {
		apiConfigBtn = ButtonStyle.Render("  ⚙️ API Settings  ")
	}

	// Error message
	var errMsg string
	if m.err != nil {
		errMsg = ErrorStyle.Render("✗ " + m.err.Error())
	}

	// Help text
	help := HelpStyle.Render("Tab: navigate • Enter: submit • s: API settings • Esc: quit")

	// Build the form
	form := lipgloss.JoinVertical(lipgloss.Left,
		"",
		emailLabel,
		emailField,
		"",
		passLabel,
		passField,
		"",
		loginBtn,
		"",
		apiConfigBtn,
		"",
		errMsg,
	)

	// Card for the form
	card := CardStyle.Copy().
		Width(50).
		Align(lipgloss.Center).
		Render(form)

	// Center everything
	content := lipgloss.JoinVertical(lipgloss.Center,
		logoStyled,
		"",
		"",
		title,
		subtitle,
		versionText,
		"",
		"",
		card,
		"",
		help,
	)

	// Center on screen
	b.WriteString(lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		content,
	))

	return b.String()
}

func (m LoginModel) renderAPIConfig() string {
	var b strings.Builder

	title := TitleStyle.Copy().
		Foreground(ColorText).
		Bold(true).
		Render("⚙️  API Configuration")

	subtitle := SubtitleStyle.Render("Configure your API server URL and key")

	// API URL
	urlLabel := InputLabelStyle.Render("API URL")
	urlField := m.apiURLInput.View()
	if m.apiConfigFocus == 0 {
		urlField = InputFocusedStyle.Copy().Width(42).Render(urlField)
	} else {
		urlField = InputStyle.Copy().Width(42).Render(urlField)
	}

	// API Key
	keyLabel := InputLabelStyle.Render("API Key")
	keyField := m.apiKeyInput.View()
	if m.apiConfigFocus == 1 {
		keyField = InputFocusedStyle.Copy().Width(42).Render(keyField)
	} else {
		keyField = InputStyle.Copy().Width(42).Render(keyField)
	}

	// Save button
	saveBtn := ButtonStyle.Render("  Save (Ctrl+S)  ")

	// Cancel button
	cancelBtn := ButtonStyle.Render("  Cancel (Esc)  ")

	// Info
	info := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render("Settings saved to ~/.config/appz-budget-tui/config (obfuscated)")

	// Error message
	var errMsg string
	if m.err != nil {
		errMsg = ErrorStyle.Render("✗ " + m.err.Error())
	}

	// Help text
	help := HelpStyle.Render("Tab: navigate • Enter/Ctrl+S: save • Esc: cancel")

	// Build the form
	form := lipgloss.JoinVertical(lipgloss.Left,
		"",
		urlLabel,
		urlField,
		"",
		keyLabel,
		keyField,
		"",
		saveBtn+"  "+cancelBtn,
		"",
		info,
		"",
		errMsg,
	)

	// Card for the form
	card := CardStyle.Copy().
		Width(50).
		Align(lipgloss.Center).
		Render(form)

	// Center everything
	content := lipgloss.JoinVertical(lipgloss.Center,
		title,
		subtitle,
		"",
		card,
		"",
		help,
	)

	// Center on screen
	b.WriteString(lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		content,
	))

	return b.String()
}

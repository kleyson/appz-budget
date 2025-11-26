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

// SettingsTab represents settings sub-tabs
type SettingsTab int

const (
	SettingsCategories SettingsTab = iota
	SettingsPeriods
	SettingsIncomeTypes
	SettingsPassword
	SettingsAPI
	SettingsUsers
)

// SettingsView manages application settings
type SettingsView struct {
	client *api.Client
	user   *models.User
	config *config.Config

	activeTab SettingsTab

	// Data
	categories  []models.Category
	periods     []models.Period
	incomeTypes []models.IncomeType
	users       []models.User

	// List state
	cursor       int
	scrollOffset int

	// Form state
	showForm   bool
	formMode   string // "create" or "edit"
	formInputs []textinput.Model
	formFocus  int
	editingID  int

	// Password change
	passwordInputs []textinput.Model
	passwordFocus  int

	// API Config
	apiConfigInputs []textinput.Model
	apiConfigFocus  int

	// Confirmation
	showConfirm   bool
	confirmAction string

	loading      bool
	needsRefresh bool
	err          error
	message      string
}

// SettingsDataMsg is sent when settings data is loaded
type SettingsDataMsg struct {
	Categories  []models.Category
	Periods     []models.Period
	IncomeTypes []models.IncomeType
	Users       []models.User
}

// CategoryCreatedMsg is sent when a category is created
type CategoryCreatedMsg struct {
	Category *models.Category
}

// CategoryUpdatedMsg is sent when a category is updated
type CategoryUpdatedMsg struct {
	Category *models.Category
}

// CategoryDeletedMsg is sent when a category is deleted
type CategoryDeletedMsg struct{}

// PeriodCreatedMsg is sent when a period is created
type PeriodCreatedMsg struct {
	Period *models.Period
}

// PeriodUpdatedMsg is sent when a period is updated
type PeriodUpdatedMsg struct {
	Period *models.Period
}

// PeriodDeletedMsg is sent when a period is deleted
type PeriodDeletedMsg struct{}

// IncomeTypeCreatedMsg is sent when an income type is created
type IncomeTypeCreatedMsg struct {
	IncomeType *models.IncomeType
}

// IncomeTypeUpdatedMsg is sent when an income type is updated
type IncomeTypeUpdatedMsg struct {
	IncomeType *models.IncomeType
}

// IncomeTypeDeletedMsg is sent when an income type is deleted
type IncomeTypeDeletedMsg struct{}

// PasswordChangedMsg is sent when password is changed
type PasswordChangedMsg struct{}

// SettingsErrorMsg is sent on error
type SettingsErrorMsg struct {
	Err error
}

// NewSettingsView creates a new settings view
func NewSettingsView(client *api.Client, user *models.User, cfg *config.Config) SettingsView {
	return SettingsView{
		client:  client,
		user:    user,
		config:  cfg,
		loading: true,
	}
}

// SetData sets the settings data
func (s *SettingsView) SetData(categories []models.Category, periods []models.Period, incomeTypes []models.IncomeType) {
	s.categories = categories
	s.periods = periods
	s.incomeTypes = incomeTypes
}

// NeedsRefresh returns true if data needs refreshing
func (s *SettingsView) NeedsRefresh() bool {
	result := s.needsRefresh
	s.needsRefresh = false
	return result
}

// Refresh reloads the settings data
func (s SettingsView) Refresh() tea.Cmd {
	return func() tea.Msg {
		categories, err := s.client.GetCategories()
		if err != nil {
			return SettingsErrorMsg{Err: err}
		}

		periods, err := s.client.GetPeriods()
		if err != nil {
			return SettingsErrorMsg{Err: err}
		}

		incomeTypes, err := s.client.GetIncomeTypes()
		if err != nil {
			return SettingsErrorMsg{Err: err}
		}

		var users []models.User
		if s.user != nil && s.user.IsAdmin {
			users, _ = s.client.GetUsers()
		}

		return SettingsDataMsg{
			Categories:  categories,
			Periods:     periods,
			IncomeTypes: incomeTypes,
			Users:       users,
		}
	}
}

func (s SettingsView) Update(msg tea.Msg) (SettingsView, tea.Cmd) {
	switch msg := msg.(type) {
	case SettingsDataMsg:
		s.loading = false
		s.categories = msg.Categories
		s.periods = msg.Periods
		s.incomeTypes = msg.IncomeTypes
		s.users = msg.Users
		s.err = nil

	case CategoryCreatedMsg, CategoryUpdatedMsg, CategoryDeletedMsg,
		PeriodCreatedMsg, PeriodUpdatedMsg, PeriodDeletedMsg,
		IncomeTypeCreatedMsg, IncomeTypeUpdatedMsg, IncomeTypeDeletedMsg:
		s.loading = false
		s.showForm = false
		s.showConfirm = false
		s.message = "Operation completed successfully"
		s.needsRefresh = true

	case PasswordChangedMsg:
		s.loading = false
		s.message = "Password changed successfully"
		s.initPasswordForm()

	case SettingsErrorMsg:
		s.loading = false
		s.err = msg.Err

	case tea.KeyMsg:
		if s.showConfirm {
			return s.handleConfirmKeys(msg)
		}
		if s.showForm {
			return s.handleFormKeys(msg)
		}
		if s.activeTab == SettingsPassword {
			return s.handlePasswordKeys(msg)
		}
		if s.activeTab == SettingsAPI {
			handled, newView, cmd := s.handleAPIConfigKeys(msg)
			if handled {
				return newView, cmd
			}
			// If not handled, continue to text input updates below
			s = newView
		}
		return s.handleListKeys(msg)
	}

	// Update form inputs if showing
	if s.showForm {
		var cmd tea.Cmd
		for i := range s.formInputs {
			s.formInputs[i], cmd = s.formInputs[i].Update(msg)
			if cmd != nil {
				return s, cmd
			}
		}
	}

	// Update password inputs
	if s.activeTab == SettingsPassword && len(s.passwordInputs) > 0 {
		var cmd tea.Cmd
		for i := range s.passwordInputs {
			s.passwordInputs[i], cmd = s.passwordInputs[i].Update(msg)
			if cmd != nil {
				return s, cmd
			}
		}
	}

	// Update API config inputs
	if s.activeTab == SettingsAPI && len(s.apiConfigInputs) > 0 {
		var cmd tea.Cmd
		for i := range s.apiConfigInputs {
			s.apiConfigInputs[i], cmd = s.apiConfigInputs[i].Update(msg)
			if cmd != nil {
				return s, cmd
			}
		}
	}

	return s, nil
}

func (s SettingsView) handleListKeys(msg tea.KeyMsg) (SettingsView, tea.Cmd) {
	switch msg.String() {
	case "tab":
		s.activeTab++
		maxTab := SettingsAPI
		if s.user != nil && s.user.IsAdmin {
			maxTab = SettingsUsers
		}
		if s.activeTab > maxTab {
			s.activeTab = SettingsCategories
		}
		s.cursor = 0
		s.scrollOffset = 0
		if s.activeTab == SettingsPassword {
			s.initPasswordForm()
		} else if s.activeTab == SettingsAPI {
			s.initAPIConfigForm()
		}

	case "shift+tab":
		s.activeTab--
		if s.activeTab < SettingsCategories {
			maxTab := SettingsAPI
			if s.user != nil && s.user.IsAdmin {
				maxTab = SettingsUsers
			}
			s.activeTab = maxTab
		}
		s.cursor = 0
		s.scrollOffset = 0
		if s.activeTab == SettingsPassword {
			s.initPasswordForm()
		} else if s.activeTab == SettingsAPI {
			s.initAPIConfigForm()
		}

	case "up", "k":
		if s.cursor > 0 {
			s.cursor--
			if s.cursor < s.scrollOffset {
				s.scrollOffset = s.cursor
			}
		}

	case "down", "j":
		maxCursor := s.getCurrentListLength() - 1
		if s.cursor < maxCursor {
			s.cursor++
		}

	case "n":
		if s.activeTab != SettingsPassword && s.activeTab != SettingsUsers && s.activeTab != SettingsAPI {
			s.showForm = true
			s.formMode = "create"
			s.initForm(nil)
		}

	case "e", "enter":
		if s.activeTab != SettingsPassword && s.activeTab != SettingsUsers && s.activeTab != SettingsAPI {
			if s.getCurrentListLength() > 0 {
				s.showForm = true
				s.formMode = "edit"
				s.editingID = s.getCurrentItemID()
				s.initForm(s.getCurrentItem())
			}
		}

	case "d":
		if s.activeTab != SettingsPassword && s.activeTab != SettingsAPI && s.getCurrentListLength() > 0 {
			s.showConfirm = true
			s.confirmAction = "delete"
		}
	}

	return s, nil
}

func (s SettingsView) handleFormKeys(msg tea.KeyMsg) (SettingsView, tea.Cmd) {
	switch msg.String() {
	case "esc":
		s.showForm = false
		return s, nil

	case "tab", "down":
		s.formFocus++
		if s.formFocus > 2 { // 0: name, 1: color, 2: randomize button
			s.formFocus = 0
		}
		s.updateFormFocus()

	case "shift+tab", "up":
		s.formFocus--
		if s.formFocus < 0 {
			s.formFocus = 2
		}
		s.updateFormFocus()

	case "enter", "ctrl+s":
		if s.formFocus == 2 {
			// Randomize color button
			return s.randomizeColor()
		}
		return s.submitForm()

	case "r":
		// Quick shortcut to randomize color
		if s.formFocus == 1 {
			return s.randomizeColor()
		}
	}

	return s, nil
}

func (s SettingsView) handlePasswordKeys(msg tea.KeyMsg) (SettingsView, tea.Cmd) {
	switch msg.String() {
	case "up":
		s.passwordFocus--
		if s.passwordFocus < 0 {
			s.passwordFocus = 2
		}
		s.updatePasswordFocus()

	case "down":
		s.passwordFocus++
		if s.passwordFocus > 2 {
			s.passwordFocus = 0
		}
		s.updatePasswordFocus()

	case "enter":
		if s.passwordFocus < 2 {
			s.passwordFocus++
			s.updatePasswordFocus()
		} else {
			return s.submitPasswordChange()
		}

	case "ctrl+s":
		return s.submitPasswordChange()
	}

	return s, nil
}

func (s SettingsView) handleConfirmKeys(msg tea.KeyMsg) (SettingsView, tea.Cmd) {
	switch msg.String() {
	case "y", "Y":
		if s.confirmAction == "delete" {
			s.loading = true
			return s, s.deleteCurrentItem()
		}

	case "n", "N", "esc":
		s.showConfirm = false
	}

	return s, nil
}

func (s *SettingsView) getCurrentListLength() int {
	switch s.activeTab {
	case SettingsCategories:
		return len(s.categories)
	case SettingsPeriods:
		return len(s.periods)
	case SettingsIncomeTypes:
		return len(s.incomeTypes)
	case SettingsUsers:
		return len(s.users)
	default:
		return 0
	}
}

func (s *SettingsView) getCurrentItemID() int {
	switch s.activeTab {
	case SettingsCategories:
		if s.cursor < len(s.categories) {
			return s.categories[s.cursor].ID
		}
	case SettingsPeriods:
		if s.cursor < len(s.periods) {
			return s.periods[s.cursor].ID
		}
	case SettingsIncomeTypes:
		if s.cursor < len(s.incomeTypes) {
			return s.incomeTypes[s.cursor].ID
		}
	case SettingsUsers:
		if s.cursor < len(s.users) {
			return s.users[s.cursor].ID
		}
	}
	return 0
}

func (s *SettingsView) getCurrentItem() interface{} {
	switch s.activeTab {
	case SettingsCategories:
		if s.cursor < len(s.categories) {
			return &s.categories[s.cursor]
		}
	case SettingsPeriods:
		if s.cursor < len(s.periods) {
			return &s.periods[s.cursor]
		}
	case SettingsIncomeTypes:
		if s.cursor < len(s.incomeTypes) {
			return &s.incomeTypes[s.cursor]
		}
	}
	return nil
}

func (s *SettingsView) initForm(item interface{}) {
	s.formInputs = make([]textinput.Model, 2)

	// Name
	s.formInputs[0] = textinput.New()
	s.formInputs[0].Placeholder = "Name"
	s.formInputs[0].CharLimit = 50
	s.formInputs[0].Width = 30
	s.formInputs[0].Focus()

	// Color
	s.formInputs[1] = textinput.New()
	s.formInputs[1].Placeholder = "#3b82f6"
	s.formInputs[1].CharLimit = 7
	s.formInputs[1].Width = 10

	if item != nil {
		switch v := item.(type) {
		case *models.Category:
			s.formInputs[0].SetValue(v.Name)
			s.formInputs[1].SetValue(v.Color)
		case *models.Period:
			s.formInputs[0].SetValue(v.Name)
			s.formInputs[1].SetValue(v.Color)
		case *models.IncomeType:
			s.formInputs[0].SetValue(v.Name)
			s.formInputs[1].SetValue(v.Color)
		}
	}

	s.formFocus = 0
}

func (s *SettingsView) initPasswordForm() {
	s.passwordInputs = make([]textinput.Model, 3)

	// Current password
	s.passwordInputs[0] = textinput.New()
	s.passwordInputs[0].Placeholder = "Current password"
	s.passwordInputs[0].CharLimit = 100
	s.passwordInputs[0].Width = 30
	s.passwordInputs[0].EchoMode = textinput.EchoPassword
	s.passwordInputs[0].EchoCharacter = '•'
	s.passwordInputs[0].Focus()

	// New password
	s.passwordInputs[1] = textinput.New()
	s.passwordInputs[1].Placeholder = "New password"
	s.passwordInputs[1].CharLimit = 100
	s.passwordInputs[1].Width = 30
	s.passwordInputs[1].EchoMode = textinput.EchoPassword
	s.passwordInputs[1].EchoCharacter = '•'

	// Confirm new password
	s.passwordInputs[2] = textinput.New()
	s.passwordInputs[2].Placeholder = "Confirm new password"
	s.passwordInputs[2].CharLimit = 100
	s.passwordInputs[2].Width = 30
	s.passwordInputs[2].EchoMode = textinput.EchoPassword
	s.passwordInputs[2].EchoCharacter = '•'

	s.passwordFocus = 0
}

func (s *SettingsView) updateFormFocus() {
	for i := range s.formInputs {
		if i == s.formFocus {
			s.formInputs[i].Focus()
		} else {
			s.formInputs[i].Blur()
		}
	}
}

func (s SettingsView) randomizeColor() (SettingsView, tea.Cmd) {
	// Generate a random hex color
	colors := []string{
		"#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e",
		"#ef4444", "#f59e0b", "#10b981", "#06b6d4",
		"#6366f1", "#a855f7", "#f97316", "#84cc16",
		"#14b8a6", "#0ea5e9", "#64748b", "#94a3b8",
	}

	// Use a simple hash of current time or cursor position for pseudo-random
	idx := (s.cursor + len(s.formInputs[0].Value())) % len(colors)
	randomColor := colors[idx]

	s.formInputs[1].SetValue(randomColor)
	s.formFocus = 1 // Keep focus on color field
	s.updateFormFocus()

	return s, nil
}

func (s *SettingsView) updatePasswordFocus() {
	for i := range s.passwordInputs {
		if i == s.passwordFocus {
			s.passwordInputs[i].Focus()
		} else {
			s.passwordInputs[i].Blur()
		}
	}
}

func (s SettingsView) submitForm() (SettingsView, tea.Cmd) {
	name := strings.TrimSpace(s.formInputs[0].Value())
	if name == "" {
		s.err = fmt.Errorf("name is required")
		return s, nil
	}

	color := strings.TrimSpace(s.formInputs[1].Value())
	if color == "" {
		color = "#3b82f6" // Default blue
	}

	s.loading = true

	switch s.activeTab {
	case SettingsCategories:
		if s.formMode == "create" {
			return s, func() tea.Msg {
				cat, err := s.client.CreateCategory(&models.CategoryCreate{
					Name:  name,
					Color: color,
				})
				if err != nil {
					return SettingsErrorMsg{Err: err}
				}
				return CategoryCreatedMsg{Category: cat}
			}
		}
		return s, func() tea.Msg {
			cat, err := s.client.UpdateCategory(s.editingID, &models.CategoryUpdate{
				Name:  name,
				Color: color,
			})
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return CategoryUpdatedMsg{Category: cat}
		}

	case SettingsPeriods:
		if s.formMode == "create" {
			return s, func() tea.Msg {
				period, err := s.client.CreatePeriod(&models.PeriodCreate{
					Name:  name,
					Color: color,
				})
				if err != nil {
					return SettingsErrorMsg{Err: err}
				}
				return PeriodCreatedMsg{Period: period}
			}
		}
		return s, func() tea.Msg {
			period, err := s.client.UpdatePeriod(s.editingID, &models.PeriodUpdate{
				Name:  name,
				Color: color,
			})
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return PeriodUpdatedMsg{Period: period}
		}

	case SettingsIncomeTypes:
		if s.formMode == "create" {
			return s, func() tea.Msg {
				incType, err := s.client.CreateIncomeType(&models.IncomeTypeCreate{
					Name:  name,
					Color: color,
				})
				if err != nil {
					return SettingsErrorMsg{Err: err}
				}
				return IncomeTypeCreatedMsg{IncomeType: incType}
			}
		}
		return s, func() tea.Msg {
			incType, err := s.client.UpdateIncomeType(s.editingID, &models.IncomeTypeUpdate{
				Name:  name,
				Color: color,
			})
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return IncomeTypeUpdatedMsg{IncomeType: incType}
		}
	}

	return s, nil
}

func (s SettingsView) submitPasswordChange() (SettingsView, tea.Cmd) {
	currentPass := s.passwordInputs[0].Value()
	newPass := s.passwordInputs[1].Value()
	confirmPass := s.passwordInputs[2].Value()

	if currentPass == "" || newPass == "" || confirmPass == "" {
		s.err = fmt.Errorf("all fields are required")
		return s, nil
	}

	if newPass != confirmPass {
		s.err = fmt.Errorf("new passwords do not match")
		return s, nil
	}

	if len(newPass) < 6 {
		s.err = fmt.Errorf("password must be at least 6 characters")
		return s, nil
	}

	s.loading = true
	return s, func() tea.Msg {
		err := s.client.ChangePassword(currentPass, newPass)
		if err != nil {
			return SettingsErrorMsg{Err: err}
		}
		return PasswordChangedMsg{}
	}
}

func (s *SettingsView) initAPIConfigForm() {
	s.apiConfigInputs = make([]textinput.Model, 2)

	// API URL
	s.apiConfigInputs[0] = textinput.New()
	s.apiConfigInputs[0].Placeholder = "https://budget.appz.wtf"
	s.apiConfigInputs[0].CharLimit = 200
	s.apiConfigInputs[0].Width = 50
	s.apiConfigInputs[0].SetValue(s.config.APIBaseURL)
	s.apiConfigInputs[0].Focus()

	// API Key
	s.apiConfigInputs[1] = textinput.New()
	s.apiConfigInputs[1].Placeholder = "your-secret-api-key-change-this"
	s.apiConfigInputs[1].CharLimit = 200
	s.apiConfigInputs[1].Width = 50
	s.apiConfigInputs[1].EchoMode = textinput.EchoPassword
	s.apiConfigInputs[1].EchoCharacter = '•'
	s.apiConfigInputs[1].SetValue(s.config.APIKey)

	s.apiConfigFocus = 0
}

func (s *SettingsView) updateAPIConfigFocus() {
	for i := range s.apiConfigInputs {
		if i == s.apiConfigFocus {
			s.apiConfigInputs[i].Focus()
		} else {
			s.apiConfigInputs[i].Blur()
		}
	}
}

func (s SettingsView) handleAPIConfigKeys(msg tea.KeyMsg) (handled bool, newView SettingsView, cmd tea.Cmd) {
	switch msg.String() {
	case "up":
		s.apiConfigFocus--
		if s.apiConfigFocus < 0 {
			s.apiConfigFocus = 1
		}
		s.updateAPIConfigFocus()
		return true, s, nil

	case "down":
		s.apiConfigFocus++
		if s.apiConfigFocus > 1 {
			s.apiConfigFocus = 0
		}
		s.updateAPIConfigFocus()
		return true, s, nil

	case "enter":
		if s.apiConfigFocus < 1 {
			s.apiConfigFocus++
			s.updateAPIConfigFocus()
			return true, s, nil
		} else {
			newView, cmd := s.submitAPIConfig()
			return true, newView, cmd
		}

	case "ctrl+s":
		newView, cmd := s.submitAPIConfig()
		return true, newView, cmd
	}

	// Key not handled by special cases, let text inputs handle it
	return false, s, nil
}

func (s SettingsView) submitAPIConfig() (SettingsView, tea.Cmd) {
	apiURL := strings.TrimSpace(s.apiConfigInputs[0].Value())
	apiKey := s.apiConfigInputs[1].Value()

	if apiURL == "" {
		s.err = fmt.Errorf("API URL is required")
		return s, nil
	}

	// Remove trailing slash
	apiURL = strings.TrimSuffix(apiURL, "/")

	// Save to config
	s.config.APIBaseURL = apiURL
	s.config.APIKey = apiKey

	// Save to file
	if err := s.config.Save(); err != nil {
		s.err = fmt.Errorf("failed to save config: %w", err)
		return s, nil
	}

	// Update client
	s.client.SetBaseURL(apiURL)
	s.client.SetAPIKey(apiKey)

	s.message = "API configuration saved successfully"
	return s, nil
}

func (s SettingsView) deleteCurrentItem() tea.Cmd {
	id := s.getCurrentItemID()
	if id == 0 {
		return nil
	}

	switch s.activeTab {
	case SettingsCategories:
		return func() tea.Msg {
			err := s.client.DeleteCategory(id)
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return CategoryDeletedMsg{}
		}

	case SettingsPeriods:
		return func() tea.Msg {
			err := s.client.DeletePeriod(id)
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return PeriodDeletedMsg{}
		}

	case SettingsIncomeTypes:
		return func() tea.Msg {
			err := s.client.DeleteIncomeType(id)
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return IncomeTypeDeletedMsg{}
		}

	case SettingsUsers:
		return func() tea.Msg {
			err := s.client.DeleteUser(id)
			if err != nil {
				return SettingsErrorMsg{Err: err}
			}
			return CategoryDeletedMsg{} // Reuse message
		}
	}

	return nil
}

func (s SettingsView) View(width, height int) string {
	if s.showConfirm {
		return s.renderConfirmDialog(width, height)
	}

	if s.showForm {
		return s.renderForm(width, height)
	}

	var b strings.Builder

	// Sub-tabs
	tabs := s.renderTabs()
	b.WriteString(tabs)
	b.WriteString("\n\n")

	// Content based on active tab
	contentHeight := height - 8
	switch s.activeTab {
	case SettingsCategories:
		b.WriteString(s.renderCategoriesList(width, contentHeight))
	case SettingsPeriods:
		b.WriteString(s.renderPeriodsList(width, contentHeight))
	case SettingsIncomeTypes:
		b.WriteString(s.renderIncomeTypesList(width, contentHeight))
	case SettingsPassword:
		b.WriteString(s.renderPasswordForm(width, contentHeight))
	case SettingsAPI:
		b.WriteString(s.renderAPIConfigForm(width, contentHeight))
	case SettingsUsers:
		b.WriteString(s.renderUsersList(width, contentHeight))
	}

	// Message or error
	if s.message != "" {
		b.WriteString("\n")
		b.WriteString(MessageStyle.Render("✓ " + s.message))
	}
	if s.err != nil {
		b.WriteString("\n")
		b.WriteString(ErrorStyle.Render("✗ " + s.err.Error()))
	}

	// Help
	b.WriteString("\n")
	if s.activeTab == SettingsPassword || s.activeTab == SettingsAPI {
		b.WriteString(HelpStyle.Render("Tab/Shift+Tab: switch sections | Enter/Ctrl+S: save"))
	} else {
		b.WriteString(HelpStyle.Render("Tab/Shift+Tab: switch sections | n: new | e: edit | d: delete"))
	}

	return b.String()
}

func (s SettingsView) renderTabs() string {
	tabs := []struct {
		name string
		icon string
		tab  SettingsTab
	}{
		{"Categories", "🏷️", SettingsCategories},
		{"Periods", "📅", SettingsPeriods},
		{"Income Types", "💵", SettingsIncomeTypes},
		{"Password", "🔒", SettingsPassword},
		{"API Config", "⚙️", SettingsAPI},
	}

	// Add users tab for admins
	if s.user != nil && s.user.IsAdmin {
		tabs = append(tabs, struct {
			name string
			icon string
			tab  SettingsTab
		}{"Users", "👥", SettingsUsers})
	}

	var tabViews []string
	for _, tab := range tabs {
		style := TabStyle
		if s.activeTab == tab.tab {
			style = ActiveTabStyle
		}
		tabViews = append(tabViews, style.Render(fmt.Sprintf("%s  %s", tab.icon, tab.name)))
	}

	return lipgloss.JoinHorizontal(lipgloss.Top, tabViews...)
}

func (s SettingsView) renderCategoriesList(width, height int) string {
	title := TitleStyle.Render("🏷️  Categories")
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(s.categories)))

	if len(s.categories) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title+" "+count,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No categories. Press 'n' to create one."),
		)
	}

	var rows []string
	for i, cat := range s.categories {
		colorBox := lipgloss.NewStyle().
			Background(lipgloss.Color(cat.Color)).
			Render("   ")

		row := fmt.Sprintf("%s   %-30s  %s", colorBox, cat.Name, cat.Color)

		if i == s.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title+" "+count,
		"",
		strings.Join(rows, "\n"),
	)
}

func (s SettingsView) renderPeriodsList(width, height int) string {
	title := TitleStyle.Render("📅  Periods")
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(s.periods)))

	if len(s.periods) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title+" "+count,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No periods. Press 'n' to create one."),
		)
	}

	var rows []string
	for i, period := range s.periods {
		colorBox := lipgloss.NewStyle().
			Background(lipgloss.Color(period.Color)).
			Render("   ")

		row := fmt.Sprintf("%s   %-30s  %s", colorBox, period.Name, period.Color)

		if i == s.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title+" "+count,
		"",
		strings.Join(rows, "\n"),
	)
}

func (s SettingsView) renderIncomeTypesList(width, height int) string {
	title := TitleStyle.Render("💵  Income Types")
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(s.incomeTypes)))

	if len(s.incomeTypes) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title+" "+count,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No income types. Press 'n' to create one."),
		)
	}

	var rows []string
	for i, incType := range s.incomeTypes {
		colorBox := lipgloss.NewStyle().
			Background(lipgloss.Color(incType.Color)).
			Render("   ")

		row := fmt.Sprintf("%s   %-30s  %s", colorBox, incType.Name, incType.Color)

		if i == s.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title+" "+count,
		"",
		strings.Join(rows, "\n"),
	)
}

func (s SettingsView) renderUsersList(width, height int) string {
	title := TitleStyle.Render("👥  Users")
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(s.users)))

	if len(s.users) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title+" "+count,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No users found."),
		)
	}

	// Header
	header := fmt.Sprintf("%-30s %-20s %-10s %-10s", "Email", "Name", "Active", "Admin")
	headerStyled := TableHeaderStyle.Render(header)

	var rows []string
	for i, user := range s.users {
		name := ""
		if user.FullName != nil {
			name = *user.FullName
		}

		active := "No"
		if user.IsActive {
			active = SuccessStyle.Render("Yes")
		} else {
			active = DangerStyle.Render("No")
		}

		admin := "No"
		if user.IsAdmin {
			admin = BadgeStyle.Render("Yes")
		}

		row := fmt.Sprintf("%-30s %-20s %-10s %-10s", user.Email, name, active, admin)

		if i == s.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		title+" "+count,
		"",
		headerStyled,
		strings.Join(rows, "\n"),
	)
}

func (s SettingsView) renderPasswordForm(width, height int) string {
	title := TitleStyle.Render("🔒  Change Password")

	if len(s.passwordInputs) == 0 {
		return title
	}

	var b strings.Builder
	b.WriteString(title)
	b.WriteString("\n\n")

	// Current password
	b.WriteString(InputLabelStyle.Render("Current Password"))
	b.WriteString("\n")
	if s.passwordFocus == 0 {
		b.WriteString(InputFocusedStyle.Render(s.passwordInputs[0].View()))
	} else {
		b.WriteString(InputStyle.Render(s.passwordInputs[0].View()))
	}
	b.WriteString("\n\n")

	// New password
	b.WriteString(InputLabelStyle.Render("New Password"))
	b.WriteString("\n")
	if s.passwordFocus == 1 {
		b.WriteString(InputFocusedStyle.Render(s.passwordInputs[1].View()))
	} else {
		b.WriteString(InputStyle.Render(s.passwordInputs[1].View()))
	}
	b.WriteString("\n\n")

	// Confirm password
	b.WriteString(InputLabelStyle.Render("Confirm New Password"))
	b.WriteString("\n")
	if s.passwordFocus == 2 {
		b.WriteString(InputFocusedStyle.Render(s.passwordInputs[2].View()))
	} else {
		b.WriteString(InputStyle.Render(s.passwordInputs[2].View()))
	}
	b.WriteString("\n\n")

	// Button
	b.WriteString(ButtonStyle.Render("  Change Password (Ctrl+S)  "))

	return b.String()
}

func (s SettingsView) renderAPIConfigForm(width, height int) string {
	title := TitleStyle.Render("⚙️  API Configuration")

	if len(s.apiConfigInputs) == 0 {
		s.initAPIConfigForm()
	}

	var b strings.Builder
	b.WriteString(title)
	b.WriteString("\n\n")

	// API URL
	b.WriteString(InputLabelStyle.Render("API URL"))
	b.WriteString("\n")
	if s.apiConfigFocus == 0 {
		b.WriteString(InputFocusedStyle.Copy().Width(52).Render(s.apiConfigInputs[0].View()))
	} else {
		b.WriteString(InputStyle.Copy().Width(52).Render(s.apiConfigInputs[0].View()))
	}
	b.WriteString("\n\n")

	// API Key
	b.WriteString(InputLabelStyle.Render("API Key"))
	b.WriteString("\n")
	if s.apiConfigFocus == 1 {
		b.WriteString(InputFocusedStyle.Copy().Width(52).Render(s.apiConfigInputs[1].View()))
	} else {
		b.WriteString(InputStyle.Copy().Width(52).Render(s.apiConfigInputs[1].View()))
	}
	b.WriteString("\n\n")

	// Info
	info := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render("Settings are saved to ~/.config/appz-budget-tui/config (obfuscated)")
	b.WriteString(info)
	b.WriteString("\n\n")

	// Button
	b.WriteString(ButtonStyle.Render("  Save (Ctrl+S)  "))

	// Error
	if s.err != nil {
		b.WriteString("\n\n")
		b.WriteString(ErrorStyle.Render("✗ " + s.err.Error()))
	}

	return b.String()
}

func (s SettingsView) renderForm(width, height int) string {
	var title string
	switch s.activeTab {
	case SettingsCategories:
		if s.formMode == "create" {
			title = "Create Category"
		} else {
			title = "Edit Category"
		}
	case SettingsPeriods:
		if s.formMode == "create" {
			title = "Create Period"
		} else {
			title = "Edit Period"
		}
	case SettingsIncomeTypes:
		if s.formMode == "create" {
			title = "Create Income Type"
		} else {
			title = "Edit Income Type"
		}
	}

	var b strings.Builder
	b.WriteString(ModalTitleStyle.Render(title))
	b.WriteString("\n\n")

	// Name field
	b.WriteString(InputLabelStyle.Render("Name"))
	b.WriteString("\n")
	if s.formFocus == 0 {
		b.WriteString(InputFocusedStyle.Render(s.formInputs[0].View()))
	} else {
		b.WriteString(InputStyle.Render(s.formInputs[0].View()))
	}
	b.WriteString("\n\n")

	// Color field
	b.WriteString(InputLabelStyle.Render("Color (hex)"))
	b.WriteString("\n")
	colorInput := s.formInputs[1].View()
	colorPreview := ""
	if s.formInputs[1].Value() != "" {
		colorPreview = lipgloss.NewStyle().
			Background(lipgloss.Color(s.formInputs[1].Value())).
			Render("     ")
	}
	if s.formFocus == 1 {
		b.WriteString(InputFocusedStyle.Copy().Width(12).Render(colorInput))
	} else {
		b.WriteString(InputStyle.Copy().Width(12).Render(colorInput))
	}
	b.WriteString("  " + colorPreview)
	b.WriteString("\n\n")

	// Randomize color button
	var randomBtn string
	if s.formFocus == 2 {
		randomBtn = ButtonFocusedStyle.Render("  🎲 Randomize Color (r)  ")
	} else {
		randomBtn = ButtonStyle.Render("  🎲 Randomize Color (r)  ")
	}
	b.WriteString(randomBtn)
	b.WriteString("\n\n")

	// Buttons
	saveBtn := ButtonStyle.Render("  Save (Ctrl+S)  ")
	cancelBtn := ButtonStyle.Render("  Cancel (Esc)  ")
	b.WriteString(saveBtn + "  " + cancelBtn)

	form := ModalStyle.Render(b.String())

	return lipgloss.Place(
		width,
		height,
		lipgloss.Center,
		lipgloss.Center,
		form,
	)
}

func (s SettingsView) renderConfirmDialog(width, height int) string {
	var itemName string
	var itemType string

	switch s.activeTab {
	case SettingsCategories:
		itemType = "category"
		if s.cursor < len(s.categories) {
			itemName = s.categories[s.cursor].Name
		}
	case SettingsPeriods:
		itemType = "period"
		if s.cursor < len(s.periods) {
			itemName = s.periods[s.cursor].Name
		}
	case SettingsIncomeTypes:
		itemType = "income type"
		if s.cursor < len(s.incomeTypes) {
			itemName = s.incomeTypes[s.cursor].Name
		}
	case SettingsUsers:
		itemType = "user"
		if s.cursor < len(s.users) {
			itemName = s.users[s.cursor].Email
		}
	}

	title := ModalTitleStyle.Render(fmt.Sprintf("Delete %s", itemType))
	message := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(fmt.Sprintf("Are you sure you want to delete '%s'?", itemName))

	buttons := lipgloss.JoinHorizontal(lipgloss.Left,
		ButtonDangerStyle.Render("  Yes (y)  "),
		"  ",
		ButtonStyle.Render("  No (n)  "),
	)

	content := lipgloss.JoinVertical(lipgloss.Center,
		title,
		"",
		message,
		"",
		buttons,
	)

	dialog := ModalStyle.Render(content)

	return lipgloss.Place(
		width,
		height,
		lipgloss.Center,
		lipgloss.Center,
		dialog,
	)
}

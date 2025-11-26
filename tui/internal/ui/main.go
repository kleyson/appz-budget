package ui

import (
	"fmt"
	"strings"

	"github.com/appz/budget-tui/internal/api"
	"github.com/appz/budget-tui/internal/config"
	"github.com/appz/budget-tui/internal/models"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// MainTab represents the main navigation tabs
type MainTab int

const (
	TabSummary MainTab = iota
	TabExpenses
	TabIncome
	TabSettings
)

// MainModel is the main application view after login
type MainModel struct {
	client  *api.Client
	user    *models.User
	version string
	config  *config.Config

	activeTab MainTab

	// Data
	months        []models.Month
	currentMonth  *models.Month
	selectedMonth *models.Month
	periods       []models.Period
	categories    []models.Category
	incomeTypes   []models.IncomeType

	// Sub-views
	summaryView  SummaryView
	expensesView ExpensesView
	incomeView   IncomeView
	settingsView SettingsView

	// UI state
	loading  bool
	err      error
	message  string
	width    int
	height   int
	showHelp bool
}

// DataLoadedMsg is sent when initial data is loaded
type DataLoadedMsg struct {
	Months      []models.Month
	Current     *models.Month
	Periods     []models.Period
	Categories  []models.Category
	IncomeTypes []models.IncomeType
}

// DataLoadErrorMsg is sent when data loading fails
type DataLoadErrorMsg struct {
	Err error
}

// MonthChangedMsg is sent when the selected month changes
type MonthChangedMsg struct {
	Month *models.Month
}

// RefreshDataMsg triggers a data refresh
type RefreshDataMsg struct{}

// NewMainModel creates a new main model
func NewMainModel(client *api.Client, user *models.User, cfg *config.Config, width, height int) MainModel {
	return MainModel{
		client:       client,
		user:         user,
		version:      cfg.Version,
		config:       cfg,
		activeTab:    TabSummary,
		width:        width,
		height:       height,
		loading:      true,
		summaryView:  NewSummaryView(client),
		expensesView: NewExpensesView(client),
		incomeView:   NewIncomeView(client),
		settingsView: NewSettingsView(client, user, cfg),
	}
}

func (m MainModel) Init() tea.Cmd {
	return m.loadInitialData
}

func (m MainModel) loadInitialData() tea.Msg {
	months, err := m.client.GetMonths()
	if err != nil {
		return DataLoadErrorMsg{Err: err}
	}

	current, err := m.client.GetCurrentMonth()
	if err != nil {
		// It's okay if there's no current month
		current = nil
	}

	periods, err := m.client.GetPeriods()
	if err != nil {
		return DataLoadErrorMsg{Err: err}
	}

	categories, err := m.client.GetCategories()
	if err != nil {
		return DataLoadErrorMsg{Err: err}
	}

	incomeTypes, err := m.client.GetIncomeTypes()
	if err != nil {
		return DataLoadErrorMsg{Err: err}
	}

	return DataLoadedMsg{
		Months:      months,
		Current:     current,
		Periods:     periods,
		Categories:  categories,
		IncomeTypes: incomeTypes,
	}
}

func (m MainModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case tea.KeyMsg:
		// Global keybindings
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit

		case "L":
			// Logout
			return m, func() tea.Msg { return LogoutMsg{} }

		case "1":
			m.activeTab = TabSummary
			m.message = ""
			return m, m.summaryView.Refresh(m.getSelectedMonthID())

		case "2":
			m.activeTab = TabExpenses
			m.message = ""
			return m, m.expensesView.Refresh(m.getSelectedMonthID(), m.periods, m.categories)

		case "3":
			m.activeTab = TabIncome
			m.message = ""
			return m, m.incomeView.Refresh(m.getSelectedMonthID(), m.periods, m.incomeTypes)

		case "4":
			m.activeTab = TabSettings
			m.message = ""
			return m, m.settingsView.Refresh()

		case "[":
			// Previous month
			m.selectPreviousMonth()
			return m, m.refreshCurrentView()

		case "]":
			// Next month
			m.selectNextMonth()
			return m, m.refreshCurrentView()

		case "?":
			m.showHelp = !m.showHelp
			return m, nil

		case "r":
			// Refresh data
			m.loading = true
			return m, m.loadInitialData
		}

	case DataLoadedMsg:
		m.loading = false
		m.months = msg.Months
		m.currentMonth = msg.Current
		m.periods = msg.Periods
		m.categories = msg.Categories
		m.incomeTypes = msg.IncomeTypes

		// Set selected month to current
		if m.selectedMonth == nil && m.currentMonth != nil {
			m.selectedMonth = m.currentMonth
		} else if m.selectedMonth == nil && len(m.months) > 0 {
			m.selectedMonth = &m.months[0]
		}

		// Update sub-views with data
		m.summaryView.SetMonthID(m.getSelectedMonthID())
		m.expensesView.SetData(m.getSelectedMonthID(), m.periods, m.categories)
		m.incomeView.SetData(m.getSelectedMonthID(), m.periods, m.incomeTypes)
		m.settingsView.SetData(m.categories, m.periods, m.incomeTypes)

		// Load current view data
		return m, m.refreshCurrentView()

	case DataLoadErrorMsg:
		m.loading = false
		m.err = msg.Err
		return m, nil

	case RefreshDataMsg:
		m.loading = true
		return m, m.loadInitialData

	case MonthChangedMsg:
		m.selectedMonth = msg.Month
		return m, m.refreshCurrentView()
	}

	// Route to current view
	var cmd tea.Cmd
	switch m.activeTab {
	case TabSummary:
		m.summaryView, cmd = m.summaryView.Update(msg)
		cmds = append(cmds, cmd)

	case TabExpenses:
		m.expensesView, cmd = m.expensesView.Update(msg)
		cmds = append(cmds, cmd)
		// Check for data changes that require refresh
		if m.expensesView.NeedsRefresh() {
			cmds = append(cmds, func() tea.Msg { return RefreshDataMsg{} })
		}

	case TabIncome:
		m.incomeView, cmd = m.incomeView.Update(msg)
		cmds = append(cmds, cmd)
		if m.incomeView.NeedsRefresh() {
			cmds = append(cmds, func() tea.Msg { return RefreshDataMsg{} })
		}

	case TabSettings:
		m.settingsView, cmd = m.settingsView.Update(msg)
		cmds = append(cmds, cmd)
		if m.settingsView.NeedsRefresh() {
			cmds = append(cmds, func() tea.Msg { return RefreshDataMsg{} })
		}
	}

	return m, tea.Batch(cmds...)
}

func (m *MainModel) getSelectedMonthID() *int {
	if m.selectedMonth != nil {
		return &m.selectedMonth.ID
	}
	return nil
}

func (m *MainModel) selectPreviousMonth() {
	if len(m.months) == 0 || m.selectedMonth == nil {
		return
	}
	for i, month := range m.months {
		if month.ID == m.selectedMonth.ID && i < len(m.months)-1 {
			m.selectedMonth = &m.months[i+1]
			return
		}
	}
}

func (m *MainModel) selectNextMonth() {
	if len(m.months) == 0 || m.selectedMonth == nil {
		return
	}
	for i, month := range m.months {
		if month.ID == m.selectedMonth.ID && i > 0 {
			m.selectedMonth = &m.months[i-1]
			return
		}
	}
}

func (m MainModel) refreshCurrentView() tea.Cmd {
	monthID := m.getSelectedMonthID()
	switch m.activeTab {
	case TabSummary:
		return m.summaryView.Refresh(monthID)
	case TabExpenses:
		return m.expensesView.Refresh(monthID, m.periods, m.categories)
	case TabIncome:
		return m.incomeView.Refresh(monthID, m.periods, m.incomeTypes)
	case TabSettings:
		return m.settingsView.Refresh()
	}
	return nil
}

func (m MainModel) View() string {
	if m.showHelp {
		return m.renderHelp()
	}

	if m.loading {
		return m.renderLoading()
	}

	var b strings.Builder

	// Header
	header := m.renderHeader()
	b.WriteString(header)
	b.WriteString("\n")

	// Tabs
	tabs := m.renderTabs()
	b.WriteString(tabs)
	b.WriteString("\n")

	// Month selector
	monthSelector := m.renderMonthSelector()
	b.WriteString(monthSelector)
	b.WriteString("\n")
	b.WriteString(RenderDivider(m.width - 4))
	b.WriteString("\n")

	// Content area
	contentHeight := m.height - 10 // Account for header, tabs, month selector, help
	content := m.renderContent(contentHeight)
	b.WriteString(content)

	// Footer/Help
	b.WriteString("\n")
	b.WriteString(m.renderFooter())

	return b.String()
}

func (m MainModel) renderLoading() string {
	loading := lipgloss.NewStyle().
		Foreground(ColorPrimary).
		Bold(true).
		Render("Loading...")

	return lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		loading,
	)
}

func (m MainModel) renderHeader() string {
	logo := LogoStyle.Render("💰 Appz Budget")

	// Version badge
	versionBadge := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render("v" + m.version)

	var userInfo string
	if m.user != nil {
		name := m.user.Email
		if m.user.FullName != nil && *m.user.FullName != "" {
			name = *m.user.FullName
		}
		if m.user.IsAdmin {
			userInfo = SubtitleStyle.Render(fmt.Sprintf("👤 %s (admin)", name))
		} else {
			userInfo = SubtitleStyle.Render(fmt.Sprintf("👤 %s", name))
		}
	}

	left := logo + " " + versionBadge
	right := userInfo

	spaces := m.width - lipgloss.Width(left) - lipgloss.Width(right) - 4
	if spaces < 0 {
		spaces = 0
	}

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(left + strings.Repeat(" ", spaces) + right)
}

func (m MainModel) renderTabs() string {
	tabs := []struct {
		name string
		icon string
		tab  MainTab
	}{
		{"Summary", "📊", TabSummary},
		{"Expenses", "💰", TabExpenses},
		{"Income", "💵", TabIncome},
		{"Settings", "⚙️", TabSettings},
	}

	var tabViews []string
	for i, tab := range tabs {
		style := TabStyle
		if m.activeTab == tab.tab {
			style = ActiveTabStyle
		}
		tabViews = append(tabViews, style.Render(fmt.Sprintf("%d %s %s", i+1, tab.icon, tab.name)))
	}

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(lipgloss.JoinHorizontal(lipgloss.Top, tabViews...))
}

func (m MainModel) renderMonthSelector() string {
	var monthName string
	if m.selectedMonth != nil {
		monthName = m.selectedMonth.Name
	} else {
		monthName = "No month selected"
	}

	selector := lipgloss.NewStyle().
		Foreground(ColorPrimary).
		Bold(true).
		Render(fmt.Sprintf("📅  %s", monthName))

	hint := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render("  [ ← previous | next → ]")

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(selector + hint)
}

func (m MainModel) renderContent(height int) string {
	var content string

	switch m.activeTab {
	case TabSummary:
		content = m.summaryView.View(m.width-4, height)
	case TabExpenses:
		content = m.expensesView.View(m.width-4, height)
	case TabIncome:
		content = m.incomeView.View(m.width-4, height)
	case TabSettings:
		content = m.settingsView.View(m.width-4, height)
	}

	return lipgloss.NewStyle().
		Padding(0, 2).
		Height(height).
		Render(content)
}

func (m MainModel) renderFooter() string {
	help := "1-4: tabs | [/]: months | r: refresh | ?: help | L: logout | q: quit"

	if m.err != nil {
		errMsg := ErrorStyle.Render("Error: " + m.err.Error())
		return lipgloss.NewStyle().
			Padding(0, 2).
			Render(errMsg + "  " + HelpStyle.Render(help))
	}

	if m.message != "" {
		msg := MessageStyle.Render(m.message)
		return lipgloss.NewStyle().
			Padding(0, 2).
			Render(msg + "  " + HelpStyle.Render(help))
	}

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(HelpStyle.Render(help))
}

func (m MainModel) renderHelp() string {
	help := `
╭─────────────────────────────────────────────────────────────╮
│                    📖 Keyboard Shortcuts                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NAVIGATION                                                  │
│  ──────────                                                  │
│  1-4          Switch between tabs (Summary/Expenses/etc)     │
│  [ / ]        Previous / Next month                          │
│  Tab          Navigate between fields                        │
│  ↑/↓          Navigate lists                                 │
│  Enter        Select / Confirm                               │
│  Esc          Cancel / Back                                  │
│                                                              │
│  ACTIONS                                                     │
│  ──────────                                                  │
│  n            New item (expense/income/category/etc)         │
│  e            Edit selected item                             │
│  d            Delete selected item                           │
│  c            Clone expenses to next month                   │
│  r            Refresh data                                   │
│                                                              │
│  FILTERS                                                     │
│  ──────────                                                  │
│  p            Filter by period                               │
│  g            Filter by category (expenses only)             │
│                                                              │
│  OTHER                                                       │
│  ──────────                                                  │
│  L            Logout                                         │
│  ?            Toggle this help                               │
│  q / Ctrl+C   Quit                                          │
│                                                              │
╰─────────────────────────────────────────────────────────────╯

                  Press any key to close
`
	helpStyled := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(help)

	return lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		helpStyled,
	)
}

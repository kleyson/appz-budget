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

	// Header with gradient accent
	header := m.renderHeader()
	b.WriteString(header)
	b.WriteString("\n")

	// Navigation tabs
	tabs := m.renderTabs()
	b.WriteString(tabs)
	b.WriteString("\n")

	// Month selector with enhanced styling
	monthSelector := m.renderMonthSelector()
	b.WriteString(monthSelector)
	b.WriteString("\n")

	// Divider with subtle styling
	b.WriteString(lipgloss.NewStyle().Padding(0, 2).Render(RenderDivider(m.width - 4)))
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
	// Spinner animation frames
	spinnerFrames := []string{"◐", "◓", "◑", "◒"}
	spinner := lipgloss.NewStyle().
		Foreground(ColorSecondary).
		Bold(true).
		Render(spinnerFrames[0])

	loadingText := lipgloss.NewStyle().
		Foreground(ColorPrimary).
		Bold(true).
		Render("  Loading...")

	loadingContent := spinner + loadingText

	// Add a subtle box around the loading indicator
	loadingBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(ColorOverlayDim).
		Padding(1, 4).
		Render(loadingContent)

	return lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		loadingBox,
	)
}

func (m MainModel) renderHeader() string {
	// Logo with icon
	logoIcon := lipgloss.NewStyle().Foreground(ColorSecondary).Render("💰")
	logoText := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorPrimary).
		Render(" Appz Budget")
	logo := logoIcon + logoText

	// Version badge with subtle styling
	versionBadge := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Italic(true).
		Render("v" + m.version)

	// User info with icon
	var userInfo string
	if m.user != nil {
		name := m.user.Email
		if m.user.FullName != nil && *m.user.FullName != "" {
			name = *m.user.FullName
		}

		userIcon := lipgloss.NewStyle().Foreground(ColorPrimary).Render("👤")
		userName := lipgloss.NewStyle().Foreground(ColorSubtext).Render(" " + name)

		if m.user.IsAdmin {
			adminBadge := BadgeStyle.Render("admin")
			userInfo = userIcon + userName + " " + adminBadge
		} else {
			userInfo = userIcon + userName
		}
	}

	// Build header layout
	left := logo + "  " + versionBadge
	right := userInfo

	// Calculate spacing
	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	spaces := m.width - leftWidth - rightWidth - 4
	if spaces < 0 {
		spaces = 0
	}

	headerContent := left + strings.Repeat(" ", spaces) + right

	// Add accent line at top
	accentLine := lipgloss.NewStyle().Padding(0, 2).Render(RenderAccentLine(m.width-4, ColorPrimary))

	return lipgloss.JoinVertical(lipgloss.Left,
		accentLine,
		lipgloss.NewStyle().Padding(0, 2).Render(headerContent),
	)
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
		// Tab number indicator
		numStyle := lipgloss.NewStyle().Foreground(ColorMuted)
		if m.activeTab == tab.tab {
			numStyle = lipgloss.NewStyle().Foreground(ColorBase).Bold(true)
		}
		num := numStyle.Render(fmt.Sprintf("%d", i+1))

		// Tab content
		content := fmt.Sprintf(" %s %s %s ", num, tab.icon, tab.name)

		if m.activeTab == tab.tab {
			tabViews = append(tabViews, ActiveTabStyle.Render(content))
		} else {
			tabViews = append(tabViews, TabStyle.Render(content))
		}
	}

	// Join tabs with small gap
	tabsRow := strings.Join(tabViews, " ")

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(tabsRow)
}

func (m MainModel) renderMonthSelector() string {
	var monthName string
	if m.selectedMonth != nil {
		monthName = m.selectedMonth.Name
	} else {
		monthName = "No month selected"
	}

	// Calendar icon
	calIcon := lipgloss.NewStyle().Foreground(ColorSecondary).Render("📅")

	// Month name with highlight
	monthText := lipgloss.NewStyle().
		Foreground(ColorTextBright).
		Bold(true).
		Render("  " + monthName)

	// Navigation hints
	leftArrow := lipgloss.NewStyle().Foreground(ColorPrimary).Bold(true).Render("◀")
	rightArrow := lipgloss.NewStyle().Foreground(ColorPrimary).Bold(true).Render("▶")
	navText := lipgloss.NewStyle().Foreground(ColorMuted).Render(" previous ")
	navText2 := lipgloss.NewStyle().Foreground(ColorMuted).Render(" next ")
	hint := lipgloss.NewStyle().Foreground(ColorMuted).Render("   [ ") +
		leftArrow + navText +
		lipgloss.NewStyle().Foreground(ColorMuted).Render("│") +
		navText2 + rightArrow +
		lipgloss.NewStyle().Foreground(ColorMuted).Render(" ]")

	selector := calIcon + monthText + hint

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(selector)
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
	// Build help hints with refined styling
	helpItems := []string{
		RenderKeyHint("1-4", "tabs"),
		RenderKeyHint("[/]", "months"),
		RenderKeyHint("r", "refresh"),
		RenderKeyHint("?", "help"),
		RenderKeyHint("L", "logout"),
		RenderKeyHint("q", "quit"),
	}
	help := strings.Join(helpItems, "  │  ")

	// Error message
	if m.err != nil {
		errIcon := lipgloss.NewStyle().Foreground(ColorDanger).Render("✗")
		errText := lipgloss.NewStyle().Foreground(ColorDanger).Bold(true).Render(" " + m.err.Error())
		errMsg := errIcon + errText
		return lipgloss.NewStyle().
			Padding(0, 2).
			Render(errMsg + "    " + lipgloss.NewStyle().Foreground(ColorMuted).Render(help))
	}

	// Success message
	if m.message != "" {
		msgIcon := lipgloss.NewStyle().Foreground(ColorSuccess).Render("✓")
		msgText := lipgloss.NewStyle().Foreground(ColorSuccess).Render(" " + m.message)
		msg := msgIcon + msgText
		return lipgloss.NewStyle().
			Padding(0, 2).
			Render(msg + "    " + lipgloss.NewStyle().Foreground(ColorMuted).Render(help))
	}

	return lipgloss.NewStyle().
		Padding(0, 2).
		Render(lipgloss.NewStyle().Foreground(ColorMuted).Render(help))
}

func (m MainModel) renderHelp() string {
	// Help modal with premium styling
	helpContent := `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    📖  Keyboard Shortcuts                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                               ┃
┃  ` + lipgloss.NewStyle().Foreground(ColorPrimary).Bold(true).Render("NAVIGATION") + `                                               ┃
┃  ──────────                                                   ┃
┃  ` + HelpKeyStyle.Render("1-4") + `          Switch between tabs (Summary/Expenses/etc)  ┃
┃  ` + HelpKeyStyle.Render("[ / ]") + `        Previous / Next month                       ┃
┃  ` + HelpKeyStyle.Render("Tab") + `          Navigate between fields                     ┃
┃  ` + HelpKeyStyle.Render("↑/↓") + `          Navigate lists                              ┃
┃  ` + HelpKeyStyle.Render("Enter") + `        Select / Confirm                            ┃
┃  ` + HelpKeyStyle.Render("Esc") + `          Cancel / Back                               ┃
┃                                                               ┃
┃  ` + lipgloss.NewStyle().Foreground(ColorSecondary).Bold(true).Render("ACTIONS") + `                                                  ┃
┃  ──────────                                                   ┃
┃  ` + HelpKeyStyle.Render("n") + `            New item (expense/income/category/etc)      ┃
┃  ` + HelpKeyStyle.Render("e") + `            Edit selected item                          ┃
┃  ` + HelpKeyStyle.Render("d") + `            Delete selected item                        ┃
┃  ` + HelpKeyStyle.Render("c") + `            Clone expenses to next month                ┃
┃  ` + HelpKeyStyle.Render("r") + `            Refresh data                                ┃
┃                                                               ┃
┃  ` + lipgloss.NewStyle().Foreground(ColorInfo).Bold(true).Render("FILTERS") + `                                                  ┃
┃  ──────────                                                   ┃
┃  ` + HelpKeyStyle.Render("p") + `            Filter by period                            ┃
┃  ` + HelpKeyStyle.Render("g") + `            Filter by category (expenses only)          ┃
┃                                                               ┃
┃  ` + lipgloss.NewStyle().Foreground(ColorDanger).Bold(true).Render("OTHER") + `                                                    ┃
┃  ──────────                                                   ┃
┃  ` + HelpKeyStyle.Render("L") + `            Logout                                      ┃
┃  ` + HelpKeyStyle.Render("?") + `            Toggle this help                            ┃
┃  ` + HelpKeyStyle.Render("q / Ctrl+C") + `   Quit                                         ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`

	helpStyled := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(helpContent)

	dismissHint := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Italic(true).
		Render("Press any key to close")

	content := lipgloss.JoinVertical(lipgloss.Center,
		helpStyled,
		"",
		dismissHint,
	)

	return lipgloss.Place(
		m.width,
		m.height,
		lipgloss.Center,
		lipgloss.Center,
		content,
	)
}

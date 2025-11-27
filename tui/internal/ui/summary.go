package ui

import (
	"fmt"
	"strings"

	"github.com/appz/budget-tui/internal/api"
	"github.com/appz/budget-tui/internal/models"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// SummaryView displays the budget summary
type SummaryView struct {
	client  *api.Client
	monthID *int

	totals            *models.SummaryTotals
	categorySummary   []models.CategorySummary
	incomeTypeSummary []models.IncomeTypeSummary

	loading bool
	err     error
}

// SummaryDataMsg is sent when summary data is loaded
type SummaryDataMsg struct {
	Totals      *models.SummaryTotals
	Categories  []models.CategorySummary
	IncomeTypes []models.IncomeTypeSummary
}

// SummaryErrorMsg is sent when loading fails
type SummaryErrorMsg struct {
	Err error
}

// NewSummaryView creates a new summary view
func NewSummaryView(client *api.Client) SummaryView {
	return SummaryView{
		client:  client,
		loading: true,
	}
}

// SetMonthID sets the month ID for the summary
func (s *SummaryView) SetMonthID(monthID *int) {
	s.monthID = monthID
}

// Refresh reloads the summary data
func (s SummaryView) Refresh(monthID *int) tea.Cmd {
	s.monthID = monthID
	return func() tea.Msg {
		totals, err := s.client.GetSummaryTotals(monthID, nil)
		if err != nil {
			return SummaryErrorMsg{Err: err}
		}

		categories, err := s.client.GetCategorySummary(monthID)
		if err != nil {
			return SummaryErrorMsg{Err: err}
		}

		incomeTypes, err := s.client.GetIncomeTypeSummary(monthID, nil)
		if err != nil {
			return SummaryErrorMsg{Err: err}
		}

		return SummaryDataMsg{
			Totals:      totals,
			Categories:  categories,
			IncomeTypes: incomeTypes,
		}
	}
}

func (s SummaryView) Update(msg tea.Msg) (SummaryView, tea.Cmd) {
	switch msg := msg.(type) {
	case SummaryDataMsg:
		s.loading = false
		s.totals = msg.Totals
		s.categorySummary = msg.Categories
		s.incomeTypeSummary = msg.IncomeTypes
		s.err = nil

	case SummaryErrorMsg:
		s.loading = false
		s.err = msg.Err
	}

	return s, nil
}

func (s SummaryView) View(width, height int) string {
	if s.loading {
		spinner := lipgloss.NewStyle().Foreground(ColorSecondary).Render("◐")
		loadingText := lipgloss.NewStyle().Foreground(ColorMuted).Render("  Loading summary...")
		return spinner + loadingText
	}

	if s.err != nil {
		errIcon := lipgloss.NewStyle().Foreground(ColorDanger).Render("✗")
		errText := lipgloss.NewStyle().Foreground(ColorDanger).Bold(true).Render(" " + s.err.Error())
		return errIcon + errText
	}

	if s.totals == nil {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("📊 No data available for this month")
	}

	var b strings.Builder

	// Summary cards with refined design
	b.WriteString(s.renderSummaryCards(width))
	b.WriteString("\n\n")

	// Two-column layout for categories and income types
	leftCol := s.renderCategorySummary((width-4)/2, height-12)
	rightCol := s.renderIncomeTypeSummary((width-4)/2, height-12)

	columns := lipgloss.JoinHorizontal(lipgloss.Top, leftCol, "  ", rightCol)
	b.WriteString(columns)

	return b.String()
}

func (s SummaryView) renderSummaryCards(width int) string {
	cardWidth := (width - 12) / 3
	if cardWidth < 28 {
		cardWidth = 28
	}

	// Income Card with gradient accent
	incomeCard := s.renderCard(
		"Income",
		"💵",
		s.totals.TotalCurrentIncome,
		s.totals.TotalBudgetedIncome,
		cardWidth,
		false,
		ColorSuccess,
	)

	// Expenses Card
	expenseCard := s.renderCard(
		"Expenses",
		"💰",
		s.totals.TotalCurrentExpenses,
		s.totals.TotalBudgetedExpenses,
		cardWidth,
		true,
		ColorDanger,
	)

	// Balance Card
	balanceCard := s.renderBalanceCard(
		"Balance",
		"📊",
		s.totals.TotalCurrent,
		s.totals.TotalBudgeted,
		cardWidth,
	)

	return lipgloss.JoinHorizontal(lipgloss.Top, incomeCard, expenseCard, balanceCard)
}

func (s SummaryView) renderCard(title, icon string, current, budget float64, width int, isExpense bool, accentColor lipgloss.Color) string {
	var status string
	var statusStyle lipgloss.Style
	var statusIcon string

	percentage := 0.0
	if budget > 0 {
		percentage = (current / budget) * 100
	}

	if isExpense {
		if current > budget {
			status = "Over Budget"
			statusStyle = DangerBoldStyle
			statusIcon = "▲"
		} else if current >= budget*0.9 {
			status = "Near Budget"
			statusStyle = WarningBoldStyle
			statusIcon = "●"
		} else {
			status = "On Track"
			statusStyle = SuccessBoldStyle
			statusIcon = "✓"
		}
	} else {
		if current >= budget {
			status = "Goal Met"
			statusStyle = SuccessBoldStyle
			statusIcon = "★"
		} else if current >= budget*0.5 {
			status = "Progressing"
			statusStyle = InfoBoldStyle
			statusIcon = "↗"
		} else {
			status = "In Progress"
			statusStyle = WarningBoldStyle
			statusIcon = "○"
		}
	}

	// Card header with icon
	headerIcon := lipgloss.NewStyle().Foreground(accentColor).Render(icon)
	headerTitle := lipgloss.NewStyle().
		Foreground(ColorText).
		Bold(true).
		Render("  " + title)
	header := headerIcon + headerTitle

	// Current value - large and prominent
	currentStyled := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorTextBright).
		Render(formatCurrency(current))

	// Budget comparison
	budgetStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("of %s budgeted", formatCurrency(budget)))

	// Progress bar
	progressBar := RenderProgressBar(current, budget, width-6)

	// Status and percentage row
	statusStyled := statusStyle.Render(statusIcon + " " + status)
	percentageStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("%.1f%%", percentage))

	statusRow := statusStyled + "  " + percentageStyled

	// Build card content
	content := lipgloss.JoinVertical(lipgloss.Left,
		header,
		"",
		currentStyled,
		budgetStyled,
		"",
		progressBar,
		statusRow,
	)

	// Card with accent line at top
	accentLine := RenderAccentLine(width-4, accentColor)

	cardContent := lipgloss.JoinVertical(lipgloss.Left,
		accentLine,
		content,
	)

	return CardStyle.
		Width(width).
		Render(cardContent)
}

func (s SummaryView) renderBalanceCard(title, icon string, current, budget float64, width int) string {
	var statusStyle lipgloss.Style
	var accentColor lipgloss.Color
	var statusIcon string
	var status string

	if current >= 0 {
		statusStyle = SuccessBoldStyle
		accentColor = ColorSuccess
		if current >= budget {
			status = "Above target"
			statusIcon = "★"
		} else {
			status = "Positive"
			statusIcon = "✓"
		}
	} else {
		statusStyle = DangerBoldStyle
		accentColor = ColorDanger
		status = "In deficit"
		statusIcon = "▼"
	}

	// Card header
	headerIcon := lipgloss.NewStyle().Foreground(accentColor).Render(icon)
	headerTitle := lipgloss.NewStyle().
		Foreground(ColorText).
		Bold(true).
		Render("  " + title)
	header := headerIcon + headerTitle

	// Current value with color based on positive/negative
	valueStyle := statusStyle
	currentStyled := valueStyle.Render(formatCurrency(current))

	// Budget comparison
	budgetStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("Target: %s", formatCurrency(budget)))

	// Difference calculation
	diff := current - budget
	diffPrefix := ""
	if diff >= 0 {
		diffPrefix = "+"
	}
	diffText := fmt.Sprintf("%s%s vs target", diffPrefix, formatCurrency(diff))
	diffStyled := lipgloss.NewStyle().
		Foreground(ColorSubtext).
		Render(diffText)

	// Status
	statusStyled := statusStyle.Render(statusIcon + " " + status)

	// Build content
	content := lipgloss.JoinVertical(lipgloss.Left,
		header,
		"",
		currentStyled,
		budgetStyled,
		diffStyled,
		"",
		statusStyled,
	)

	// Card with accent
	accentLine := RenderAccentLine(width-4, accentColor)

	cardContent := lipgloss.JoinVertical(lipgloss.Left,
		accentLine,
		content,
	)

	return CardStyle.
		Width(width).
		Render(cardContent)
}

func (s SummaryView) renderCategorySummary(width, height int) string {
	// Section header with icon
	headerIcon := lipgloss.NewStyle().Foreground(ColorPrimary).Render("📁")
	headerTitle := lipgloss.NewStyle().
		Foreground(ColorText).
		Bold(true).
		Render("  Expenses by Category")
	title := headerIcon + headerTitle

	if len(s.categorySummary) == 0 {
		emptyMsg := lipgloss.NewStyle().
			Foreground(ColorMuted).
			Italic(true).
			Render("No categories found")
		return lipgloss.JoinVertical(lipgloss.Left,
			title,
			"",
			emptyMsg,
		)
	}

	var rows []string
	for _, cat := range s.categorySummary {
		row := s.renderCategoryRow(cat, width-4)
		rows = append(rows, row)
	}

	content := lipgloss.JoinVertical(lipgloss.Left, rows...)

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		"",
		content,
	)
}

func (s SummaryView) renderCategoryRow(cat models.CategorySummary, width int) string {
	nameWidth := 18
	if width < 50 {
		nameWidth = 14
	}

	// Status dot
	var statusDot string
	if cat.OverBudget {
		statusDot = DangerStyle.Render("●")
	} else if cat.Total >= cat.Budget*0.9 {
		statusDot = WarningStyle.Render("●")
	} else {
		statusDot = SuccessStyle.Render("●")
	}

	// Category name
	name := cat.Category
	if len(name) > nameWidth {
		name = name[:nameWidth-2] + "…"
	}
	nameStyled := lipgloss.NewStyle().
		Width(nameWidth).
		Foreground(ColorText).
		Render(name)

	// Progress bar
	barWidth := width - nameWidth - 32
	if barWidth < 8 {
		barWidth = 8
	}
	bar := RenderSlimProgressBar(cat.Total, cat.Budget, barWidth)

	// Values
	current := formatCurrency(cat.Total)
	budget := formatCurrency(cat.Budget)
	values := lipgloss.NewStyle().
		Foreground(ColorSubtext).
		Render(fmt.Sprintf("%s/%s", current, budget))

	return fmt.Sprintf("%s %s %s %s", statusDot, nameStyled, bar, values)
}

func (s SummaryView) renderIncomeTypeSummary(width, height int) string {
	// Section header
	headerIcon := lipgloss.NewStyle().Foreground(ColorSuccess).Render("💵")
	headerTitle := lipgloss.NewStyle().
		Foreground(ColorText).
		Bold(true).
		Render("  Income by Type")
	title := headerIcon + headerTitle

	if len(s.incomeTypeSummary) == 0 {
		emptyMsg := lipgloss.NewStyle().
			Foreground(ColorMuted).
			Italic(true).
			Render("No income types found")
		return lipgloss.JoinVertical(lipgloss.Left,
			title,
			"",
			emptyMsg,
		)
	}

	var rows []string
	for _, inc := range s.incomeTypeSummary {
		row := s.renderIncomeTypeRow(inc, width-4)
		rows = append(rows, row)
	}

	content := lipgloss.JoinVertical(lipgloss.Left, rows...)

	return lipgloss.JoinVertical(lipgloss.Left,
		title,
		"",
		content,
	)
}

func (s SummaryView) renderIncomeTypeRow(inc models.IncomeTypeSummary, width int) string {
	nameWidth := 18
	if width < 50 {
		nameWidth = 14
	}

	// Status dot
	var statusDot string
	if inc.Total >= inc.Budget {
		statusDot = SuccessStyle.Render("●")
	} else if inc.Total >= inc.Budget*0.5 {
		statusDot = InfoStyle.Render("●")
	} else {
		statusDot = WarningStyle.Render("●")
	}

	// Income type name
	name := inc.IncomeType
	if len(name) > nameWidth {
		name = name[:nameWidth-2] + "…"
	}
	nameStyled := lipgloss.NewStyle().
		Width(nameWidth).
		Foreground(ColorText).
		Render(name)

	// Progress bar
	barWidth := width - nameWidth - 32
	if barWidth < 8 {
		barWidth = 8
	}
	bar := RenderSlimProgressBar(inc.Total, inc.Budget, barWidth)

	// Values
	current := formatCurrency(inc.Total)
	budget := formatCurrency(inc.Budget)
	values := lipgloss.NewStyle().
		Foreground(ColorSubtext).
		Render(fmt.Sprintf("%s/%s", current, budget))

	return fmt.Sprintf("%s %s %s %s", statusDot, nameStyled, bar, values)
}

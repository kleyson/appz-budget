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
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("Loading summary...")
	}

	if s.err != nil {
		return ErrorStyle.Render("Error: " + s.err.Error())
	}

	if s.totals == nil {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("No data available")
	}

	var b strings.Builder

	// Summary cards
	b.WriteString(s.renderSummaryCards(width))
	b.WriteString("\n\n")

	// Two-column layout for categories and income types
	leftCol := s.renderCategorySummary((width-4)/2, height-10)
	rightCol := s.renderIncomeTypeSummary((width-4)/2, height-10)

	columns := lipgloss.JoinHorizontal(lipgloss.Top, leftCol, "  ", rightCol)
	b.WriteString(columns)

	return b.String()
}

func (s SummaryView) renderSummaryCards(width int) string {
	cardWidth := (width - 12) / 3
	if cardWidth < 25 {
		cardWidth = 25
	}

	// Income Card
	incomeCard := s.renderCard(
		"💵  Income",
		s.totals.TotalCurrentIncome,
		s.totals.TotalBudgetedIncome,
		cardWidth,
		false,
	)

	// Expenses Card
	expenseCard := s.renderCard(
		"💰 Expenses",
		s.totals.TotalCurrentExpenses,
		s.totals.TotalBudgetedExpenses,
		cardWidth,
		true,
	)

	// Balance Card
	balanceCard := s.renderBalanceCard(
		"📊 Balance",
		s.totals.TotalCurrent,
		s.totals.TotalBudgeted,
		cardWidth,
	)

	return lipgloss.JoinHorizontal(lipgloss.Top, incomeCard, expenseCard, balanceCard)
}

func (s SummaryView) renderCard(title string, current, budget float64, width int, isExpense bool) string {
	var status string
	var statusStyle lipgloss.Style

	percentage := 0.0
	if budget > 0 {
		percentage = (current / budget) * 100
	}

	if isExpense {
		if current > budget {
			status = "Over Budget!"
			statusStyle = DangerStyle
		} else if current >= budget*0.9 {
			status = "Near Budget"
			statusStyle = WarningStyle
		} else {
			status = "On Track"
			statusStyle = SuccessStyle
		}
	} else {
		if current >= budget {
			status = "Goal Met!"
			statusStyle = SuccessStyle
		} else if current >= budget*0.5 {
			status = "Progressing"
			statusStyle = InfoStyle
		} else {
			status = "In Progress"
			statusStyle = WarningStyle
		}
	}

	titleStyled := CardTitleStyle.Render(title)
	currentStyled := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorText).
		Render(formatCurrency(current))
	budgetStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("/ %s budgeted", formatCurrency(budget)))
	statusStyled := statusStyle.Render(status)
	progressBar := RenderProgressBar(current, budget, width-6)
	percentageStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("%.1f%%", percentage))

	content := lipgloss.JoinVertical(lipgloss.Left,
		titleStyled,
		"",
		currentStyled,
		budgetStyled,
		"",
		progressBar,
		lipgloss.JoinHorizontal(lipgloss.Left, statusStyled, "  ", percentageStyled),
	)

	return CardStyle.
		Width(width).
		Render(content)
}

func (s SummaryView) renderBalanceCard(title string, current, budget float64, width int) string {
	var statusStyle lipgloss.Style
	if current >= 0 {
		statusStyle = SuccessStyle
	} else {
		statusStyle = DangerStyle
	}

	titleStyled := CardTitleStyle.Render(title)
	currentStyled := lipgloss.NewStyle().
		Bold(true).
		Foreground(statusStyle.GetForeground()).
		Render(formatCurrency(current))
	budgetStyled := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("/ %s budgeted", formatCurrency(budget)))

	var status string
	if current >= budget {
		status = "✓ Above target"
	} else if current >= 0 {
		status = "○ Below target"
	} else {
		status = "✗ In deficit"
	}
	statusStyled := statusStyle.Render(status)

	content := lipgloss.JoinVertical(lipgloss.Left,
		titleStyled,
		"",
		currentStyled,
		budgetStyled,
		"",
		statusStyled,
	)

	return CardStyle.
		Width(width).
		Render(content)
}

func (s SummaryView) renderCategorySummary(width, height int) string {
	title := TitleStyle.Render("📁 Expenses by Category")

	if len(s.categorySummary) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No categories"),
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
	nameWidth := 20
	if width < 50 {
		nameWidth = 15
	}

	name := cat.Category
	if len(name) > nameWidth {
		name = name[:nameWidth-3] + "..."
	}
	name = lipgloss.NewStyle().Width(nameWidth).Render(name)

	current := formatCurrency(cat.Total)
	budget := formatCurrency(cat.Budget)

	var status string
	if cat.OverBudget {
		status = DangerStyle.Render("●")
	} else if cat.Total >= cat.Budget*0.9 {
		status = WarningStyle.Render("●")
	} else {
		status = SuccessStyle.Render("●")
	}

	barWidth := width - nameWidth - 30
	if barWidth < 10 {
		barWidth = 10
	}
	bar := RenderProgressBar(cat.Total, cat.Budget, barWidth)

	values := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(fmt.Sprintf("%s / %s", current, budget))

	return fmt.Sprintf("%s %s %s %s", status, name, bar, values)
}

func (s SummaryView) renderIncomeTypeSummary(width, height int) string {
	title := TitleStyle.Render("💵  Income by Type")

	if len(s.incomeTypeSummary) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left,
			title,
			"",
			lipgloss.NewStyle().Foreground(ColorMuted).Render("No income types"),
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
	nameWidth := 20
	if width < 50 {
		nameWidth = 15
	}

	name := inc.IncomeType
	if len(name) > nameWidth {
		name = name[:nameWidth-3] + "..."
	}
	name = lipgloss.NewStyle().Width(nameWidth).Render(name)

	current := formatCurrency(inc.Total)
	budget := formatCurrency(inc.Budget)

	var status string
	if inc.Total >= inc.Budget {
		status = SuccessStyle.Render("●")
	} else if inc.Total >= inc.Budget*0.5 {
		status = InfoStyle.Render("●")
	} else {
		status = WarningStyle.Render("●")
	}

	barWidth := width - nameWidth - 30
	if barWidth < 10 {
		barWidth = 10
	}
	bar := RenderProgressBar(inc.Total, inc.Budget, barWidth)

	values := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(fmt.Sprintf("%s / %s", current, budget))

	return fmt.Sprintf("%s %s %s %s", status, name, bar, values)
}

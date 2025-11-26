package ui

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/appz/budget-tui/internal/api"
	"github.com/appz/budget-tui/internal/models"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// IncomeView displays and manages income entries
type IncomeView struct {
	client      *api.Client
	monthID     *int
	periods     []models.Period
	incomeTypes []models.IncomeType

	incomes      []models.Income
	cursor       int
	scrollOffset int

	// Filtering
	periodFilter string

	// Form state
	showForm       bool
	formMode       string // "create" or "edit"
	formInputs     []textinput.Model
	formFocus      int
	formPeriod     int
	formIncomeType int
	editingID      int

	// Confirmation
	showConfirm   bool
	confirmAction string

	loading      bool
	needsRefresh bool
	err          error
	message      string
}

// IncomeDataMsg is sent when income entries are loaded
type IncomeDataMsg struct {
	Incomes []models.Income
}

// IncomeCreatedMsg is sent when an income is created
type IncomeCreatedMsg struct {
	Income *models.Income
}

// IncomeUpdatedMsg is sent when an income is updated
type IncomeUpdatedMsg struct {
	Income *models.Income
}

// IncomeDeletedMsg is sent when an income is deleted
type IncomeDeletedMsg struct{}

// IncomeErrorMsg is sent when an error occurs
type IncomeErrorMsg struct {
	Err error
}

// NewIncomeView creates a new income view
func NewIncomeView(client *api.Client) IncomeView {
	return IncomeView{
		client:  client,
		loading: true,
	}
}

// SetData sets the view data
func (v *IncomeView) SetData(monthID *int, periods []models.Period, incomeTypes []models.IncomeType) {
	v.monthID = monthID
	v.periods = periods
	v.incomeTypes = incomeTypes
}

// NeedsRefresh returns true if data needs refreshing
func (v *IncomeView) NeedsRefresh() bool {
	result := v.needsRefresh
	v.needsRefresh = false
	return result
}

// Refresh reloads the income entries
func (v IncomeView) Refresh(monthID *int, periods []models.Period, incomeTypes []models.IncomeType) tea.Cmd {
	v.monthID = monthID
	v.periods = periods
	v.incomeTypes = incomeTypes

	return func() tea.Msg {
		var period *string
		if v.periodFilter != "" {
			period = &v.periodFilter
		}

		incomes, err := v.client.GetIncomes(monthID, period)
		if err != nil {
			return IncomeErrorMsg{Err: err}
		}
		return IncomeDataMsg{Incomes: incomes}
	}
}

func (v IncomeView) Update(msg tea.Msg) (IncomeView, tea.Cmd) {
	switch msg := msg.(type) {
	case IncomeDataMsg:
		v.loading = false
		v.incomes = msg.Incomes
		v.err = nil
		if v.cursor >= len(v.incomes) {
			v.cursor = max(0, len(v.incomes)-1)
		}

	case IncomeCreatedMsg:
		v.loading = false
		v.showForm = false
		v.message = "Income created successfully"
		v.needsRefresh = true

	case IncomeUpdatedMsg:
		v.loading = false
		v.showForm = false
		v.message = "Income updated successfully"
		v.needsRefresh = true

	case IncomeDeletedMsg:
		v.loading = false
		v.showConfirm = false
		v.message = "Income deleted successfully"
		v.needsRefresh = true

	case IncomeErrorMsg:
		v.loading = false
		v.err = msg.Err

	case tea.KeyMsg:
		if v.showConfirm {
			return v.handleConfirmKeys(msg)
		}
		if v.showForm {
			return v.handleFormKeys(msg)
		}
		return v.handleListKeys(msg)
	}

	// Update form inputs if showing
	if v.showForm {
		var cmd tea.Cmd
		for i := range v.formInputs {
			v.formInputs[i], cmd = v.formInputs[i].Update(msg)
			if cmd != nil {
				return v, cmd
			}
		}
	}

	return v, nil
}

func (v IncomeView) handleListKeys(msg tea.KeyMsg) (IncomeView, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if v.cursor > 0 {
			v.cursor--
			if v.cursor < v.scrollOffset {
				v.scrollOffset = v.cursor
			}
		}

	case "down", "j":
		if v.cursor < len(v.incomes)-1 {
			v.cursor++
		}

	case "n":
		// New income
		v.showForm = true
		v.formMode = "create"
		v.initForm(nil)

	case "e", "enter":
		// Edit income
		if len(v.incomes) > 0 && v.cursor < len(v.incomes) {
			v.showForm = true
			v.formMode = "edit"
			v.editingID = v.incomes[v.cursor].ID
			v.initForm(&v.incomes[v.cursor])
		}

	case "d":
		// Delete income
		if len(v.incomes) > 0 && v.cursor < len(v.incomes) {
			v.showConfirm = true
			v.confirmAction = "delete"
		}

	case "p":
		// Cycle period filter
		v.cyclePeriodFilter()
		return v, v.Refresh(v.monthID, v.periods, v.incomeTypes)
	}

	return v, nil
}

func (v IncomeView) handleFormKeys(msg tea.KeyMsg) (IncomeView, tea.Cmd) {
	switch msg.String() {
	case "esc":
		v.showForm = false
		return v, nil

	case "tab", "down":
		v.formFocus++
		if v.formFocus > 3 { // 2 fields + 2 selects
			v.formFocus = 0
		}
		v.updateFormFocus()

	case "shift+tab", "up":
		v.formFocus--
		if v.formFocus < 0 {
			v.formFocus = 3
		}
		v.updateFormFocus()

	case "left":
		if v.formFocus == 2 { // Period select
			v.formPeriod--
			if v.formPeriod < 0 {
				v.formPeriod = len(v.periods) - 1
			}
		} else if v.formFocus == 3 { // Income type select
			v.formIncomeType--
			if v.formIncomeType < 0 {
				v.formIncomeType = len(v.incomeTypes) - 1
			}
		}

	case "right":
		if v.formFocus == 2 { // Period select
			v.formPeriod++
			if v.formPeriod >= len(v.periods) {
				v.formPeriod = 0
			}
		} else if v.formFocus == 3 { // Income type select
			v.formIncomeType++
			if v.formIncomeType >= len(v.incomeTypes) {
				v.formIncomeType = 0
			}
		}

	case "enter":
		if v.formFocus < 2 {
			// Move to next field
			v.formFocus++
			v.updateFormFocus()
		} else {
			// Submit form
			return v.submitForm()
		}

	case "ctrl+s":
		// Submit form
		return v.submitForm()
	}

	return v, nil
}

func (v IncomeView) handleConfirmKeys(msg tea.KeyMsg) (IncomeView, tea.Cmd) {
	switch msg.String() {
	case "y", "Y":
		if v.confirmAction == "delete" && len(v.incomes) > 0 {
			incomeID := v.incomes[v.cursor].ID
			v.loading = true
			return v, func() tea.Msg {
				err := v.client.DeleteIncome(incomeID)
				if err != nil {
					return IncomeErrorMsg{Err: err}
				}
				return IncomeDeletedMsg{}
			}
		}

	case "n", "N", "esc":
		v.showConfirm = false
	}

	return v, nil
}

func (v *IncomeView) initForm(income *models.Income) {
	// Create form inputs: budget, amount
	v.formInputs = make([]textinput.Model, 2)

	// Budget
	v.formInputs[0] = textinput.New()
	v.formInputs[0].Placeholder = "0.00"
	v.formInputs[0].CharLimit = 15
	v.formInputs[0].Width = 15
	v.formInputs[0].Focus()

	// Amount
	v.formInputs[1] = textinput.New()
	v.formInputs[1].Placeholder = "0.00"
	v.formInputs[1].CharLimit = 15
	v.formInputs[1].Width = 15

	// Set initial values if editing
	if income != nil {
		v.formInputs[0].SetValue(fmt.Sprintf("%.2f", income.Budget))
		v.formInputs[1].SetValue(fmt.Sprintf("%.2f", income.Amount))

		// Find period index
		for i, p := range v.periods {
			if p.Name == income.Period {
				v.formPeriod = i
				break
			}
		}

		// Find income type index
		for i, t := range v.incomeTypes {
			if t.ID == income.IncomeTypeID {
				v.formIncomeType = i
				break
			}
		}
	} else {
		v.formPeriod = 0
		v.formIncomeType = 0
	}

	v.formFocus = 0
}

func (v *IncomeView) updateFormFocus() {
	for i := range v.formInputs {
		if i == v.formFocus {
			v.formInputs[i].Focus()
		} else {
			v.formInputs[i].Blur()
		}
	}
}

func (v IncomeView) submitForm() (IncomeView, tea.Cmd) {
	budget, err := strconv.ParseFloat(v.formInputs[0].Value(), 64)
	if err != nil {
		budget = 0
	}

	amount, err := strconv.ParseFloat(v.formInputs[1].Value(), 64)
	if err != nil {
		amount = 0
	}

	period := ""
	if len(v.periods) > 0 && v.formPeriod < len(v.periods) {
		period = v.periods[v.formPeriod].Name
	}

	incomeTypeID := 0
	if len(v.incomeTypes) > 0 && v.formIncomeType < len(v.incomeTypes) {
		incomeTypeID = v.incomeTypes[v.formIncomeType].ID
	}

	if incomeTypeID == 0 {
		v.err = fmt.Errorf("please select an income type")
		return v, nil
	}

	monthID := 0
	if v.monthID != nil {
		monthID = *v.monthID
	}

	v.loading = true

	if v.formMode == "create" {
		return v, func() tea.Msg {
			income, err := v.client.CreateIncome(&models.IncomeCreate{
				IncomeTypeID: incomeTypeID,
				Period:       period,
				Budget:       budget,
				Amount:       amount,
				MonthID:      monthID,
			})
			if err != nil {
				return IncomeErrorMsg{Err: err}
			}
			return IncomeCreatedMsg{Income: income}
		}
	}

	// Update
	return v, func() tea.Msg {
		income, err := v.client.UpdateIncome(v.editingID, &models.IncomeUpdate{
			IncomeTypeID: &incomeTypeID,
			Period:       &period,
			Budget:       &budget,
			Amount:       &amount,
		})
		if err != nil {
			return IncomeErrorMsg{Err: err}
		}
		return IncomeUpdatedMsg{Income: income}
	}
}

func (v *IncomeView) cyclePeriodFilter() {
	if v.periodFilter == "" && len(v.periods) > 0 {
		v.periodFilter = v.periods[0].Name
	} else {
		found := false
		for i, p := range v.periods {
			if p.Name == v.periodFilter {
				if i+1 < len(v.periods) {
					v.periodFilter = v.periods[i+1].Name
				} else {
					v.periodFilter = "" // Clear filter
				}
				found = true
				break
			}
		}
		if !found {
			v.periodFilter = ""
		}
	}
}

func (v IncomeView) getIncomeTypeName(id int) string {
	for _, t := range v.incomeTypes {
		if t.ID == id {
			return t.Name
		}
	}
	return "Unknown"
}

func (v IncomeView) View(width, height int) string {
	if v.showConfirm {
		return v.renderConfirmDialog(width, height)
	}

	if v.showForm {
		return v.renderForm(width, height)
	}

	if v.loading {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("Loading income...")
	}

	var b strings.Builder

	// Header with filters
	header := v.renderHeader(width)
	b.WriteString(header)
	b.WriteString("\n\n")

	// Table
	table := v.renderTable(width, height-6)
	b.WriteString(table)

	// Message or error
	if v.message != "" {
		b.WriteString("\n")
		b.WriteString(MessageStyle.Render("✓ " + v.message))
	}
	if v.err != nil {
		b.WriteString("\n")
		b.WriteString(ErrorStyle.Render("✗ " + v.err.Error()))
	}

	// Help
	b.WriteString("\n")
	b.WriteString(HelpStyle.Render("n: new | e/Enter: edit | d: delete | p: filter period"))

	return b.String()
}

func (v IncomeView) renderHeader(width int) string {
	title := TitleStyle.Render("💵  Income")

	// Filters
	var filters []string
	if v.periodFilter != "" {
		filters = append(filters, BadgeStyle.Render("Period: "+v.periodFilter))
	}

	filterStr := ""
	if len(filters) > 0 {
		filterStr = strings.Join(filters, " ")
	}

	// Count
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(v.incomes)))

	return lipgloss.JoinHorizontal(lipgloss.Left, title, " ", count, "  ", filterStr)
}

func (v IncomeView) renderTable(width, height int) string {
	if len(v.incomes) == 0 {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(2, 0).
			Render("No income entries found. Press 'n' to create one.")
	}

	// Calculate column widths
	typeWidth := 25
	periodWidth := 15
	budgetWidth := 15
	amountWidth := 15
	statusWidth := 10

	// Header
	header := fmt.Sprintf(
		"%-*s %-*s %*s %*s %*s",
		typeWidth, "Type",
		periodWidth, "Period",
		budgetWidth, "Budget",
		amountWidth, "Amount",
		statusWidth, "Status",
	)
	headerStyled := TableHeaderStyle.Render(header)

	// Rows
	visibleRows := height - 3
	if visibleRows < 1 {
		visibleRows = 1
	}

	// Adjust scroll offset
	if v.cursor >= v.scrollOffset+visibleRows {
		v.scrollOffset = v.cursor - visibleRows + 1
	}
	if v.cursor < v.scrollOffset {
		v.scrollOffset = v.cursor
	}

	var rows []string
	endIdx := min(v.scrollOffset+visibleRows, len(v.incomes))
	for i := v.scrollOffset; i < endIdx; i++ {
		inc := v.incomes[i]

		typeName := v.getIncomeTypeName(inc.IncomeTypeID)
		if len(typeName) > typeWidth {
			typeName = typeName[:typeWidth-3] + "..."
		}

		period := inc.Period
		if len(period) > periodWidth {
			period = period[:periodWidth-3] + "..."
		}

		budget := formatCurrency(inc.Budget)
		amount := formatCurrency(inc.Amount)

		var status string
		if inc.Amount >= inc.Budget {
			status = SuccessStyle.Render("COMPLETE")
		} else if inc.Amount >= inc.Budget*0.5 {
			status = InfoStyle.Render("PARTIAL")
		} else {
			status = WarningStyle.Render("PENDING")
		}

		row := fmt.Sprintf(
			"%-*s %-*s %*s %*s %*s",
			typeWidth, typeName,
			periodWidth, period,
			budgetWidth, budget,
			amountWidth, amount,
			statusWidth, status,
		)

		if i == v.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	// Scroll indicator
	scrollInfo := ""
	if len(v.incomes) > visibleRows {
		scrollInfo = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render(fmt.Sprintf("  [%d-%d of %d]", v.scrollOffset+1, endIdx, len(v.incomes)))
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		headerStyled+scrollInfo,
		strings.Join(rows, "\n"),
	)
}

func (v IncomeView) renderForm(width, height int) string {
	title := "Create Income"
	if v.formMode == "edit" {
		title = "Edit Income"
	}

	var b strings.Builder

	b.WriteString(ModalTitleStyle.Render(title))
	b.WriteString("\n\n")

	// Income Type selector
	b.WriteString(InputLabelStyle.Render("Income Type"))
	b.WriteString("\n")
	typeSelector := v.renderIncomeTypeSelector(v.formFocus == 3)
	b.WriteString(typeSelector)
	b.WriteString("\n\n")

	// Period selector
	b.WriteString(InputLabelStyle.Render("Period"))
	b.WriteString("\n")
	periodSelector := v.renderPeriodSelector(v.formFocus == 2)
	b.WriteString(periodSelector)
	b.WriteString("\n\n")

	// Budget and Amount side by side
	b.WriteString(InputLabelStyle.Render("Budget"))
	b.WriteString("                    ")
	b.WriteString(InputLabelStyle.Render("Amount"))
	b.WriteString("\n")
	budgetInput := v.formInputs[0].View()
	amountInput := v.formInputs[1].View()
	if v.formFocus == 0 {
		budgetInput = InputFocusedStyle.Width(18).Render(budgetInput)
	} else {
		budgetInput = InputStyle.Width(18).Render(budgetInput)
	}
	if v.formFocus == 1 {
		amountInput = InputFocusedStyle.Width(18).Render(amountInput)
	} else {
		amountInput = InputStyle.Width(18).Render(amountInput)
	}
	b.WriteString(budgetInput + "  " + amountInput)
	b.WriteString("\n\n")

	// Buttons
	saveBtn := ButtonStyle.Render("  Save (Ctrl+S)  ")
	cancelBtn := ButtonStyle.Render("  Cancel (Esc)  ")
	b.WriteString(saveBtn + "  " + cancelBtn)

	// Error
	if v.err != nil {
		b.WriteString("\n\n")
		b.WriteString(ErrorStyle.Render("✗ " + v.err.Error()))
	}

	form := ModalStyle.Render(b.String())

	return lipgloss.Place(
		width,
		height,
		lipgloss.Center,
		lipgloss.Center,
		form,
	)
}

func (v IncomeView) renderPeriodSelector(focused bool) string {
	if len(v.periods) == 0 {
		return lipgloss.NewStyle().Foreground(ColorMuted).Render("No periods available")
	}

	var items []string
	for i, p := range v.periods {
		if i == v.formPeriod {
			if focused {
				items = append(items, BadgeStyle.Render("◀ "+p.Name+" ▶"))
			} else {
				items = append(items, BadgeStyle.Render(p.Name))
			}
		} else {
			items = append(items, lipgloss.NewStyle().Foreground(ColorMuted).Render(p.Name))
		}
	}

	return strings.Join(items, "  ")
}

func (v IncomeView) renderIncomeTypeSelector(focused bool) string {
	if len(v.incomeTypes) == 0 {
		return lipgloss.NewStyle().Foreground(ColorMuted).Render("No income types available")
	}

	var items []string
	for i, t := range v.incomeTypes {
		if i == v.formIncomeType {
			if focused {
				items = append(items, BadgeStyle.Render("◀ "+t.Name+" ▶"))
			} else {
				items = append(items, BadgeStyle.Render(t.Name))
			}
		} else {
			items = append(items, lipgloss.NewStyle().Foreground(ColorMuted).Render(t.Name))
		}
	}

	return strings.Join(items, "  ")
}

func (v IncomeView) renderConfirmDialog(width, height int) string {
	if len(v.incomes) == 0 || v.cursor >= len(v.incomes) {
		return ""
	}

	inc := v.incomes[v.cursor]
	typeName := v.getIncomeTypeName(inc.IncomeTypeID)

	title := ModalTitleStyle.Render("Delete Income")
	message := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(fmt.Sprintf("Are you sure you want to delete income entry for '%s'?", typeName))

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

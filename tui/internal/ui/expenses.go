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

// ExpensesView displays and manages expenses
type ExpensesView struct {
	client     *api.Client
	monthID    *int
	periods    []models.Period
	categories []models.Category

	expenses     []models.Expense
	cursor       int
	scrollOffset int

	// Filtering
	periodFilter   string
	categoryFilter string

	// Form state
	showForm     bool
	formMode     string // "create" or "edit"
	formInputs   []textinput.Model
	formFocus    int
	formPeriod   int
	formCategory int
	editingID    int

	// Confirmation
	showConfirm   bool
	confirmAction string

	loading      bool
	needsRefresh bool
	err          error
	message      string
}

// ExpensesDataMsg is sent when expenses are loaded
type ExpensesDataMsg struct {
	Expenses []models.Expense
}

// ExpenseCreatedMsg is sent when an expense is created
type ExpenseCreatedMsg struct {
	Expense *models.Expense
}

// ExpenseUpdatedMsg is sent when an expense is updated
type ExpenseUpdatedMsg struct {
	Expense *models.Expense
}

// ExpenseDeletedMsg is sent when an expense is deleted
type ExpenseDeletedMsg struct{}

// ExpenseErrorMsg is sent when an error occurs
type ExpenseErrorMsg struct {
	Err error
}

// NewExpensesView creates a new expenses view
func NewExpensesView(client *api.Client) ExpensesView {
	return ExpensesView{
		client:  client,
		loading: true,
	}
}

// SetData sets the view data
func (e *ExpensesView) SetData(monthID *int, periods []models.Period, categories []models.Category) {
	e.monthID = monthID
	e.periods = periods
	e.categories = categories
}

// NeedsRefresh returns true if data needs refreshing
func (e *ExpensesView) NeedsRefresh() bool {
	result := e.needsRefresh
	e.needsRefresh = false
	return result
}

// Refresh reloads the expenses
func (e ExpensesView) Refresh(monthID *int, periods []models.Period, categories []models.Category) tea.Cmd {
	e.monthID = monthID
	e.periods = periods
	e.categories = categories

	return func() tea.Msg {
		var period, category *string
		if e.periodFilter != "" {
			period = &e.periodFilter
		}
		if e.categoryFilter != "" {
			category = &e.categoryFilter
		}

		expenses, err := e.client.GetExpenses(monthID, period, category)
		if err != nil {
			return ExpenseErrorMsg{Err: err}
		}
		return ExpensesDataMsg{Expenses: expenses}
	}
}

func (e ExpensesView) Update(msg tea.Msg) (ExpensesView, tea.Cmd) {
	switch msg := msg.(type) {
	case ExpensesDataMsg:
		e.loading = false
		e.expenses = msg.Expenses
		e.err = nil
		if e.cursor >= len(e.expenses) {
			e.cursor = max(0, len(e.expenses)-1)
		}

	case ExpenseCreatedMsg:
		e.loading = false
		e.showForm = false
		e.message = "Expense created successfully"
		e.needsRefresh = true

	case ExpenseUpdatedMsg:
		e.loading = false
		e.showForm = false
		e.message = "Expense updated successfully"
		e.needsRefresh = true

	case ExpenseDeletedMsg:
		e.loading = false
		e.showConfirm = false
		e.message = "Expense deleted successfully"
		e.needsRefresh = true

	case ExpenseErrorMsg:
		e.loading = false
		e.err = msg.Err

	case tea.KeyMsg:
		if e.showConfirm {
			return e.handleConfirmKeys(msg)
		}
		if e.showForm {
			return e.handleFormKeys(msg)
		}
		return e.handleListKeys(msg)
	}

	// Update form inputs if showing
	if e.showForm {
		var cmd tea.Cmd
		for i := range e.formInputs {
			e.formInputs[i], cmd = e.formInputs[i].Update(msg)
			if cmd != nil {
				return e, cmd
			}
		}
	}

	return e, nil
}

func (e ExpensesView) handleListKeys(msg tea.KeyMsg) (ExpensesView, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if e.cursor > 0 {
			e.cursor--
			if e.cursor < e.scrollOffset {
				e.scrollOffset = e.cursor
			}
		}

	case "down", "j":
		if e.cursor < len(e.expenses)-1 {
			e.cursor++
		}

	case "n":
		// New expense
		e.showForm = true
		e.formMode = "create"
		e.initForm(nil)

	case "e", "enter":
		// Edit expense
		if len(e.expenses) > 0 && e.cursor < len(e.expenses) {
			e.showForm = true
			e.formMode = "edit"
			e.editingID = e.expenses[e.cursor].ID
			e.initForm(&e.expenses[e.cursor])
		}

	case "d":
		// Delete expense
		if len(e.expenses) > 0 && e.cursor < len(e.expenses) {
			e.showConfirm = true
			e.confirmAction = "delete"
		}

	case "p":
		// Cycle period filter
		e.cyclePeriodFilter()
		return e, e.Refresh(e.monthID, e.periods, e.categories)

	case "g":
		// Cycle category filter
		e.cycleCategoryFilter()
		return e, e.Refresh(e.monthID, e.periods, e.categories)
	}

	return e, nil
}

func (e ExpensesView) handleFormKeys(msg tea.KeyMsg) (ExpensesView, tea.Cmd) {
	switch msg.String() {
	case "esc":
		e.showForm = false
		return e, nil

	case "tab", "down":
		e.formFocus++
		if e.formFocus > 5 { // 5 fields + 2 selects
			e.formFocus = 0
		}
		e.updateFormFocus()

	case "shift+tab", "up":
		e.formFocus--
		if e.formFocus < 0 {
			e.formFocus = 5
		}
		e.updateFormFocus()

	case "left":
		if e.formFocus == 4 { // Period select
			e.formPeriod--
			if e.formPeriod < 0 {
				e.formPeriod = len(e.periods) - 1
			}
		} else if e.formFocus == 5 { // Category select
			e.formCategory--
			if e.formCategory < 0 {
				e.formCategory = len(e.categories) - 1
			}
		}

	case "right":
		if e.formFocus == 4 { // Period select
			e.formPeriod++
			if e.formPeriod >= len(e.periods) {
				e.formPeriod = 0
			}
		} else if e.formFocus == 5 { // Category select
			e.formCategory++
			if e.formCategory >= len(e.categories) {
				e.formCategory = 0
			}
		}

	case "enter":
		if e.formFocus < 4 {
			// Move to next field
			e.formFocus++
			e.updateFormFocus()
		} else {
			// Submit form
			return e.submitForm()
		}

	case "ctrl+s":
		// Submit form
		return e.submitForm()
	}

	return e, nil
}

func (e ExpensesView) handleConfirmKeys(msg tea.KeyMsg) (ExpensesView, tea.Cmd) {
	switch msg.String() {
	case "y", "Y":
		if e.confirmAction == "delete" && len(e.expenses) > 0 {
			expenseID := e.expenses[e.cursor].ID
			e.loading = true
			return e, func() tea.Msg {
				err := e.client.DeleteExpense(expenseID)
				if err != nil {
					return ExpenseErrorMsg{Err: err}
				}
				return ExpenseDeletedMsg{}
			}
		}

	case "n", "N", "esc":
		e.showConfirm = false
	}

	return e, nil
}

func (e *ExpensesView) initForm(expense *models.Expense) {
	// Create form inputs: name, budget, cost, notes
	e.formInputs = make([]textinput.Model, 4)

	// Name
	e.formInputs[0] = textinput.New()
	e.formInputs[0].Placeholder = "Expense name"
	e.formInputs[0].CharLimit = 100
	e.formInputs[0].Width = 30
	e.formInputs[0].Focus()

	// Budget
	e.formInputs[1] = textinput.New()
	e.formInputs[1].Placeholder = "0.00"
	e.formInputs[1].CharLimit = 15
	e.formInputs[1].Width = 15

	// Cost
	e.formInputs[2] = textinput.New()
	e.formInputs[2].Placeholder = "0.00"
	e.formInputs[2].CharLimit = 15
	e.formInputs[2].Width = 15

	// Notes
	e.formInputs[3] = textinput.New()
	e.formInputs[3].Placeholder = "Notes (optional)"
	e.formInputs[3].CharLimit = 200
	e.formInputs[3].Width = 30

	// Set initial values if editing
	if expense != nil {
		e.formInputs[0].SetValue(expense.ExpenseName)
		e.formInputs[1].SetValue(fmt.Sprintf("%.2f", expense.Budget))
		e.formInputs[2].SetValue(fmt.Sprintf("%.2f", expense.Cost))
		if expense.Notes != nil {
			e.formInputs[3].SetValue(*expense.Notes)
		}

		// Find period index
		for i, p := range e.periods {
			if p.Name == expense.Period {
				e.formPeriod = i
				break
			}
		}

		// Find category index
		for i, c := range e.categories {
			if c.Name == expense.Category {
				e.formCategory = i
				break
			}
		}
	} else {
		e.formPeriod = 0
		e.formCategory = 0
	}

	e.formFocus = 0
}

func (e *ExpensesView) updateFormFocus() {
	for i := range e.formInputs {
		if i == e.formFocus {
			e.formInputs[i].Focus()
		} else {
			e.formInputs[i].Blur()
		}
	}
}

func (e ExpensesView) submitForm() (ExpensesView, tea.Cmd) {
	name := strings.TrimSpace(e.formInputs[0].Value())
	if name == "" {
		e.err = fmt.Errorf("expense name is required")
		return e, nil
	}

	budget, err := strconv.ParseFloat(e.formInputs[1].Value(), 64)
	if err != nil {
		budget = 0
	}

	cost, err := strconv.ParseFloat(e.formInputs[2].Value(), 64)
	if err != nil {
		cost = 0
	}

	notes := strings.TrimSpace(e.formInputs[3].Value())
	var notesPtr *string
	if notes != "" {
		notesPtr = &notes
	}

	period := ""
	if len(e.periods) > 0 && e.formPeriod < len(e.periods) {
		period = e.periods[e.formPeriod].Name
	}

	category := ""
	if len(e.categories) > 0 && e.formCategory < len(e.categories) {
		category = e.categories[e.formCategory].Name
	}

	monthID := 0
	if e.monthID != nil {
		monthID = *e.monthID
	}

	e.loading = true

	if e.formMode == "create" {
		return e, func() tea.Msg {
			expense, err := e.client.CreateExpense(&models.ExpenseCreate{
				ExpenseName: name,
				Period:      period,
				Category:    category,
				Budget:      budget,
				Cost:        cost,
				Notes:       notesPtr,
				MonthID:     monthID,
			})
			if err != nil {
				return ExpenseErrorMsg{Err: err}
			}
			return ExpenseCreatedMsg{Expense: expense}
		}
	}

	// Update
	return e, func() tea.Msg {
		expense, err := e.client.UpdateExpense(e.editingID, &models.ExpenseUpdate{
			ExpenseName: &name,
			Period:      &period,
			Category:    &category,
			Budget:      &budget,
			Cost:        &cost,
			Notes:       notesPtr,
		})
		if err != nil {
			return ExpenseErrorMsg{Err: err}
		}
		return ExpenseUpdatedMsg{Expense: expense}
	}
}

func (e *ExpensesView) cyclePeriodFilter() {
	if e.periodFilter == "" && len(e.periods) > 0 {
		e.periodFilter = e.periods[0].Name
	} else {
		found := false
		for i, p := range e.periods {
			if p.Name == e.periodFilter {
				if i+1 < len(e.periods) {
					e.periodFilter = e.periods[i+1].Name
				} else {
					e.periodFilter = "" // Clear filter
				}
				found = true
				break
			}
		}
		if !found {
			e.periodFilter = ""
		}
	}
}

func (e *ExpensesView) cycleCategoryFilter() {
	if e.categoryFilter == "" && len(e.categories) > 0 {
		e.categoryFilter = e.categories[0].Name
	} else {
		found := false
		for i, c := range e.categories {
			if c.Name == e.categoryFilter {
				if i+1 < len(e.categories) {
					e.categoryFilter = e.categories[i+1].Name
				} else {
					e.categoryFilter = "" // Clear filter
				}
				found = true
				break
			}
		}
		if !found {
			e.categoryFilter = ""
		}
	}
}

func (e ExpensesView) View(width, height int) string {
	if e.showConfirm {
		return e.renderConfirmDialog(width, height)
	}

	if e.showForm {
		return e.renderForm(width, height)
	}

	if e.loading {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("Loading expenses...")
	}

	var b strings.Builder

	// Header with filters
	header := e.renderHeader(width)
	b.WriteString(header)
	b.WriteString("\n\n")

	// Table
	table := e.renderTable(width, height-6)
	b.WriteString(table)

	// Message or error
	if e.message != "" {
		b.WriteString("\n")
		b.WriteString(MessageStyle.Render("✓ " + e.message))
	}
	if e.err != nil {
		b.WriteString("\n")
		b.WriteString(ErrorStyle.Render("✗ " + e.err.Error()))
	}

	// Help
	b.WriteString("\n")
	b.WriteString(HelpStyle.Render("n: new | e/Enter: edit | d: delete | p: filter period | g: filter category"))

	return b.String()
}

func (e ExpensesView) renderHeader(width int) string {
	title := TitleStyle.Render("💰 Expenses")

	// Filters
	var filters []string
	if e.periodFilter != "" {
		filters = append(filters, BadgeStyle.Render("Period: "+e.periodFilter))
	}
	if e.categoryFilter != "" {
		filters = append(filters, BadgeStyle.Render("Category: "+e.categoryFilter))
	}

	filterStr := ""
	if len(filters) > 0 {
		filterStr = strings.Join(filters, " ")
	}

	// Count
	count := lipgloss.NewStyle().
		Foreground(ColorMuted).
		Render(fmt.Sprintf("(%d items)", len(e.expenses)))

	return lipgloss.JoinHorizontal(lipgloss.Left, title, " ", count, "  ", filterStr)
}

func (e ExpensesView) renderTable(width, height int) string {
	if len(e.expenses) == 0 {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(2, 0).
			Render("No expenses found. Press 'n' to create one.")
	}

	// Calculate column widths
	nameWidth := 25
	periodWidth := 12
	categoryWidth := 15
	budgetWidth := 12
	costWidth := 12
	statusWidth := 8

	// Header
	header := fmt.Sprintf(
		"%-*s %-*s %-*s %*s %*s %*s",
		nameWidth, "Name",
		periodWidth, "Period",
		categoryWidth, "Category",
		budgetWidth, "Budget",
		costWidth, "Cost",
		statusWidth, "Status",
	)
	headerStyled := TableHeaderStyle.Render(header)

	// Rows
	visibleRows := height - 3
	if visibleRows < 1 {
		visibleRows = 1
	}

	// Adjust scroll offset
	if e.cursor >= e.scrollOffset+visibleRows {
		e.scrollOffset = e.cursor - visibleRows + 1
	}
	if e.cursor < e.scrollOffset {
		e.scrollOffset = e.cursor
	}

	var rows []string
	endIdx := min(e.scrollOffset+visibleRows, len(e.expenses))
	for i := e.scrollOffset; i < endIdx; i++ {
		exp := e.expenses[i]

		name := exp.ExpenseName
		if len(name) > nameWidth {
			name = name[:nameWidth-3] + "..."
		}

		period := exp.Period
		if len(period) > periodWidth {
			period = period[:periodWidth-3] + "..."
		}

		category := exp.Category
		if len(category) > categoryWidth {
			category = category[:categoryWidth-3] + "..."
		}

		budget := formatCurrency(exp.Budget)
		cost := formatCurrency(exp.Cost)

		var status string
		if exp.Cost > exp.Budget {
			status = DangerStyle.Render("OVER")
		} else if exp.Cost >= exp.Budget*0.9 {
			status = WarningStyle.Render("NEAR")
		} else {
			status = SuccessStyle.Render("OK")
		}

		row := fmt.Sprintf(
			"%-*s %-*s %-*s %*s %*s %*s",
			nameWidth, name,
			periodWidth, period,
			categoryWidth, category,
			budgetWidth, budget,
			costWidth, cost,
			statusWidth, status,
		)

		if i == e.cursor {
			rows = append(rows, TableRowSelectedStyle.Render(row))
		} else {
			rows = append(rows, TableRowStyle.Render(row))
		}
	}

	// Scroll indicator
	scrollInfo := ""
	if len(e.expenses) > visibleRows {
		scrollInfo = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render(fmt.Sprintf("  [%d-%d of %d]", e.scrollOffset+1, endIdx, len(e.expenses)))
	}

	return lipgloss.JoinVertical(lipgloss.Left,
		headerStyled+scrollInfo,
		strings.Join(rows, "\n"),
	)
}

func (e ExpensesView) renderForm(width, height int) string {
	title := "Create Expense"
	if e.formMode == "edit" {
		title = "Edit Expense"
	}

	var b strings.Builder

	b.WriteString(ModalTitleStyle.Render(title))
	b.WriteString("\n\n")

	// Name field
	b.WriteString(InputLabelStyle.Render("Name"))
	b.WriteString("\n")
	if e.formFocus == 0 {
		b.WriteString(InputFocusedStyle.Render(e.formInputs[0].View()))
	} else {
		b.WriteString(InputStyle.Render(e.formInputs[0].View()))
	}
	b.WriteString("\n\n")

	// Budget and Cost side by side
	b.WriteString(InputLabelStyle.Render("Budget"))
	b.WriteString("                    ")
	b.WriteString(InputLabelStyle.Render("Cost"))
	b.WriteString("\n")
	budgetInput := e.formInputs[1].View()
	costInput := e.formInputs[2].View()
	if e.formFocus == 1 {
		budgetInput = InputFocusedStyle.Width(18).Render(budgetInput)
	} else {
		budgetInput = InputStyle.Width(18).Render(budgetInput)
	}
	if e.formFocus == 2 {
		costInput = InputFocusedStyle.Width(18).Render(costInput)
	} else {
		costInput = InputStyle.Width(18).Render(costInput)
	}
	b.WriteString(budgetInput + "  " + costInput)
	b.WriteString("\n\n")

	// Notes
	b.WriteString(InputLabelStyle.Render("Notes"))
	b.WriteString("\n")
	if e.formFocus == 3 {
		b.WriteString(InputFocusedStyle.Render(e.formInputs[3].View()))
	} else {
		b.WriteString(InputStyle.Render(e.formInputs[3].View()))
	}
	b.WriteString("\n\n")

	// Period selector
	b.WriteString(InputLabelStyle.Render("Period"))
	b.WriteString("\n")
	periodSelector := e.renderSelector(e.periods, e.formPeriod, e.formFocus == 4, func(p models.Period) string { return p.Name })
	b.WriteString(periodSelector)
	b.WriteString("\n\n")

	// Category selector
	b.WriteString(InputLabelStyle.Render("Category"))
	b.WriteString("\n")
	categorySelector := e.renderCategorySelector(e.formFocus == 5)
	b.WriteString(categorySelector)
	b.WriteString("\n\n")

	// Buttons
	saveBtn := ButtonStyle.Render("  Save (Ctrl+S)  ")
	cancelBtn := ButtonStyle.Render("  Cancel (Esc)  ")
	b.WriteString(saveBtn + "  " + cancelBtn)

	// Error
	if e.err != nil {
		b.WriteString("\n\n")
		b.WriteString(ErrorStyle.Render("✗ " + e.err.Error()))
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

func (e ExpensesView) renderSelector(periods []models.Period, selected int, focused bool, getName func(models.Period) string) string {
	if len(periods) == 0 {
		return lipgloss.NewStyle().Foreground(ColorMuted).Render("No periods available")
	}

	var items []string
	for i, p := range periods {
		name := getName(p)
		if i == selected {
			if focused {
				items = append(items, BadgeStyle.Render("◀ "+name+" ▶"))
			} else {
				items = append(items, BadgeStyle.Render(name))
			}
		} else {
			items = append(items, lipgloss.NewStyle().Foreground(ColorMuted).Render(name))
		}
	}

	return strings.Join(items, "  ")
}

func (e ExpensesView) renderCategorySelector(focused bool) string {
	if len(e.categories) == 0 {
		return lipgloss.NewStyle().Foreground(ColorMuted).Render("No categories available")
	}

	var items []string
	for i, c := range e.categories {
		if i == e.formCategory {
			if focused {
				items = append(items, BadgeStyle.Render("◀ "+c.Name+" ▶"))
			} else {
				items = append(items, BadgeStyle.Render(c.Name))
			}
		} else {
			items = append(items, lipgloss.NewStyle().Foreground(ColorMuted).Render(c.Name))
		}
	}

	return strings.Join(items, "  ")
}

func (e ExpensesView) renderConfirmDialog(width, height int) string {
	if len(e.expenses) == 0 || e.cursor >= len(e.expenses) {
		return ""
	}

	exp := e.expenses[e.cursor]

	title := ModalTitleStyle.Render("Delete Expense")
	message := lipgloss.NewStyle().
		Foreground(ColorText).
		Render(fmt.Sprintf("Are you sure you want to delete '%s'?", exp.ExpenseName))

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

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

package models

import "time"

// Purchase represents a purchase within an expense
type Purchase struct {
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
}

// Expense represents an expense entry
type Expense struct {
	ID          int        `json:"id"`
	ExpenseName string     `json:"expense_name"`
	Period      string     `json:"period"`
	Category    string     `json:"category"`
	Budget      float64    `json:"budget"`
	Cost        float64    `json:"cost"`
	Notes       *string    `json:"notes,omitempty"`
	MonthID     int        `json:"month_id"`
	Purchases   []Purchase `json:"purchases,omitempty"`
}

// ExpenseCreate represents data to create an expense
type ExpenseCreate struct {
	ExpenseName string     `json:"expense_name"`
	Period      string     `json:"period"`
	Category    string     `json:"category"`
	Budget      float64    `json:"budget"`
	Cost        float64    `json:"cost"`
	Notes       *string    `json:"notes,omitempty"`
	MonthID     int        `json:"month_id"`
	Purchases   []Purchase `json:"purchases,omitempty"`
}

// ExpenseUpdate represents data to update an expense
type ExpenseUpdate struct {
	ExpenseName *string    `json:"expense_name,omitempty"`
	Period      *string    `json:"period,omitempty"`
	Category    *string    `json:"category,omitempty"`
	Budget      *float64   `json:"budget,omitempty"`
	Cost        *float64   `json:"cost,omitempty"`
	Notes       *string    `json:"notes,omitempty"`
	MonthID     *int       `json:"month_id,omitempty"`
	Purchases   []Purchase `json:"purchases,omitempty"`
}

// Category represents an expense category
type Category struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// CategoryCreate represents data to create a category
type CategoryCreate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// CategoryUpdate represents data to update a category
type CategoryUpdate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// CategorySummary represents category summary for budgets
type CategorySummary struct {
	Category   string  `json:"category"`
	Budget     float64 `json:"budget"`
	Total      float64 `json:"total"`
	OverBudget bool    `json:"over_budget"`
}

// Period represents a payment period
type Period struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// PeriodCreate represents data to create a period
type PeriodCreate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// PeriodUpdate represents data to update a period
type PeriodUpdate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// Month represents a budget month
type Month struct {
	ID        int    `json:"id"`
	Year      int    `json:"year"`
	Month     int    `json:"month"`
	Name      string `json:"name"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

// MonthCreate represents data to create a month
type MonthCreate struct {
	Year  int `json:"year"`
	Month int `json:"month"`
}

// IncomeType represents an income type
type IncomeType struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// IncomeTypeCreate represents data to create an income type
type IncomeTypeCreate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// IncomeTypeUpdate represents data to update an income type
type IncomeTypeUpdate struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// IncomeTypeSummary represents income type summary
type IncomeTypeSummary struct {
	IncomeType string  `json:"income_type"`
	Budget     float64 `json:"budget"`
	Total      float64 `json:"total"`
}

// Income represents an income entry
type Income struct {
	ID           int       `json:"id"`
	IncomeTypeID int       `json:"income_type_id"`
	Period       string    `json:"period"`
	Budget       float64   `json:"budget"`
	Amount       float64   `json:"amount"`
	MonthID      int       `json:"month_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedBy    *string   `json:"created_by,omitempty"`
	UpdatedBy    *string   `json:"updated_by,omitempty"`
}

// IncomeCreate represents data to create income
type IncomeCreate struct {
	IncomeTypeID int     `json:"income_type_id"`
	Period       string  `json:"period"`
	Budget       float64 `json:"budget"`
	Amount       float64 `json:"amount"`
	MonthID      int     `json:"month_id"`
}

// IncomeUpdate represents data to update income
type IncomeUpdate struct {
	IncomeTypeID *int     `json:"income_type_id,omitempty"`
	Period       *string  `json:"period,omitempty"`
	Budget       *float64 `json:"budget,omitempty"`
	Amount       *float64 `json:"amount,omitempty"`
	MonthID      *int     `json:"month_id,omitempty"`
}

// SummaryTotals represents budget summary totals
type SummaryTotals struct {
	TotalBudgetedExpenses float64 `json:"total_budgeted_expenses"`
	TotalCurrentExpenses  float64 `json:"total_current_expenses"`
	TotalBudgetedIncome   float64 `json:"total_budgeted_income"`
	TotalCurrentIncome    float64 `json:"total_current_income"`
	TotalBudgeted         float64 `json:"total_budgeted"`
	TotalCurrent          float64 `json:"total_current"`
}

// User represents a user account
type User struct {
	ID       int     `json:"id"`
	Email    string  `json:"email"`
	FullName *string `json:"full_name,omitempty"`
	IsActive bool    `json:"is_active"`
	IsAdmin  bool    `json:"is_admin"`
}

// UserLogin represents login credentials
type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TokenResponse represents the login response
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	UserID      int    `json:"user_id"`
	Email       string `json:"email"`
}

// ChangePasswordRequest represents password change request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// CloneResponse represents the response from cloning expenses
type CloneResponse struct {
	Message           string `json:"message"`
	ClonedCount       int    `json:"cloned_count"`
	ClonedIncomeCount int    `json:"cloned_income_count"`
	NextMonthID       int    `json:"next_month_id"`
	NextMonthName     string `json:"next_month_name"`
}

package models

import (
	"testing"
)

func TestExpenseModel(t *testing.T) {
	expense := Expense{
		ID:          1,
		ExpenseName: "Test Expense",
		Budget:      100.50,
		Cost:        75.25,
		Category:    "Food",
		Period:      "2024-01",
		MonthID:     1,
	}

	if expense.ID != 1 {
		t.Errorf("Expense.ID = %v, want 1", expense.ID)
	}

	if expense.ExpenseName != "Test Expense" {
		t.Errorf("Expense.ExpenseName = %v, want 'Test Expense'", expense.ExpenseName)
	}

	if expense.Budget != 100.50 {
		t.Errorf("Expense.Budget = %v, want 100.50", expense.Budget)
	}

	if expense.Cost != 75.25 {
		t.Errorf("Expense.Cost = %v, want 75.25", expense.Cost)
	}

	if expense.Category != "Food" {
		t.Errorf("Expense.Category = %v, want 'Food'", expense.Category)
	}

	if expense.Period != "2024-01" {
		t.Errorf("Expense.Period = %v, want '2024-01'", expense.Period)
	}
}

func TestCategoryModel(t *testing.T) {
	category := Category{
		ID:    1,
		Name:  "Food",
		Color: "#3b82f6",
	}

	if category.ID != 1 {
		t.Errorf("Category.ID = %v, want 1", category.ID)
	}

	if category.Name != "Food" {
		t.Errorf("Category.Name = %v, want 'Food'", category.Name)
	}

	if category.Color != "#3b82f6" {
		t.Errorf("Category.Color = %v, want '#3b82f6'", category.Color)
	}
}

func TestUserModel(t *testing.T) {
	fullName := "John Doe"
	user := User{
		ID:       1,
		Email:    "test@example.com",
		FullName: &fullName,
		IsActive: true,
		IsAdmin:  false,
	}

	if user.ID != 1 {
		t.Errorf("User.ID = %v, want 1", user.ID)
	}

	if user.Email != "test@example.com" {
		t.Errorf("User.Email = %v, want 'test@example.com'", user.Email)
	}

	if user.FullName == nil || *user.FullName != "John Doe" {
		t.Errorf("User.FullName = %v, want 'John Doe'", user.FullName)
	}

	if !user.IsActive {
		t.Error("User.IsActive = false, want true")
	}

	if user.IsAdmin {
		t.Error("User.IsAdmin = true, want false")
	}
}

func TestMonthModel(t *testing.T) {
	month := Month{
		ID:   1,
		Name: "January 2024",
	}

	if month.ID != 1 {
		t.Errorf("Month.ID = %v, want 1", month.ID)
	}

	if month.Name != "January 2024" {
		t.Errorf("Month.Name = %v, want 'January 2024'", month.Name)
	}
}

func TestCategoryCreate(t *testing.T) {
	create := CategoryCreate{
		Name:  "Test Category",
		Color: "#ff0000",
	}

	if create.Name != "Test Category" {
		t.Errorf("CategoryCreate.Name = %v, want 'Test Category'", create.Name)
	}

	if create.Color != "#ff0000" {
		t.Errorf("CategoryCreate.Color = %v, want '#ff0000'", create.Color)
	}
}

func TestExpenseCreate(t *testing.T) {
	create := ExpenseCreate{
		ExpenseName: "Test Expense",
		Budget:      100.0,
		Cost:        50.0,
		Category:    "Food",
		Period:      "2024-01",
		MonthID:     1,
	}

	if create.ExpenseName != "Test Expense" {
		t.Errorf("ExpenseCreate.ExpenseName = %v, want 'Test Expense'", create.ExpenseName)
	}

	if create.Budget != 100.0 {
		t.Errorf("ExpenseCreate.Budget = %v, want 100.0", create.Budget)
	}

	if create.Cost != 50.0 {
		t.Errorf("ExpenseCreate.Cost = %v, want 50.0", create.Cost)
	}

	if create.Category != "Food" {
		t.Errorf("ExpenseCreate.Category = %v, want 'Food'", create.Category)
	}

	if create.Period != "2024-01" {
		t.Errorf("ExpenseCreate.Period = %v, want '2024-01'", create.Period)
	}
}

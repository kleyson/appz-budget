use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryTotals {
    pub total_budgeted_expenses: f64,
    pub total_current_expenses: f64,
    pub total_budgeted_income: f64,
    pub total_current_income: f64,
    pub total_budgeted: f64,
    pub total_current: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySummary {
    pub category: String,
    pub budget: f64,
    pub total: f64,
    pub over_budget: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeTypeSummary {
    pub income_type: String,
    pub budget: f64,
    pub total: f64,
}

impl SummaryTotals {
    /// Calculate the balance (income - expenses)
    pub fn balance_budgeted(&self) -> f64 {
        self.total_budgeted_income - self.total_budgeted_expenses
    }

    /// Calculate the actual balance
    pub fn balance_current(&self) -> f64 {
        self.total_current_income - self.total_current_expenses
    }

    /// Check if expenses are over budget
    pub fn expenses_over_budget(&self) -> bool {
        self.total_current_expenses > self.total_budgeted_expenses
    }

    /// Check if income is under budget
    pub fn income_under_budget(&self) -> bool {
        self.total_current_income < self.total_budgeted_income
    }
}

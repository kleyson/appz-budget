use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryTotals {
    pub total_projected_expenses: f64,
    pub total_current_expenses: f64,
    pub total_projected_income: f64,
    pub total_current_income: f64,
    pub total_projected: f64,
    pub total_current: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySummary {
    pub category: String,
    pub projected: f64,
    pub total: f64,
    pub over_projected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeTypeSummary {
    pub income_type: String,
    pub projected: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodSummary {
    pub period: String,
    pub color: String,
    pub total_income: f64,
    pub total_expenses: f64,
    pub difference: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodSummaryResponse {
    pub periods: Vec<PeriodSummary>,
    pub grand_total_income: f64,
    pub grand_total_expenses: f64,
    pub grand_total_difference: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryInsight {
    #[serde(rename = "type")]
    pub insight_type: String,
    pub icon: String,
    pub message: String,
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryInsights {
    pub insights: Vec<SummaryInsight>,
    #[serde(rename = "savingsProjection")]
    pub savings_projection: f64,
    #[serde(rename = "budgetHealth")]
    pub budget_health: String,
    #[serde(rename = "overProjectedCount")]
    pub over_projected_count: u32,
    #[serde(rename = "totalCategories")]
    pub total_categories: u32,
}

impl SummaryTotals {
    /// Calculate the projected balance (income - expenses)
    pub fn balance_projected(&self) -> f64 {
        self.total_projected_income - self.total_projected_expenses
    }

    /// Calculate the actual balance
    pub fn balance_current(&self) -> f64 {
        self.total_current_income - self.total_current_expenses
    }

    /// Check if expenses are over projected
    pub fn expenses_over_projected(&self) -> bool {
        self.total_current_expenses > self.total_projected_expenses
    }

    /// Check if income is under projected
    pub fn income_under_projected(&self) -> bool {
        self.total_current_income < self.total_projected_income
    }
}

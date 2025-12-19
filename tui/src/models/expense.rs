use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Purchase {
    pub name: String,
    pub amount: f64,
    pub date: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Expense {
    pub id: i32,
    pub expense_name: String,
    pub period: String,
    pub category: String,
    pub budget: f64,
    pub cost: f64,
    pub notes: Option<String>,
    pub month_id: i32,
    pub purchases: Option<Vec<Purchase>>,
    pub order: i32,
    pub expense_date: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExpenseCreate {
    pub expense_name: String,
    pub period: String,
    pub category: String,
    pub budget: f64,
    pub cost: f64,
    pub notes: Option<String>,
    pub month_id: i32,
    pub purchases: Option<Vec<Purchase>>,
    pub expense_date: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct ExpenseUpdate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expense_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub period: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub budget: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purchases: Option<Vec<Purchase>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expense_date: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct ExpenseFilters {
    pub period: Option<String>,
    pub category: Option<String>,
    pub month_id: Option<i32>,
}

impl ExpenseFilters {
    pub fn to_query_params(&self) -> Vec<(&str, String)> {
        let mut params = Vec::new();
        if let Some(ref period) = self.period {
            params.push(("period", period.clone()));
        }
        if let Some(ref category) = self.category {
            params.push(("category", category.clone()));
        }
        if let Some(month_id) = self.month_id {
            params.push(("month_id", month_id.to_string()));
        }
        params
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ExpenseReorderRequest {
    pub expense_ids: Vec<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CloneResponse {
    pub message: String,
    pub cloned_count: i32,
    pub cloned_income_count: i32,
    pub next_month_id: i32,
    pub next_month_name: String,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct PayExpenseRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<f64>,
}

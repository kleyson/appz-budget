use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Income {
    pub id: i32,
    pub income_type_id: i32,
    pub period: String,
    pub budget: f64,
    pub amount: f64,
    pub month_id: i32,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct IncomeCreate {
    pub income_type_id: i32,
    pub period: String,
    pub budget: f64,
    pub amount: f64,
    pub month_id: i32,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct IncomeUpdate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub income_type_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub period: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub budget: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month_id: Option<i32>,
}

#[derive(Debug, Clone, Default)]
pub struct IncomeFilters {
    pub period: Option<String>,
    pub income_type_id: Option<i32>,
    pub month_id: Option<i32>,
}

impl IncomeFilters {
    pub fn to_query_params(&self) -> Vec<(&str, String)> {
        let mut params = Vec::new();
        if let Some(ref period) = self.period {
            params.push(("period", period.clone()));
        }
        if let Some(income_type_id) = self.income_type_id {
            params.push(("income_type_id", income_type_id.to_string()));
        }
        if let Some(month_id) = self.month_id {
            params.push(("month_id", month_id.to_string()));
        }
        params
    }
}

use crate::api::client::{ApiClient, ApiError};
use crate::models::{IncomeType, IncomeTypeCreate, IncomeTypeSummary, IncomeTypeUpdate};

pub struct IncomeTypesApi<'a> {
    client: &'a ApiClient,
}

impl<'a> IncomeTypesApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all income types
    pub async fn get_all(&self) -> Result<Vec<IncomeType>, ApiError> {
        self.client.get("/income-types").await
    }

    /// Get a single income type by ID
    pub async fn get_by_id(&self, id: i32) -> Result<IncomeType, ApiError> {
        self.client.get(&format!("/income-types/{}", id)).await
    }

    /// Create a new income type
    pub async fn create(&self, income_type: &IncomeTypeCreate) -> Result<IncomeType, ApiError> {
        self.client.post("/income-types", income_type).await
    }

    /// Update an income type
    pub async fn update(
        &self,
        id: i32,
        income_type: &IncomeTypeUpdate,
    ) -> Result<IncomeType, ApiError> {
        self.client
            .put(&format!("/income-types/{}", id), income_type)
            .await
    }

    /// Delete an income type
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/income-types/{}", id)).await
    }

    /// Get income type summaries
    pub async fn get_summary(
        &self,
        period: Option<&str>,
        month_id: Option<i32>,
    ) -> Result<Vec<IncomeTypeSummary>, ApiError> {
        let mut params: Vec<(&str, String)> = Vec::new();
        if let Some(p) = period {
            params.push(("period", p.to_string()));
        }
        if let Some(id) = month_id {
            params.push(("month_id", id.to_string()));
        }
        self.client
            .get_with_params("/income-types/summary", &params)
            .await
    }
}

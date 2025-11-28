use crate::api::client::{ApiClient, ApiError};
use crate::models::{Income, IncomeCreate, IncomeFilters, IncomeUpdate};

pub struct IncomesApi<'a> {
    client: &'a ApiClient,
}

impl<'a> IncomesApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all incomes with optional filters
    pub async fn get_all(&self, filters: &IncomeFilters) -> Result<Vec<Income>, ApiError> {
        let params = filters.to_query_params();
        self.client.get_with_params("/incomes", &params).await
    }

    /// Get a single income by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Income, ApiError> {
        self.client.get(&format!("/incomes/{}", id)).await
    }

    /// Create a new income
    pub async fn create(&self, income: &IncomeCreate) -> Result<Income, ApiError> {
        self.client.post("/incomes", income).await
    }

    /// Update an income
    pub async fn update(&self, id: i32, income: &IncomeUpdate) -> Result<Income, ApiError> {
        self.client.put(&format!("/incomes/{}", id), income).await
    }

    /// Delete an income
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/incomes/{}", id)).await
    }
}

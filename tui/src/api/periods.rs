use crate::api::client::{ApiClient, ApiError};
use crate::models::{Period, PeriodCreate, PeriodUpdate};

pub struct PeriodsApi<'a> {
    client: &'a ApiClient,
}

impl<'a> PeriodsApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all periods
    pub async fn get_all(&self) -> Result<Vec<Period>, ApiError> {
        self.client.get("/periods").await
    }

    /// Get a single period by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Period, ApiError> {
        self.client.get(&format!("/periods/{}", id)).await
    }

    /// Create a new period
    pub async fn create(&self, period: &PeriodCreate) -> Result<Period, ApiError> {
        self.client.post("/periods", period).await
    }

    /// Update a period
    pub async fn update(&self, id: i32, period: &PeriodUpdate) -> Result<Period, ApiError> {
        self.client.put(&format!("/periods/{}", id), period).await
    }

    /// Delete a period
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/periods/{}", id)).await
    }
}

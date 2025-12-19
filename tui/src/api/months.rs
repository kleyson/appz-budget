use crate::api::client::{ApiClient, ApiError};
use crate::models::{Month, MonthCloseResponse, MonthCreate};

pub struct MonthsApi<'a> {
    client: &'a ApiClient,
}

impl<'a> MonthsApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all months
    pub async fn get_all(&self) -> Result<Vec<Month>, ApiError> {
        self.client.get("/months").await
    }

    /// Get a single month by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Month, ApiError> {
        self.client.get(&format!("/months/{}", id)).await
    }

    /// Get the current month
    pub async fn get_current(&self) -> Result<Month, ApiError> {
        self.client.get("/months/current").await
    }

    /// Create a new month
    pub async fn create(&self, month: &MonthCreate) -> Result<Month, ApiError> {
        self.client.post("/months", month).await
    }

    /// Delete a month
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/months/{}", id)).await
    }

    /// Close a month (prevents adding expenses/incomes)
    pub async fn close(&self, id: i32) -> Result<MonthCloseResponse, ApiError> {
        self.client
            .post(&format!("/months/{}/close", id), &())
            .await
    }

    /// Open a closed month (allows adding expenses/incomes)
    pub async fn open(&self, id: i32) -> Result<MonthCloseResponse, ApiError> {
        self.client.post(&format!("/months/{}/open", id), &()).await
    }
}

use crate::api::client::{ApiClient, ApiError};
use crate::models::{Category, CategoryCreate, CategorySummary, CategoryUpdate};

pub struct CategoriesApi<'a> {
    client: &'a ApiClient,
}

impl<'a> CategoriesApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all categories
    pub async fn get_all(&self) -> Result<Vec<Category>, ApiError> {
        self.client.get("/categories").await
    }

    /// Get a single category by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Category, ApiError> {
        self.client.get(&format!("/categories/{}", id)).await
    }

    /// Create a new category
    pub async fn create(&self, category: &CategoryCreate) -> Result<Category, ApiError> {
        self.client.post("/categories", category).await
    }

    /// Update a category
    pub async fn update(&self, id: i32, category: &CategoryUpdate) -> Result<Category, ApiError> {
        self.client
            .put(&format!("/categories/{}", id), category)
            .await
    }

    /// Delete a category
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/categories/{}", id)).await
    }

    /// Get category summaries
    pub async fn get_summary(
        &self,
        month_id: Option<i32>,
    ) -> Result<Vec<CategorySummary>, ApiError> {
        let params: Vec<(&str, String)> = month_id
            .map(|id| vec![("month_id", id.to_string())])
            .unwrap_or_default();
        self.client
            .get_with_params("/categories/summary", &params)
            .await
    }
}

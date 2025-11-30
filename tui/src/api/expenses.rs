use crate::api::client::{ApiClient, ApiError};
use crate::models::{
    CloneResponse, Expense, ExpenseCreate, ExpenseFilters, ExpenseReorderRequest, ExpenseUpdate,
    PayExpenseRequest,
};

pub struct ExpensesApi<'a> {
    client: &'a ApiClient,
}

impl<'a> ExpensesApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get all expenses with optional filters
    pub async fn get_all(&self, filters: &ExpenseFilters) -> Result<Vec<Expense>, ApiError> {
        let params = filters.to_query_params();
        self.client.get_with_params("/expenses", &params).await
    }

    /// Get a single expense by ID
    pub async fn get_by_id(&self, id: i32) -> Result<Expense, ApiError> {
        self.client.get(&format!("/expenses/{}", id)).await
    }

    /// Create a new expense
    pub async fn create(&self, expense: &ExpenseCreate) -> Result<Expense, ApiError> {
        self.client.post("/expenses", expense).await
    }

    /// Update an expense
    pub async fn update(&self, id: i32, expense: &ExpenseUpdate) -> Result<Expense, ApiError> {
        self.client.put(&format!("/expenses/{}", id), expense).await
    }

    /// Delete an expense
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        self.client.delete(&format!("/expenses/{}", id)).await
    }

    /// Reorder expenses
    pub async fn reorder(&self, expense_ids: &[i32]) -> Result<Vec<Expense>, ApiError> {
        let body = ExpenseReorderRequest {
            expense_ids: expense_ids.to_vec(),
        };
        self.client.post("/expenses/reorder", &body).await
    }

    /// Clone expenses to the next month
    pub async fn clone_to_next_month(&self, month_id: i32) -> Result<CloneResponse, ApiError> {
        self.client
            .post(&format!("/expenses/clone-to-next-month/{}", month_id), &())
            .await
    }

    /// Pay an expense (adds a payment entry with the budget amount)
    pub async fn pay(
        &self,
        id: i32,
        request: Option<&PayExpenseRequest>,
    ) -> Result<Expense, ApiError> {
        let body = request.cloned().unwrap_or_default();
        self.client
            .post(&format!("/expenses/{}/pay", id), &body)
            .await
    }
}

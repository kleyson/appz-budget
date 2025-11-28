use crate::api::client::{ApiClient, ApiError};
use crate::models::{PeriodSummaryResponse, SummaryTotals};

pub struct SummaryApi<'a> {
    client: &'a ApiClient,
}

impl<'a> SummaryApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Get summary totals
    pub async fn get_totals(
        &self,
        period: Option<&str>,
        month_id: Option<i32>,
    ) -> Result<SummaryTotals, ApiError> {
        let mut params: Vec<(&str, String)> = Vec::new();
        if let Some(p) = period {
            params.push(("period", p.to_string()));
        }
        if let Some(id) = month_id {
            params.push(("month_id", id.to_string()));
        }
        self.client
            .get_with_params("/summary/totals", &params)
            .await
    }

    /// Get summary by period
    pub async fn get_by_period(
        &self,
        month_id: Option<i32>,
    ) -> Result<PeriodSummaryResponse, ApiError> {
        let mut params: Vec<(&str, String)> = Vec::new();
        if let Some(id) = month_id {
            params.push(("month_id", id.to_string()));
        }
        self.client
            .get_with_params("/summary/by-period", &params)
            .await
    }
}

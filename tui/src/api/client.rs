use std::sync::RwLock;
use std::time::Duration;

use anyhow::{Context, Result};
use reqwest::{header, Client, Method, StatusCode};
use serde::{de::DeserializeOwned, Serialize};
use thiserror::Error;

use super::{
    AuthApi, CategoriesApi, ExpensesApi, IncomeTypesApi, IncomesApi, MonthsApi, PeriodsApi,
    SummaryApi,
};

const CLIENT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Unauthorized - please login again")]
    Unauthorized,
    #[error("Not found")]
    NotFound,
    #[error("Server error: {0}")]
    Server(String),
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}

/// HTTP API client for the budget backend
pub struct ApiClient {
    client: Client,
    base_url: String,
    api_key: String,
    token: RwLock<Option<String>>,
}

impl ApiClient {
    /// Create a new API client
    pub fn new(base_url: String, api_key: String) -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .context("Failed to create HTTP client")?;

        Ok(Self {
            client,
            base_url,
            api_key,
            token: RwLock::new(None),
        })
    }

    /// Set the authentication token
    pub fn set_token(&self, token: String) {
        *self.token.write().unwrap() = Some(token);
    }

    /// Clear the authentication token
    pub fn clear_token(&self) {
        *self.token.write().unwrap() = None;
    }

    /// Check if client has a token
    pub fn has_token(&self) -> bool {
        self.token.read().unwrap().is_some()
    }

    /// Make a GET request
    pub async fn get<T: DeserializeOwned>(&self, endpoint: &str) -> Result<T, ApiError> {
        self.request::<(), T>(Method::GET, endpoint, None).await
    }

    /// Make a GET request with query parameters
    pub async fn get_with_params<T: DeserializeOwned>(
        &self,
        endpoint: &str,
        params: &[(&str, String)],
    ) -> Result<T, ApiError> {
        let url = if params.is_empty() {
            endpoint.to_string()
        } else {
            let query: Vec<String> = params
                .iter()
                .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
                .collect();
            format!("{}?{}", endpoint, query.join("&"))
        };
        self.request::<(), T>(Method::GET, &url, None).await
    }

    /// Make a POST request
    pub async fn post<B: Serialize, T: DeserializeOwned>(
        &self,
        endpoint: &str,
        body: &B,
    ) -> Result<T, ApiError> {
        self.request(Method::POST, endpoint, Some(body)).await
    }

    /// Make a PUT request
    pub async fn put<B: Serialize, T: DeserializeOwned>(
        &self,
        endpoint: &str,
        body: &B,
    ) -> Result<T, ApiError> {
        self.request(Method::PUT, endpoint, Some(body)).await
    }

    /// Make a DELETE request
    pub async fn delete(&self, endpoint: &str) -> Result<(), ApiError> {
        let url = format!("{}/api/v1{}", self.base_url, endpoint);

        let mut req = self
            .client
            .request(Method::DELETE, &url)
            .header("X-API-Key", &self.api_key)
            .header("X-Client-Info", format!("TUI/{}", CLIENT_VERSION))
            .header(header::CONTENT_TYPE, "application/json");

        if let Some(token) = self.token.read().unwrap().as_ref() {
            req = req.header(header::AUTHORIZATION, format!("Bearer {}", token));
        }

        let response = req.send().await?;

        match response.status() {
            StatusCode::UNAUTHORIZED => Err(ApiError::Unauthorized),
            StatusCode::NOT_FOUND => Err(ApiError::NotFound),
            status if status.is_success() => Ok(()),
            status => {
                let text = response.text().await.unwrap_or_default();
                Err(ApiError::Server(format!("{}: {}", status, text)))
            }
        }
    }

    /// Make an HTTP request
    async fn request<B: Serialize, T: DeserializeOwned>(
        &self,
        method: Method,
        endpoint: &str,
        body: Option<&B>,
    ) -> Result<T, ApiError> {
        let url = format!("{}/api/v1{}", self.base_url, endpoint);

        let mut req = self
            .client
            .request(method, &url)
            .header("X-API-Key", &self.api_key)
            .header("X-Client-Info", format!("TUI/{}", CLIENT_VERSION))
            .header(header::CONTENT_TYPE, "application/json");

        if let Some(token) = self.token.read().unwrap().as_ref() {
            req = req.header(header::AUTHORIZATION, format!("Bearer {}", token));
        }

        if let Some(body) = body {
            req = req.json(body);
        }

        let response = req.send().await?;

        match response.status() {
            StatusCode::UNAUTHORIZED => Err(ApiError::Unauthorized),
            StatusCode::NOT_FOUND => Err(ApiError::NotFound),
            status if status.is_success() => {
                let data = response
                    .json()
                    .await
                    .map_err(|e| ApiError::InvalidResponse(e.to_string()))?;
                Ok(data)
            }
            status => {
                let text = response.text().await.unwrap_or_default();
                Err(ApiError::Server(format!("{}: {}", status, text)))
            }
        }
    }

    // Domain-specific API accessors

    pub fn auth(&self) -> AuthApi<'_> {
        AuthApi::new(self)
    }

    pub fn expenses(&self) -> ExpensesApi<'_> {
        ExpensesApi::new(self)
    }

    pub fn incomes(&self) -> IncomesApi<'_> {
        IncomesApi::new(self)
    }

    pub fn categories(&self) -> CategoriesApi<'_> {
        CategoriesApi::new(self)
    }

    pub fn periods(&self) -> PeriodsApi<'_> {
        PeriodsApi::new(self)
    }

    pub fn income_types(&self) -> IncomeTypesApi<'_> {
        IncomeTypesApi::new(self)
    }

    pub fn months(&self) -> MonthsApi<'_> {
        MonthsApi::new(self)
    }

    pub fn summary(&self) -> SummaryApi<'_> {
        SummaryApi::new(self)
    }
}

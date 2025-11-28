use crate::api::client::{ApiClient, ApiError};
use crate::models::{
    ChangePasswordRequest, ChangePasswordResponse, TokenResponse, User, UserLogin,
};

pub struct AuthApi<'a> {
    client: &'a ApiClient,
}

impl<'a> AuthApi<'a> {
    pub fn new(client: &'a ApiClient) -> Self {
        Self { client }
    }

    /// Login with email and password
    pub async fn login(&self, email: &str, password: &str) -> Result<TokenResponse, ApiError> {
        let body = UserLogin {
            email: email.to_string(),
            password: password.to_string(),
        };
        self.client.post("/auth/login", &body).await
    }

    /// Get the current user
    pub async fn me(&self) -> Result<User, ApiError> {
        self.client.get("/auth/me").await
    }

    /// Change password
    pub async fn change_password(
        &self,
        current_password: &str,
        new_password: &str,
    ) -> Result<ChangePasswordResponse, ApiError> {
        let body = ChangePasswordRequest {
            current_password: current_password.to_string(),
            new_password: new_password.to_string(),
        };
        self.client.post("/auth/change-password", &body).await
    }
}

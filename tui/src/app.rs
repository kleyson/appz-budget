use anyhow::Result;
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::{backend::CrosstermBackend, Terminal};
use std::io::Stdout;

use crate::api::ApiClient;
use crate::config::Config;
use crate::event::{Event, EventHandler};
use crate::models::ExpenseFilters;
use crate::state::forms::{
    CategoryFormState, ExpenseField, ExpenseFormState, IncomeFormState, IncomeTypeFormState,
    PasswordFormState, PeriodFormState, PurchaseEditField,
};
use crate::state::{AppState, DashboardTab, Modal, Screen, SettingsTab};
use crate::ui;
use crate::ui::api_config::{self, ApiConfigField};
use crate::ui::login::{self, LoginField};

/// Generate a random hex color
fn generate_random_color() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    // Simple random using system time
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos() as u64;

    // Generate RGB values using simple linear congruential generator
    let r = ((seed.wrapping_mul(1103515245).wrapping_add(12345)) % 256) as u8;
    let g = ((seed.wrapping_mul(214013).wrapping_add(2531011)) % 256) as u8;
    let b = ((seed.wrapping_mul(16807).wrapping_add(0)) % 256) as u8;

    // Ensure colors are not too dark or too light
    let r = r.clamp(50, 220);
    let g = g.clamp(50, 220);
    let b = b.clamp(50, 220);

    format!("#{:02x}{:02x}{:02x}", r, g, b)
}

/// Application version from VERSION file at project root
pub const VERSION: &str = include_str!("../../VERSION");

/// Main application struct
pub struct App {
    /// Application state
    pub state: AppState,
    /// Configuration
    pub config: Config,
    /// API client
    pub api: ApiClient,
    /// API configuration state
    pub api_url: String,
    pub api_key: String,
    pub api_config_focused_field: usize,
    pub api_config_error: Option<String>,
    /// Login form state - credentials
    pub login_email: String,
    pub login_password: String,
    pub login_focused_field: usize,
    pub login_error: Option<String>,
    /// Expense form state
    pub expense_form: ExpenseFormState,
    /// Income form state
    pub income_form: IncomeFormState,
    /// Category form state
    pub category_form: CategoryFormState,
    /// Period form state
    pub period_form: PeriodFormState,
    /// Income type form state
    pub income_type_form: IncomeTypeFormState,
    /// Password form state
    pub password_form: PasswordFormState,
    /// Should quit
    pub should_quit: bool,
}

impl App {
    /// Create a new application instance
    pub async fn new() -> Result<Self> {
        let config = Config::load()?;
        let api = ApiClient::new(config.server.url.clone(), config.server.api_key.clone())?;

        // If we have a stored token, set it and try to validate
        let mut state = AppState::default();
        if let Some(ref token) = config.auth.token {
            api.set_token(token.clone());
            // Try to get current user to validate token
            match api.auth().me().await {
                Ok(user) => {
                    state.user = Some(user);
                    state.screen = Screen::Dashboard;
                }
                Err(_) => {
                    // Token invalid, clear it
                    api.clear_token();
                }
            }
        }

        Ok(Self {
            state,
            api_url: config.server.url.clone(),
            api_key: config.server.api_key.clone(),
            api_config_focused_field: ApiConfigField::ApiUrl.index(),
            api_config_error: None,
            config,
            api,
            login_email: String::new(),
            login_password: String::new(),
            login_focused_field: LoginField::Email.index(),
            login_error: None,
            expense_form: ExpenseFormState::default(),
            income_form: IncomeFormState::default(),
            category_form: CategoryFormState::default(),
            period_form: PeriodFormState::default(),
            income_type_form: IncomeTypeFormState::default(),
            password_form: PasswordFormState::default(),
            should_quit: false,
        })
    }

    /// Run the main event loop
    pub async fn run(
        &mut self,
        terminal: &mut Terminal<CrosstermBackend<Stdout>>,
        events: EventHandler,
    ) -> Result<()> {
        // If already logged in, load initial data
        if self.state.screen == Screen::Dashboard {
            self.load_initial_data().await;
        }

        loop {
            // Draw UI
            terminal.draw(|frame| self.render(frame))?;

            // Handle events
            match events.next()? {
                Event::Tick => {
                    // Clear messages after some time could be done here
                }
                Event::Key(key) => {
                    self.handle_key_event(key).await;
                }
                Event::Mouse(_mouse) => {
                    // Mouse handling could be added here
                }
                Event::Resize(_, _) => {
                    // Terminal resize is handled automatically by ratatui
                }
            }

            if self.should_quit {
                break;
            }
        }

        Ok(())
    }

    /// Render the UI
    fn render(&mut self, frame: &mut ratatui::Frame) {
        match self.state.screen {
            Screen::Login => {
                login::render_with_state(
                    frame,
                    &self.login_email,
                    &self.login_password,
                    self.login_focused_field,
                    self.login_error.as_deref(),
                    self.state.ui.is_loading,
                    VERSION.trim(),
                    &self.api_url,
                );
            }
            Screen::ApiConfig => {
                api_config::render(
                    frame,
                    &self.api_url,
                    &self.api_key,
                    self.api_config_focused_field,
                    self.api_config_error.as_deref(),
                    VERSION.trim(),
                );
            }
            Screen::Dashboard => {
                ui::render_with_forms(
                    &self.state,
                    frame,
                    &self.expense_form,
                    &self.income_form,
                    &self.category_form,
                    &self.period_form,
                    &self.income_type_form,
                    &self.password_form,
                );
            }
        }
    }

    /// Handle key events
    async fn handle_key_event(&mut self, key: KeyEvent) {
        // Global quit
        if key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL) {
            self.should_quit = true;
            return;
        }

        match self.state.screen {
            Screen::Login => self.handle_login_key(key).await,
            Screen::ApiConfig => self.handle_api_config_key(key),
            Screen::Dashboard => self.handle_dashboard_key(key).await,
        }
    }

    /// Handle login screen keys
    async fn handle_login_key(&mut self, key: KeyEvent) {
        // Clear error on any key except Enter
        if self.login_error.is_some() && key.code != KeyCode::Enter {
            self.login_error = None;
        }

        let field_count = LoginField::count();

        match key.code {
            // Navigation - Tab and arrows
            KeyCode::Tab | KeyCode::Down => {
                self.login_focused_field = (self.login_focused_field + 1) % field_count;
            }
            KeyCode::BackTab | KeyCode::Up => {
                self.login_focused_field = if self.login_focused_field == 0 {
                    field_count - 1
                } else {
                    self.login_focused_field - 1
                };
            }
            // Submit
            KeyCode::Enter => {
                self.attempt_login().await;
            }
            // Text input
            KeyCode::Char(c) => {
                // 's' key without any text input goes to API config
                if c == 's' && self.login_email.is_empty() && self.login_password.is_empty() {
                    self.state.screen = Screen::ApiConfig;
                } else {
                    match LoginField::from_index(self.login_focused_field) {
                        LoginField::Email => self.login_email.push(c),
                        LoginField::Password => self.login_password.push(c),
                    }
                }
            }
            // Delete character
            KeyCode::Backspace => match LoginField::from_index(self.login_focused_field) {
                LoginField::Email => {
                    self.login_email.pop();
                }
                LoginField::Password => {
                    self.login_password.pop();
                }
            },
            // Quit
            KeyCode::Esc => {
                self.should_quit = true;
            }
            _ => {}
        }
    }

    /// Handle API config screen keys
    fn handle_api_config_key(&mut self, key: KeyEvent) {
        // Clear error on any key except Enter
        if self.api_config_error.is_some() && key.code != KeyCode::Enter {
            self.api_config_error = None;
        }

        let field_count = ApiConfigField::count();

        match key.code {
            // Navigation - Tab and arrows
            KeyCode::Tab | KeyCode::Down => {
                self.api_config_focused_field = (self.api_config_focused_field + 1) % field_count;
            }
            KeyCode::BackTab | KeyCode::Up => {
                self.api_config_focused_field = if self.api_config_focused_field == 0 {
                    field_count - 1
                } else {
                    self.api_config_focused_field - 1
                };
            }
            // Save and go back
            KeyCode::Enter => {
                self.save_api_config();
            }
            // Text input
            KeyCode::Char(c) => match ApiConfigField::from_index(self.api_config_focused_field) {
                ApiConfigField::ApiUrl => self.api_url.push(c),
                ApiConfigField::ApiKey => self.api_key.push(c),
            },
            // Delete character
            KeyCode::Backspace => match ApiConfigField::from_index(self.api_config_focused_field) {
                ApiConfigField::ApiUrl => {
                    self.api_url.pop();
                }
                ApiConfigField::ApiKey => {
                    self.api_key.pop();
                }
            },
            // Cancel and go back
            KeyCode::Esc => {
                // Restore from config and go back
                self.api_url = self.config.server.url.clone();
                self.api_key = self.config.server.api_key.clone();
                self.api_config_error = None;
                self.state.screen = Screen::Login;
            }
            _ => {}
        }
    }

    /// Save API config and return to login
    fn save_api_config(&mut self) {
        // Validate
        if self.api_url.is_empty() {
            self.api_config_error = Some("API URL is required".to_string());
            return;
        }

        // Update config
        self.config.server.url = self.api_url.clone();
        self.config.server.api_key = self.api_key.clone();

        // Save to file
        if let Err(e) = self.config.save() {
            self.api_config_error = Some(format!("Failed to save: {}", e));
            return;
        }

        // Update API client
        match ApiClient::new(self.api_url.clone(), self.api_key.clone()) {
            Ok(new_api) => {
                self.api = new_api;
                self.api_config_error = None;
                self.state.screen = Screen::Login;
            }
            Err(e) => {
                self.api_config_error = Some(format!("Invalid URL: {}", e));
            }
        }
    }

    /// Attempt to login
    async fn attempt_login(&mut self) {
        // Validate credentials
        if self.login_email.is_empty() || self.login_password.is_empty() {
            self.login_error = Some("Please enter email and password".to_string());
            return;
        }

        self.state.ui.is_loading = true;

        match self
            .api
            .auth()
            .login(&self.login_email, &self.login_password)
            .await
        {
            Ok(token_response) => {
                // Store token
                self.api.set_token(token_response.access_token.clone());
                if let Err(e) = self.config.set_token(token_response.access_token) {
                    // Log but don't fail - token is still in memory
                    eprintln!("Failed to save token: {}", e);
                }

                // Get user info
                if let Ok(user) = self.api.auth().me().await {
                    self.state.user = Some(user);
                }

                // Clear login form (but keep API config)
                self.login_email.clear();
                self.login_password.clear();
                self.login_error = None;

                // Switch to dashboard
                self.state.screen = Screen::Dashboard;
                self.state.ui.is_loading = false;

                // Load initial data
                self.load_initial_data().await;
            }
            Err(e) => {
                self.state.ui.is_loading = false;
                self.login_error = Some(format!("Login failed: {}", e));
            }
        }
    }

    /// Handle dashboard keys
    async fn handle_dashboard_key(&mut self, key: KeyEvent) {
        // Handle modal first if open
        if self.state.ui.modal.is_some() {
            self.handle_modal_key(key).await;
            return;
        }

        match key.code {
            KeyCode::Char('q') => {
                self.should_quit = true;
            }
            KeyCode::Char('?') => {
                self.state.ui.modal = Some(Modal::Help);
            }
            KeyCode::Tab => {
                self.state.ui.selected_tab = self.state.ui.selected_tab.next();
                self.load_tab_data().await;
            }
            KeyCode::BackTab => {
                self.state.ui.selected_tab = self.state.ui.selected_tab.previous();
                self.load_tab_data().await;
            }
            // Number keys: in Settings tab, switch sections; otherwise switch main tabs
            KeyCode::Char('1') => {
                if self.state.ui.selected_tab == DashboardTab::Settings {
                    self.state.ui.settings_tab = SettingsTab::Categories;
                } else {
                    self.state.ui.selected_tab = DashboardTab::Summary;
                    self.load_tab_data().await;
                }
            }
            KeyCode::Char('2') => {
                if self.state.ui.selected_tab == DashboardTab::Settings {
                    self.state.ui.settings_tab = SettingsTab::Periods;
                } else {
                    self.state.ui.selected_tab = DashboardTab::Expenses;
                    self.load_tab_data().await;
                }
            }
            KeyCode::Char('3') => {
                if self.state.ui.selected_tab == DashboardTab::Settings {
                    self.state.ui.settings_tab = SettingsTab::IncomeTypes;
                } else {
                    self.state.ui.selected_tab = DashboardTab::Income;
                    self.load_tab_data().await;
                }
            }
            KeyCode::Char('4') => {
                if self.state.ui.selected_tab == DashboardTab::Settings {
                    self.state.ui.settings_tab = SettingsTab::Password;
                } else {
                    self.state.ui.selected_tab = DashboardTab::Charts;
                    self.load_tab_data().await;
                }
            }
            KeyCode::Char('5') => {
                self.state.ui.selected_tab = DashboardTab::Settings;
                self.load_tab_data().await;
            }
            KeyCode::Char('h') | KeyCode::Left => {
                self.state.previous_month();
                self.load_month_data().await;
            }
            KeyCode::Char('l') | KeyCode::Right => {
                self.state.next_month();
                self.load_month_data().await;
            }
            KeyCode::Char('j') | KeyCode::Down => {
                self.select_next_item();
            }
            KeyCode::Char('k') | KeyCode::Up => {
                self.select_previous_item();
            }
            KeyCode::Char('n') => {
                self.open_new_item_modal();
            }
            KeyCode::Char('e') | KeyCode::Enter => {
                self.open_edit_item_modal();
            }
            KeyCode::Char('d') => {
                self.open_delete_confirmation();
            }
            KeyCode::Char('p') => {
                self.open_pay_confirmation();
            }
            KeyCode::Char('c') => {
                self.open_close_month_confirmation();
            }
            _ => {}
        }
    }

    /// Handle modal keys
    async fn handle_modal_key(&mut self, key: KeyEvent) {
        // Handle ExpenseForm modal
        if matches!(self.state.ui.modal, Some(Modal::ExpenseForm { .. })) {
            self.handle_expense_form_key(key).await;
            return;
        }

        // Handle IncomeForm modal
        if matches!(self.state.ui.modal, Some(Modal::IncomeForm { .. })) {
            self.handle_income_form_key(key).await;
            return;
        }

        // Handle CategoryForm modal
        if matches!(self.state.ui.modal, Some(Modal::CategoryForm { .. })) {
            self.handle_entity_form_key(key, "category").await;
            return;
        }

        // Handle PeriodForm modal
        if matches!(self.state.ui.modal, Some(Modal::PeriodForm { .. })) {
            self.handle_entity_form_key(key, "period").await;
            return;
        }

        // Handle IncomeTypeForm modal
        if matches!(self.state.ui.modal, Some(Modal::IncomeTypeForm { .. })) {
            self.handle_entity_form_key(key, "income_type").await;
            return;
        }

        // Handle PasswordForm modal
        if matches!(self.state.ui.modal, Some(Modal::PasswordForm)) {
            self.handle_password_form_key(key).await;
            return;
        }

        // Handle ConfirmPay modal with editable amount
        if let Some(Modal::ConfirmPay {
            ref mut amount_input,
            ..
        }) = self.state.ui.modal
        {
            match key.code {
                KeyCode::Esc => {
                    self.state.ui.modal = None;
                }
                KeyCode::Enter => {
                    self.confirm_pay().await;
                }
                KeyCode::Char(c) if c.is_ascii_digit() || c == '.' => {
                    // Only allow one decimal point
                    if c == '.' && amount_input.contains('.') {
                        return;
                    }
                    amount_input.push(c);
                }
                KeyCode::Backspace => {
                    amount_input.pop();
                }
                _ => {}
            }
            return;
        }

        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
            }
            KeyCode::Char('y') => {
                if matches!(self.state.ui.modal, Some(Modal::ConfirmDelete { .. })) {
                    self.confirm_delete().await;
                } else if matches!(self.state.ui.modal, Some(Modal::ConfirmCloseMonth { .. })) {
                    self.confirm_close_month().await;
                }
            }
            KeyCode::Char('n') => {
                if matches!(self.state.ui.modal, Some(Modal::ConfirmDelete { .. }))
                    || matches!(self.state.ui.modal, Some(Modal::ConfirmCloseMonth { .. }))
                {
                    self.state.ui.modal = None;
                }
            }
            _ => {
                // For help modal, any key closes it
                if matches!(self.state.ui.modal, Some(Modal::Help)) {
                    self.state.ui.modal = None;
                }
            }
        }
    }

    /// Handle expense form keys
    async fn handle_expense_form_key(&mut self, key: KeyEvent) {
        // Special handling for Purchases field
        if self.expense_form.focused_field == ExpenseField::Purchases {
            // Handle Ctrl+key combinations first
            if key.modifiers.contains(KeyModifiers::CONTROL) {
                match key.code {
                    KeyCode::Char('n') => {
                        // Ctrl+n: Add new purchase
                        self.expense_form.add_purchase();
                        return;
                    }
                    KeyCode::Char('d') => {
                        // Ctrl+d: Delete selected purchase
                        self.expense_form.remove_purchase();
                        return;
                    }
                    _ => {}
                }
            }

            match key.code {
                KeyCode::Esc => {
                    self.state.ui.modal = None;
                }
                KeyCode::Tab => {
                    self.expense_form.focused_field = self.expense_form.focused_field.next();
                }
                KeyCode::BackTab => {
                    self.expense_form.focused_field = self.expense_form.focused_field.previous();
                }
                KeyCode::Enter => {
                    // If no purchases yet, add one; otherwise save
                    if self.expense_form.purchases.is_empty() {
                        self.expense_form.add_purchase();
                    } else {
                        self.save_expense().await;
                    }
                }
                KeyCode::Insert => {
                    // Insert: Add new purchase
                    self.expense_form.add_purchase();
                }
                KeyCode::Delete => {
                    // Delete: Remove selected purchase
                    self.expense_form.remove_purchase();
                }
                KeyCode::Up => {
                    // Navigate up in purchases
                    if self.expense_form.selected_purchase > 0 {
                        self.expense_form.selected_purchase -= 1;
                    }
                }
                KeyCode::Down => {
                    // Navigate down in purchases
                    if !self.expense_form.purchases.is_empty()
                        && self.expense_form.selected_purchase
                            < self.expense_form.purchases.len() - 1
                    {
                        self.expense_form.selected_purchase += 1;
                    }
                }
                KeyCode::Left | KeyCode::Right => {
                    // Toggle between name and amount
                    self.expense_form.purchase_edit_field =
                        match self.expense_form.purchase_edit_field {
                            PurchaseEditField::Name => PurchaseEditField::Amount,
                            PurchaseEditField::Amount => PurchaseEditField::Name,
                        };
                }
                KeyCode::Char(c) => {
                    // Text input for current purchase field
                    let idx = self.expense_form.selected_purchase;
                    match self.expense_form.purchase_edit_field {
                        PurchaseEditField::Name => {
                            if let Some(purchase) = self.expense_form.purchases.get_mut(idx) {
                                purchase.name.push(c);
                            }
                        }
                        PurchaseEditField::Amount => {
                            if let Some(amount_str) =
                                self.expense_form.purchase_amount_inputs.get_mut(idx)
                            {
                                if c.is_ascii_digit() || (c == '.' && !amount_str.contains('.')) {
                                    amount_str.push(c);
                                }
                            }
                        }
                    }
                }
                KeyCode::Backspace => {
                    let idx = self.expense_form.selected_purchase;
                    match self.expense_form.purchase_edit_field {
                        PurchaseEditField::Name => {
                            if let Some(purchase) = self.expense_form.purchases.get_mut(idx) {
                                purchase.name.pop();
                            }
                        }
                        PurchaseEditField::Amount => {
                            if let Some(amount_str) =
                                self.expense_form.purchase_amount_inputs.get_mut(idx)
                            {
                                amount_str.pop();
                            }
                        }
                    }
                }
                _ => {}
            }
            return;
        }

        // Standard field handling
        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
            }
            KeyCode::Tab => {
                self.expense_form.focused_field = self.expense_form.focused_field.next();
            }
            KeyCode::BackTab => {
                self.expense_form.focused_field = self.expense_form.focused_field.previous();
            }
            KeyCode::Enter => {
                self.save_expense().await;
            }
            KeyCode::Left => {
                // For select fields, cycle through options
                match self.expense_form.focused_field {
                    ExpenseField::Period => {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .periods
                            .iter()
                            .position(|p| p.name == self.expense_form.period)
                        {
                            let new_idx = if current_idx == 0 {
                                self.state.data.periods.len() - 1
                            } else {
                                current_idx - 1
                            };
                            if let Some(period) = self.state.data.periods.get(new_idx) {
                                self.expense_form.period = period.name.clone();
                            }
                        }
                    }
                    ExpenseField::Category => {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .categories
                            .iter()
                            .position(|c| c.name == self.expense_form.category)
                        {
                            let new_idx = if current_idx == 0 {
                                self.state.data.categories.len() - 1
                            } else {
                                current_idx - 1
                            };
                            if let Some(category) = self.state.data.categories.get(new_idx) {
                                self.expense_form.category = category.name.clone();
                            }
                        }
                    }
                    _ => {}
                }
            }
            KeyCode::Right => {
                // For select fields, cycle through options
                match self.expense_form.focused_field {
                    ExpenseField::Period => {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .periods
                            .iter()
                            .position(|p| p.name == self.expense_form.period)
                        {
                            let new_idx = (current_idx + 1) % self.state.data.periods.len();
                            if let Some(period) = self.state.data.periods.get(new_idx) {
                                self.expense_form.period = period.name.clone();
                            }
                        }
                    }
                    ExpenseField::Category => {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .categories
                            .iter()
                            .position(|c| c.name == self.expense_form.category)
                        {
                            let new_idx = (current_idx + 1) % self.state.data.categories.len();
                            if let Some(category) = self.state.data.categories.get(new_idx) {
                                self.expense_form.category = category.name.clone();
                            }
                        }
                    }
                    _ => {}
                }
            }
            KeyCode::Char(c) => {
                // Text input for text fields
                match self.expense_form.focused_field {
                    ExpenseField::Name => {
                        self.expense_form.name.push(c);
                    }
                    ExpenseField::Budget => {
                        if c.is_ascii_digit()
                            || (c == '.' && !self.expense_form.budget.contains('.'))
                        {
                            self.expense_form.budget.push(c);
                        }
                    }
                    ExpenseField::Notes => {
                        self.expense_form.notes.push(c);
                    }
                    _ => {}
                }
            }
            KeyCode::Backspace => match self.expense_form.focused_field {
                ExpenseField::Name => {
                    self.expense_form.name.pop();
                }
                ExpenseField::Budget => {
                    self.expense_form.budget.pop();
                }
                ExpenseField::Notes => {
                    self.expense_form.notes.pop();
                }
                _ => {}
            },
            _ => {}
        }
    }

    /// Handle income form keys
    async fn handle_income_form_key(&mut self, key: KeyEvent) {
        use crate::state::forms::IncomeField;

        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
            }
            KeyCode::Tab => {
                self.income_form.focused_field = self.income_form.focused_field.next();
            }
            KeyCode::BackTab => {
                self.income_form.focused_field = self.income_form.focused_field.previous();
            }
            KeyCode::Enter => {
                self.save_income().await;
            }
            KeyCode::Left => match self.income_form.focused_field {
                IncomeField::IncomeType => {
                    if let Some(current_id) = self.income_form.income_type_id {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .income_types
                            .iter()
                            .position(|it| it.id == current_id)
                        {
                            let new_idx = if current_idx == 0 {
                                self.state.data.income_types.len() - 1
                            } else {
                                current_idx - 1
                            };
                            if let Some(it) = self.state.data.income_types.get(new_idx) {
                                self.income_form.income_type_id = Some(it.id);
                            }
                        }
                    }
                }
                IncomeField::Period => {
                    if let Some(current_idx) = self
                        .state
                        .data
                        .periods
                        .iter()
                        .position(|p| p.name == self.income_form.period)
                    {
                        let new_idx = if current_idx == 0 {
                            self.state.data.periods.len() - 1
                        } else {
                            current_idx - 1
                        };
                        if let Some(period) = self.state.data.periods.get(new_idx) {
                            self.income_form.period = period.name.clone();
                        }
                    }
                }
                _ => {}
            },
            KeyCode::Right => match self.income_form.focused_field {
                IncomeField::IncomeType => {
                    if let Some(current_id) = self.income_form.income_type_id {
                        if let Some(current_idx) = self
                            .state
                            .data
                            .income_types
                            .iter()
                            .position(|it| it.id == current_id)
                        {
                            let new_idx = (current_idx + 1) % self.state.data.income_types.len();
                            if let Some(it) = self.state.data.income_types.get(new_idx) {
                                self.income_form.income_type_id = Some(it.id);
                            }
                        }
                    }
                }
                IncomeField::Period => {
                    if let Some(current_idx) = self
                        .state
                        .data
                        .periods
                        .iter()
                        .position(|p| p.name == self.income_form.period)
                    {
                        let new_idx = (current_idx + 1) % self.state.data.periods.len();
                        if let Some(period) = self.state.data.periods.get(new_idx) {
                            self.income_form.period = period.name.clone();
                        }
                    }
                }
                _ => {}
            },
            KeyCode::Char(c) => match self.income_form.focused_field {
                IncomeField::Budget => {
                    if c.is_ascii_digit() || (c == '.' && !self.income_form.budget.contains('.')) {
                        self.income_form.budget.push(c);
                    }
                }
                IncomeField::Amount => {
                    if c.is_ascii_digit() || (c == '.' && !self.income_form.amount.contains('.')) {
                        self.income_form.amount.push(c);
                    }
                }
                _ => {}
            },
            KeyCode::Backspace => match self.income_form.focused_field {
                IncomeField::Budget => {
                    self.income_form.budget.pop();
                }
                IncomeField::Amount => {
                    self.income_form.amount.pop();
                }
                _ => {}
            },
            _ => {}
        }
    }

    /// Save expense (create or update)
    async fn save_expense(&mut self) {
        // Validate using form's validate method
        let errors = self.expense_form.validate();
        if !errors.is_empty() {
            self.state.set_error(errors.join(", "));
            return;
        }

        let month_id = match self.state.selected_month_id() {
            Some(id) => id,
            None => {
                self.state.set_error("No month selected");
                return;
            }
        };

        self.state.ui.is_loading = true;

        let result = if let Some(id) = self.expense_form.editing_id {
            // Update existing expense using form's to_update method
            match self.expense_form.to_update() {
                Some(update) => self.api.expenses().update(id, &update).await,
                None => {
                    self.state.ui.is_loading = false;
                    self.state.set_error("Invalid expense data");
                    return;
                }
            }
        } else {
            // Create new expense using form's to_create method
            match self.expense_form.to_create(month_id) {
                Some(create) => self.api.expenses().create(&create).await,
                None => {
                    self.state.ui.is_loading = false;
                    self.state.set_error("Invalid expense data");
                    return;
                }
            }
        };

        let was_editing = self.expense_form.editing_id.is_some();

        self.state.ui.is_loading = false;
        self.state.ui.modal = None;
        self.expense_form = ExpenseFormState::default();

        match result {
            Ok(_) => {
                let action = if was_editing { "updated" } else { "created" };
                self.state
                    .set_success(format!("Expense {} successfully", action));
                self.load_tab_data().await;
            }
            Err(e) => {
                self.state
                    .set_error(format!("Failed to save expense: {}", e));
            }
        }
    }

    /// Save income (create or update)
    async fn save_income(&mut self) {
        // Validate
        if self.income_form.income_type_id.is_none() {
            self.state.set_error("Income type is required");
            return;
        }
        if self.income_form.period.is_empty() {
            self.state.set_error("Period is required");
            return;
        }

        let budget: f64 = self.income_form.budget.parse().unwrap_or(0.0);
        let amount: f64 = self.income_form.amount.parse().unwrap_or(0.0);
        let month_id = match self.state.selected_month_id() {
            Some(id) => id,
            None => {
                self.state.set_error("No month selected");
                return;
            }
        };

        self.state.ui.is_loading = true;

        let result = if let Some(id) = self.income_form.editing_id {
            // Update existing income
            let update = crate::models::IncomeUpdate {
                income_type_id: self.income_form.income_type_id,
                period: Some(self.income_form.period.clone()),
                budget: Some(budget),
                amount: Some(amount),
                ..Default::default()
            };
            self.api.incomes().update(id, &update).await
        } else {
            // Create new income
            let create = crate::models::IncomeCreate {
                income_type_id: self.income_form.income_type_id.unwrap(),
                period: self.income_form.period.clone(),
                budget,
                amount,
                month_id,
            };
            self.api.incomes().create(&create).await
        };

        self.state.ui.is_loading = false;
        self.state.ui.modal = None;

        match result {
            Ok(_) => {
                let action = if self.income_form.editing_id.is_some() {
                    "updated"
                } else {
                    "created"
                };
                self.state
                    .set_success(format!("Income {} successfully", action));
                self.load_tab_data().await;
            }
            Err(e) => {
                self.state
                    .set_error(format!("Failed to save income: {}", e));
            }
        }
    }

    /// Handle entity form keys (category, period, income type)
    async fn handle_entity_form_key(&mut self, key: KeyEvent, entity_type: &str) {
        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
            }
            KeyCode::Tab | KeyCode::BackTab => {
                // Toggle between name (0) and color (1) - for now we only focus on name
            }
            KeyCode::Enter => {
                self.save_entity(entity_type).await;
            }
            KeyCode::Char('r') => {
                // Randomize color
                let random_color = generate_random_color();
                match entity_type {
                    "category" => self.category_form.color = random_color,
                    "period" => self.period_form.color = random_color,
                    "income_type" => self.income_type_form.color = random_color,
                    _ => {}
                }
            }
            KeyCode::Char(c) => match entity_type {
                "category" => self.category_form.name.push(c),
                "period" => self.period_form.name.push(c),
                "income_type" => self.income_type_form.name.push(c),
                _ => {}
            },
            KeyCode::Backspace => match entity_type {
                "category" => {
                    self.category_form.name.pop();
                }
                "period" => {
                    self.period_form.name.pop();
                }
                "income_type" => {
                    self.income_type_form.name.pop();
                }
                _ => {}
            },
            _ => {}
        }
    }

    /// Save entity (category, period, income type)
    async fn save_entity(&mut self, entity_type: &str) {
        self.state.ui.is_loading = true;

        let result = match entity_type {
            "category" => {
                if self.category_form.name.trim().is_empty() {
                    self.state.ui.is_loading = false;
                    self.state.set_error("Name is required");
                    return;
                }
                if let Some(id) = self.category_form.editing_id {
                    self.api
                        .categories()
                        .update(id, &self.category_form.to_update())
                        .await
                        .map(|_| ())
                } else {
                    self.api
                        .categories()
                        .create(&self.category_form.to_create())
                        .await
                        .map(|_| ())
                }
            }
            "period" => {
                if self.period_form.name.trim().is_empty() {
                    self.state.ui.is_loading = false;
                    self.state.set_error("Name is required");
                    return;
                }
                if let Some(id) = self.period_form.editing_id {
                    self.api
                        .periods()
                        .update(id, &self.period_form.to_update())
                        .await
                        .map(|_| ())
                } else {
                    self.api
                        .periods()
                        .create(&self.period_form.to_create())
                        .await
                        .map(|_| ())
                }
            }
            "income_type" => {
                if self.income_type_form.name.trim().is_empty() {
                    self.state.ui.is_loading = false;
                    self.state.set_error("Name is required");
                    return;
                }
                if let Some(id) = self.income_type_form.editing_id {
                    self.api
                        .income_types()
                        .update(id, &self.income_type_form.to_update())
                        .await
                        .map(|_| ())
                } else {
                    self.api
                        .income_types()
                        .create(&self.income_type_form.to_create())
                        .await
                        .map(|_| ())
                }
            }
            _ => Ok(()),
        };

        self.state.ui.is_loading = false;
        self.state.ui.modal = None;

        match result {
            Ok(_) => {
                let entity_display = match entity_type {
                    "category" => "Category",
                    "period" => "Period",
                    "income_type" => "Income type",
                    _ => "Entity",
                };
                self.state
                    .set_success(format!("{} saved successfully", entity_display));
                // Reload settings data
                self.load_settings_data().await;
            }
            Err(e) => {
                self.state.set_error(format!("Failed to save: {}", e));
            }
        }
    }

    /// Handle password form keys
    async fn handle_password_form_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
                self.password_form = PasswordFormState::default();
            }
            KeyCode::Tab => {
                self.password_form.focused_field = (self.password_form.focused_field + 1) % 3;
            }
            KeyCode::BackTab => {
                self.password_form.focused_field = if self.password_form.focused_field == 0 {
                    2
                } else {
                    self.password_form.focused_field - 1
                };
            }
            KeyCode::Enter => {
                self.save_password().await;
            }
            KeyCode::Char(c) => match self.password_form.focused_field {
                0 => self.password_form.current_password.push(c),
                1 => self.password_form.new_password.push(c),
                2 => self.password_form.confirm_password.push(c),
                _ => {}
            },
            KeyCode::Backspace => match self.password_form.focused_field {
                0 => {
                    self.password_form.current_password.pop();
                }
                1 => {
                    self.password_form.new_password.pop();
                }
                2 => {
                    self.password_form.confirm_password.pop();
                }
                _ => {}
            },
            _ => {}
        }
    }

    /// Save password
    async fn save_password(&mut self) {
        // Validate
        let errors = self.password_form.validate();
        if !errors.is_empty() {
            self.state.set_error(errors.join(", "));
            return;
        }

        self.state.ui.is_loading = true;

        let result = self
            .api
            .auth()
            .change_password(
                &self.password_form.current_password,
                &self.password_form.new_password,
            )
            .await;

        self.state.ui.is_loading = false;
        self.state.ui.modal = None;
        self.password_form = PasswordFormState::default();

        match result {
            Ok(_) => {
                self.state.set_success("Password changed successfully");
            }
            Err(e) => {
                self.state
                    .set_error(format!("Failed to change password: {}", e));
            }
        }
    }

    /// Load settings data (categories, periods, income types)
    async fn load_settings_data(&mut self) {
        if let Ok(categories) = self.api.categories().get_all().await {
            self.state.data.categories = categories;
        }
        if let Ok(periods) = self.api.periods().get_all().await {
            self.state.data.periods = periods;
        }
        if let Ok(income_types) = self.api.income_types().get_all().await {
            self.state.data.income_types = income_types;
        }
    }

    /// Select next item in current list
    fn select_next_item(&mut self) {
        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                let len = self.state.filtered_expenses().len();
                if len > 0 {
                    let i = self.state.ui.expense_table.selected().unwrap_or(0);
                    let next = if i >= len - 1 { 0 } else { i + 1 };
                    self.state.ui.expense_table.select(Some(next));
                }
            }
            DashboardTab::Income => {
                let len = self.state.filtered_incomes().len();
                if len > 0 {
                    let i = self.state.ui.income_table.selected().unwrap_or(0);
                    let next = if i >= len - 1 { 0 } else { i + 1 };
                    self.state.ui.income_table.select(Some(next));
                }
            }
            DashboardTab::Settings => {
                match self.state.ui.settings_tab {
                    SettingsTab::Categories => {
                        let len = self.state.data.categories.len();
                        if len > 0 {
                            let i = self.state.ui.category_table.selected().unwrap_or(0);
                            let next = if i >= len - 1 { 0 } else { i + 1 };
                            self.state.ui.category_table.select(Some(next));
                        }
                    }
                    SettingsTab::Periods => {
                        let len = self.state.data.periods.len();
                        if len > 0 {
                            let i = self.state.ui.period_table.selected().unwrap_or(0);
                            let next = if i >= len - 1 { 0 } else { i + 1 };
                            self.state.ui.period_table.select(Some(next));
                        }
                    }
                    SettingsTab::IncomeTypes => {
                        let len = self.state.data.income_types.len();
                        if len > 0 {
                            let i = self.state.ui.income_type_table.selected().unwrap_or(0);
                            let next = if i >= len - 1 { 0 } else { i + 1 };
                            self.state.ui.income_type_table.select(Some(next));
                        }
                    }
                    _ => {
                        // Switch settings sub-tab
                        self.state.ui.settings_tab = self.state.ui.settings_tab.next();
                    }
                }
            }
            _ => {}
        }
    }

    /// Select previous item in current list
    fn select_previous_item(&mut self) {
        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                let len = self.state.filtered_expenses().len();
                if len > 0 {
                    let i = self.state.ui.expense_table.selected().unwrap_or(0);
                    let prev = if i == 0 { len - 1 } else { i - 1 };
                    self.state.ui.expense_table.select(Some(prev));
                }
            }
            DashboardTab::Income => {
                let len = self.state.filtered_incomes().len();
                if len > 0 {
                    let i = self.state.ui.income_table.selected().unwrap_or(0);
                    let prev = if i == 0 { len - 1 } else { i - 1 };
                    self.state.ui.income_table.select(Some(prev));
                }
            }
            DashboardTab::Settings => match self.state.ui.settings_tab {
                SettingsTab::Categories => {
                    let len = self.state.data.categories.len();
                    if len > 0 {
                        let i = self.state.ui.category_table.selected().unwrap_or(0);
                        let prev = if i == 0 { len - 1 } else { i - 1 };
                        self.state.ui.category_table.select(Some(prev));
                    }
                }
                SettingsTab::Periods => {
                    let len = self.state.data.periods.len();
                    if len > 0 {
                        let i = self.state.ui.period_table.selected().unwrap_or(0);
                        let prev = if i == 0 { len - 1 } else { i - 1 };
                        self.state.ui.period_table.select(Some(prev));
                    }
                }
                SettingsTab::IncomeTypes => {
                    let len = self.state.data.income_types.len();
                    if len > 0 {
                        let i = self.state.ui.income_type_table.selected().unwrap_or(0);
                        let prev = if i == 0 { len - 1 } else { i - 1 };
                        self.state.ui.income_type_table.select(Some(prev));
                    }
                }
                _ => {
                    self.state.ui.settings_tab = self.state.ui.settings_tab.previous();
                }
            },
            _ => {}
        }
    }

    /// Check if the selected month is closed
    fn is_month_closed(&self) -> bool {
        self.state
            .selected_month()
            .map(|m| m.is_closed)
            .unwrap_or(false)
    }

    /// Open modal for new item
    fn open_new_item_modal(&mut self) {
        // Check if month is closed for expense/income tabs
        if matches!(
            self.state.ui.selected_tab,
            DashboardTab::Expenses | DashboardTab::Income
        ) && self.is_month_closed()
        {
            self.state
                .set_error("Cannot add items to a closed month. Reopen the month first.");
            return;
        }

        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                // Initialize empty expense form
                self.expense_form = ExpenseFormState::default();
                // Set default period and category if available
                if let Some(period) = self.state.data.periods.first() {
                    self.expense_form.period = period.name.clone();
                }
                if let Some(category) = self.state.data.categories.first() {
                    self.expense_form.category = category.name.clone();
                }
                self.state.ui.modal = Some(Modal::ExpenseForm { editing: None });
            }
            DashboardTab::Income => {
                // Initialize empty income form
                self.income_form = IncomeFormState::default();
                // Set default period and income type if available
                if let Some(period) = self.state.data.periods.first() {
                    self.income_form.period = period.name.clone();
                }
                if let Some(income_type) = self.state.data.income_types.first() {
                    self.income_form.income_type_id = Some(income_type.id);
                }
                self.state.ui.modal = Some(Modal::IncomeForm { editing: None });
            }
            DashboardTab::Settings => match self.state.ui.settings_tab {
                SettingsTab::Categories => {
                    self.category_form = CategoryFormState::default();
                    self.state.ui.modal = Some(Modal::CategoryForm { editing: None });
                }
                SettingsTab::Periods => {
                    self.period_form = PeriodFormState::default();
                    self.state.ui.modal = Some(Modal::PeriodForm { editing: None });
                }
                SettingsTab::IncomeTypes => {
                    self.income_type_form = IncomeTypeFormState::default();
                    self.state.ui.modal = Some(Modal::IncomeTypeForm { editing: None });
                }
                SettingsTab::Password => {
                    self.password_form = PasswordFormState::default();
                    self.state.ui.modal = Some(Modal::PasswordForm);
                }
            },
            _ => {}
        }
    }

    /// Open modal for editing selected item
    fn open_edit_item_modal(&mut self) {
        // Check if month is closed for expense/income tabs
        if matches!(
            self.state.ui.selected_tab,
            DashboardTab::Expenses | DashboardTab::Income
        ) && self.is_month_closed()
        {
            self.state
                .set_error("Cannot edit items in a closed month. Reopen the month first.");
            return;
        }

        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                if let Some(idx) = self.state.ui.expense_table.selected() {
                    let filtered = self.state.filtered_expenses();
                    if let Some(expense) = filtered.get(idx) {
                        // Initialize form from existing expense
                        self.expense_form = ExpenseFormState::from_expense(expense);
                        self.state.ui.modal = Some(Modal::ExpenseForm {
                            editing: Some((*expense).clone()),
                        });
                    }
                }
            }
            DashboardTab::Income => {
                if let Some(idx) = self.state.ui.income_table.selected() {
                    let filtered = self.state.filtered_incomes();
                    if let Some(income) = filtered.get(idx) {
                        // Initialize form from existing income
                        self.income_form = IncomeFormState::from_income(income);
                        self.state.ui.modal = Some(Modal::IncomeForm {
                            editing: Some((*income).clone()),
                        });
                    }
                }
            }
            DashboardTab::Settings => match self.state.ui.settings_tab {
                SettingsTab::Categories => {
                    if let Some(idx) = self.state.ui.category_table.selected() {
                        if let Some(cat) = self.state.data.categories.get(idx) {
                            self.category_form = CategoryFormState::from_category(cat);
                            self.state.ui.modal = Some(Modal::CategoryForm {
                                editing: Some(cat.clone()),
                            });
                        }
                    }
                }
                SettingsTab::Periods => {
                    if let Some(idx) = self.state.ui.period_table.selected() {
                        if let Some(period) = self.state.data.periods.get(idx) {
                            self.period_form = PeriodFormState::from_period(period);
                            self.state.ui.modal = Some(Modal::PeriodForm {
                                editing: Some(period.clone()),
                            });
                        }
                    }
                }
                SettingsTab::IncomeTypes => {
                    if let Some(idx) = self.state.ui.income_type_table.selected() {
                        if let Some(it) = self.state.data.income_types.get(idx) {
                            self.income_type_form = IncomeTypeFormState::from_income_type(it);
                            self.state.ui.modal = Some(Modal::IncomeTypeForm {
                                editing: Some(it.clone()),
                            });
                        }
                    }
                }
                SettingsTab::Password => {
                    self.password_form = PasswordFormState::default();
                    self.state.ui.modal = Some(Modal::PasswordForm);
                }
            },
            _ => {}
        }
    }

    /// Open delete confirmation dialog
    fn open_delete_confirmation(&mut self) {
        use crate::state::EntityType;

        // Check if month is closed for expense/income tabs
        if matches!(
            self.state.ui.selected_tab,
            DashboardTab::Expenses | DashboardTab::Income
        ) && self.is_month_closed()
        {
            self.state
                .set_error("Cannot delete items in a closed month. Reopen the month first.");
            return;
        }

        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                if let Some(idx) = self.state.ui.expense_table.selected() {
                    let filtered = self.state.filtered_expenses();
                    if let Some(expense) = filtered.get(idx) {
                        self.state.ui.modal = Some(Modal::ConfirmDelete {
                            message: format!("Delete expense '{}'?", expense.expense_name),
                            id: expense.id,
                            entity_type: EntityType::Expense,
                        });
                    }
                }
            }
            DashboardTab::Income => {
                if let Some(idx) = self.state.ui.income_table.selected() {
                    let filtered = self.state.filtered_incomes();
                    if let Some(income) = filtered.get(idx) {
                        self.state.ui.modal = Some(Modal::ConfirmDelete {
                            message: "Delete this income entry?".to_string(),
                            id: income.id,
                            entity_type: EntityType::Income,
                        });
                    }
                }
            }
            DashboardTab::Settings => match self.state.ui.settings_tab {
                SettingsTab::Categories => {
                    if let Some(idx) = self.state.ui.category_table.selected() {
                        if let Some(cat) = self.state.data.categories.get(idx) {
                            self.state.ui.modal = Some(Modal::ConfirmDelete {
                                message: format!("Delete category '{}'?", cat.name),
                                id: cat.id,
                                entity_type: EntityType::Category,
                            });
                        }
                    }
                }
                SettingsTab::Periods => {
                    if let Some(idx) = self.state.ui.period_table.selected() {
                        if let Some(period) = self.state.data.periods.get(idx) {
                            self.state.ui.modal = Some(Modal::ConfirmDelete {
                                message: format!("Delete period '{}'?", period.name),
                                id: period.id,
                                entity_type: EntityType::Period,
                            });
                        }
                    }
                }
                SettingsTab::IncomeTypes => {
                    if let Some(idx) = self.state.ui.income_type_table.selected() {
                        if let Some(it) = self.state.data.income_types.get(idx) {
                            self.state.ui.modal = Some(Modal::ConfirmDelete {
                                message: format!("Delete income type '{}'?", it.name),
                                id: it.id,
                                entity_type: EntityType::IncomeType,
                            });
                        }
                    }
                }
                _ => {}
            },
            _ => {}
        }
    }

    /// Confirm and execute delete
    async fn confirm_delete(&mut self) {
        use crate::state::EntityType;

        if let Some(Modal::ConfirmDelete {
            id, entity_type, ..
        }) = &self.state.ui.modal
        {
            let id = *id;
            let entity_type = *entity_type;

            self.state.ui.is_loading = true;

            let result = match entity_type {
                EntityType::Expense => self.api.expenses().delete(id).await,
                EntityType::Income => self.api.incomes().delete(id).await,
                EntityType::Category => self.api.categories().delete(id).await,
                EntityType::Period => self.api.periods().delete(id).await,
                EntityType::IncomeType => self.api.income_types().delete(id).await,
            };

            self.state.ui.is_loading = false;
            self.state.ui.modal = None;

            match result {
                Ok(_) => {
                    self.state.set_success("Item deleted successfully");
                    self.load_tab_data().await;
                }
                Err(e) => {
                    self.state.set_error(format!("Failed to delete: {}", e));
                }
            }
        }
    }

    /// Open pay confirmation dialog for an expense
    fn open_pay_confirmation(&mut self) {
        // Only available in Expenses tab
        if self.state.ui.selected_tab != DashboardTab::Expenses {
            return;
        }

        // Check if month is closed
        if self.is_month_closed() {
            self.state
                .set_error("Cannot pay expenses in a closed month. Reopen the month first.");
            return;
        }

        if let Some(idx) = self.state.ui.expense_table.selected() {
            let filtered = self.state.filtered_expenses();
            if let Some(expense) = filtered.get(idx) {
                // Don't show pay option if expense already has purchases
                if expense.purchases.as_ref().is_some_and(|p| !p.is_empty()) {
                    self.state.set_error("Expense already has purchases");
                    return;
                }

                self.state.ui.modal = Some(Modal::ConfirmPay {
                    expense_name: expense.expense_name.clone(),
                    expense_id: expense.id,
                    amount: expense.budget,
                    amount_input: format!("{:.2}", expense.budget),
                });
            }
        }
    }

    /// Confirm and execute pay
    async fn confirm_pay(&mut self) {
        if let Some(Modal::ConfirmPay {
            expense_id,
            amount_input,
            ..
        }) = &self.state.ui.modal
        {
            let id = *expense_id;
            let amount: f64 = amount_input.parse().unwrap_or(0.0);

            self.state.ui.is_loading = true;

            let request = crate::models::PayExpenseRequest {
                amount: Some(amount),
            };
            let result = self.api.expenses().pay(id, Some(&request)).await;

            self.state.ui.is_loading = false;
            self.state.ui.modal = None;

            match result {
                Ok(_) => {
                    self.state
                        .set_success(format!("Payment of ${:.2} added successfully", amount));
                    self.load_tab_data().await;
                }
                Err(e) => {
                    self.state.set_error(format!("Failed to pay: {}", e));
                }
            }
        }
    }

    /// Open close/open month confirmation dialog
    fn open_close_month_confirmation(&mut self) {
        if let Some(month) = self.state.selected_month() {
            self.state.ui.modal = Some(Modal::ConfirmCloseMonth {
                month_name: month.display_name(),
                month_id: month.id,
                is_closing: !month.is_closed,
            });
        }
    }

    /// Confirm and execute close/open month
    async fn confirm_close_month(&mut self) {
        if let Some(Modal::ConfirmCloseMonth {
            month_id,
            is_closing,
            ..
        }) = &self.state.ui.modal
        {
            let id = *month_id;
            let closing = *is_closing;

            self.state.ui.is_loading = true;

            let result = if closing {
                self.api.months().close(id).await
            } else {
                self.api.months().open(id).await
            };

            self.state.ui.is_loading = false;
            self.state.ui.modal = None;

            match result {
                Ok(_) => {
                    let action = if closing { "closed" } else { "reopened" };
                    self.state
                        .set_success(format!("Month {} successfully", action));
                    // Reload months to update the is_closed status
                    if let Ok(months) = self.api.months().get_all().await {
                        self.state.data.months = months;
                    }
                }
                Err(e) => {
                    let action = if closing { "close" } else { "reopen" };
                    self.state
                        .set_error(format!("Failed to {} month: {}", action, e));
                }
            }
        }
    }

    /// Load initial data after login
    async fn load_initial_data(&mut self) {
        self.state.ui.is_loading = true;

        // Load months
        if let Ok(months) = self.api.months().get_all().await {
            self.state.data.months = months;
        }

        // Get current month
        if let Ok(current) = self.api.months().get_current().await {
            self.state.data.current_month = Some(current);
            self.state.select_current_month();
        }

        // Load categories, periods, income types
        if let Ok(categories) = self.api.categories().get_all().await {
            self.state.data.categories = categories;
        }
        if let Ok(periods) = self.api.periods().get_all().await {
            self.state.data.periods = periods;
        }
        if let Ok(income_types) = self.api.income_types().get_all().await {
            self.state.data.income_types = income_types;
        }

        // Load data for current month
        self.load_month_data().await;

        self.state.ui.is_loading = false;
    }

    /// Load data for the selected month
    async fn load_month_data(&mut self) {
        let month_id = self.state.selected_month_id();

        // Load expenses
        let filters = ExpenseFilters {
            month_id,
            ..Default::default()
        };
        if let Ok(expenses) = self.api.expenses().get_all(&filters).await {
            self.state.data.expenses = expenses;
        }

        // Load incomes
        let income_filters = crate::models::IncomeFilters {
            month_id,
            ..Default::default()
        };
        if let Ok(incomes) = self.api.incomes().get_all(&income_filters).await {
            self.state.data.incomes = incomes;
        }

        // Load summary
        if let Ok(totals) = self.api.summary().get_totals(None, month_id).await {
            self.state.data.summary_totals = Some(totals);
        }

        // Load category summary
        if let Ok(summary) = self.api.categories().get_summary(month_id).await {
            self.state.data.category_summary = summary;
        }

        // Load income type summary
        if let Ok(summary) = self.api.income_types().get_summary(None, month_id).await {
            self.state.data.income_type_summary = summary;
        }

        // Load period summary
        if let Ok(summary) = self.api.summary().get_by_period(month_id).await {
            self.state.data.period_summary = Some(summary);
        }
    }

    /// Load data for current tab
    async fn load_tab_data(&mut self) {
        match self.state.ui.selected_tab {
            DashboardTab::Summary => {
                self.load_month_data().await;
            }
            DashboardTab::Expenses => {
                let filters = ExpenseFilters {
                    month_id: self.state.selected_month_id(),
                    period: self.state.ui.period_filter.clone(),
                    category: self.state.ui.category_filter.clone(),
                };
                if let Ok(expenses) = self.api.expenses().get_all(&filters).await {
                    self.state.data.expenses = expenses;
                }
            }
            DashboardTab::Income => {
                let filters = crate::models::IncomeFilters {
                    month_id: self.state.selected_month_id(),
                    period: self.state.ui.period_filter.clone(),
                    ..Default::default()
                };
                if let Ok(incomes) = self.api.incomes().get_all(&filters).await {
                    self.state.data.incomes = incomes;
                }
            }
            DashboardTab::Charts => {
                // Charts use same data as summary
                self.load_month_data().await;
            }
            DashboardTab::Settings => {
                // Reload settings data
                if let Ok(categories) = self.api.categories().get_all().await {
                    self.state.data.categories = categories;
                }
                if let Ok(periods) = self.api.periods().get_all().await {
                    self.state.data.periods = periods;
                }
                if let Ok(income_types) = self.api.income_types().get_all().await {
                    self.state.data.income_types = income_types;
                }
            }
        }
    }
}

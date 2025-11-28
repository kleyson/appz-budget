use anyhow::Result;
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::{backend::CrosstermBackend, Terminal};
use std::io::Stdout;

use crate::api::ApiClient;
use crate::config::Config;
use crate::event::{Event, EventHandler};
use crate::models::ExpenseFilters;
use crate::state::{AppState, DashboardTab, Modal, Screen, SettingsTab};
use crate::ui;
use crate::ui::api_config::{self, ApiConfigField};
use crate::ui::login::{self, LoginField};

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
                ui::render(&self.state, frame);
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
            _ => {}
        }
    }

    /// Handle modal keys
    async fn handle_modal_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Esc => {
                self.state.ui.modal = None;
            }
            KeyCode::Char('y') => {
                if matches!(self.state.ui.modal, Some(Modal::ConfirmDelete { .. })) {
                    self.confirm_delete().await;
                }
            }
            KeyCode::Char('n') => {
                if matches!(self.state.ui.modal, Some(Modal::ConfirmDelete { .. })) {
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

    /// Open modal for new item
    fn open_new_item_modal(&mut self) {
        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                self.state.ui.modal = Some(Modal::ExpenseForm { editing: None });
            }
            DashboardTab::Income => {
                self.state.ui.modal = Some(Modal::IncomeForm { editing: None });
            }
            DashboardTab::Settings => match self.state.ui.settings_tab {
                SettingsTab::Categories => {
                    self.state.ui.modal = Some(Modal::CategoryForm { editing: None });
                }
                SettingsTab::Periods => {
                    self.state.ui.modal = Some(Modal::PeriodForm { editing: None });
                }
                SettingsTab::IncomeTypes => {
                    self.state.ui.modal = Some(Modal::IncomeTypeForm { editing: None });
                }
                SettingsTab::Password => {
                    self.state.ui.modal = Some(Modal::PasswordForm);
                }
            },
            _ => {}
        }
    }

    /// Open modal for editing selected item
    fn open_edit_item_modal(&mut self) {
        match self.state.ui.selected_tab {
            DashboardTab::Expenses => {
                if let Some(idx) = self.state.ui.expense_table.selected() {
                    let filtered = self.state.filtered_expenses();
                    if let Some(expense) = filtered.get(idx) {
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
                            self.state.ui.modal = Some(Modal::CategoryForm {
                                editing: Some(cat.clone()),
                            });
                        }
                    }
                }
                SettingsTab::Periods => {
                    if let Some(idx) = self.state.ui.period_table.selected() {
                        if let Some(period) = self.state.data.periods.get(idx) {
                            self.state.ui.modal = Some(Modal::PeriodForm {
                                editing: Some(period.clone()),
                            });
                        }
                    }
                }
                SettingsTab::IncomeTypes => {
                    if let Some(idx) = self.state.ui.income_type_table.selected() {
                        if let Some(it) = self.state.data.income_types.get(idx) {
                            self.state.ui.modal = Some(Modal::IncomeTypeForm {
                                editing: Some(it.clone()),
                            });
                        }
                    }
                }
                SettingsTab::Password => {
                    self.state.ui.modal = Some(Modal::PasswordForm);
                }
            },
            _ => {}
        }
    }

    /// Open delete confirmation dialog
    fn open_delete_confirmation(&mut self) {
        use crate::state::EntityType;

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

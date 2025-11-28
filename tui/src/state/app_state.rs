use ratatui::widgets::TableState;

use crate::models::{
    Category, CategorySummary, Expense, Income, IncomeType, IncomeTypeSummary, Month, Period,
    SummaryTotals, User,
};

/// Current screen/view
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Screen {
    Login,
    ApiConfig,
    Dashboard,
}

/// Dashboard tabs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DashboardTab {
    Summary,
    Expenses,
    Income,
    Charts,
    Settings,
}

impl DashboardTab {
    pub fn all() -> &'static [DashboardTab] {
        &[
            DashboardTab::Summary,
            DashboardTab::Expenses,
            DashboardTab::Income,
            DashboardTab::Charts,
            DashboardTab::Settings,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            DashboardTab::Summary => "Summary",
            DashboardTab::Expenses => "Expenses",
            DashboardTab::Income => "Income",
            DashboardTab::Charts => "Charts",
            DashboardTab::Settings => "Settings",
        }
    }

    pub fn index(&self) -> usize {
        match self {
            DashboardTab::Summary => 0,
            DashboardTab::Expenses => 1,
            DashboardTab::Income => 2,
            DashboardTab::Charts => 3,
            DashboardTab::Settings => 4,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => DashboardTab::Summary,
            1 => DashboardTab::Expenses,
            2 => DashboardTab::Income,
            3 => DashboardTab::Charts,
            4 => DashboardTab::Settings,
            _ => DashboardTab::Summary,
        }
    }

    pub fn next(&self) -> Self {
        let tabs = Self::all();
        let idx = (self.index() + 1) % tabs.len();
        tabs[idx]
    }

    pub fn previous(&self) -> Self {
        let tabs = Self::all();
        let idx = if self.index() == 0 {
            tabs.len() - 1
        } else {
            self.index() - 1
        };
        tabs[idx]
    }
}

/// Settings sub-tabs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SettingsTab {
    Categories,
    Periods,
    IncomeTypes,
    Password,
}

impl SettingsTab {
    pub fn all() -> &'static [SettingsTab] {
        &[
            SettingsTab::Categories,
            SettingsTab::Periods,
            SettingsTab::IncomeTypes,
            SettingsTab::Password,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            SettingsTab::Categories => "Categories",
            SettingsTab::Periods => "Periods",
            SettingsTab::IncomeTypes => "Income Types",
            SettingsTab::Password => "Password",
        }
    }

    pub fn index(&self) -> usize {
        match self {
            SettingsTab::Categories => 0,
            SettingsTab::Periods => 1,
            SettingsTab::IncomeTypes => 2,
            SettingsTab::Password => 3,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => SettingsTab::Categories,
            1 => SettingsTab::Periods,
            2 => SettingsTab::IncomeTypes,
            3 => SettingsTab::Password,
            _ => SettingsTab::Categories,
        }
    }

    pub fn next(&self) -> Self {
        let tabs = Self::all();
        let idx = (self.index() + 1) % tabs.len();
        tabs[idx]
    }

    pub fn previous(&self) -> Self {
        let tabs = Self::all();
        let idx = if self.index() == 0 {
            tabs.len() - 1
        } else {
            self.index() - 1
        };
        tabs[idx]
    }
}

/// Input mode for text fields
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputMode {
    Normal,
    Editing,
}

/// Modal types
#[derive(Debug, Clone, PartialEq)]
pub enum Modal {
    ExpenseForm {
        editing: Option<Expense>,
    },
    IncomeForm {
        editing: Option<Income>,
    },
    CategoryForm {
        editing: Option<Category>,
    },
    PeriodForm {
        editing: Option<Period>,
    },
    IncomeTypeForm {
        editing: Option<IncomeType>,
    },
    PasswordForm,
    ConfirmDelete {
        message: String,
        id: i32,
        entity_type: EntityType,
    },
    Help,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntityType {
    Expense,
    Income,
    Category,
    Period,
    IncomeType,
}

/// Cached data from the API
#[derive(Debug, Default)]
pub struct DataState {
    pub expenses: Vec<Expense>,
    pub incomes: Vec<Income>,
    pub categories: Vec<Category>,
    pub periods: Vec<Period>,
    pub income_types: Vec<IncomeType>,
    pub months: Vec<Month>,
    pub current_month: Option<Month>,
    pub summary_totals: Option<SummaryTotals>,
    pub category_summary: Vec<CategorySummary>,
    pub income_type_summary: Vec<IncomeTypeSummary>,
}

/// UI-specific state
#[derive(Debug)]
pub struct UIState {
    // Current selections
    pub selected_month_index: usize,
    pub selected_tab: DashboardTab,
    pub settings_tab: SettingsTab,

    // Filters
    pub period_filter: Option<String>,
    pub category_filter: Option<String>,

    // Table states
    pub expense_table: TableState,
    pub income_table: TableState,
    pub category_table: TableState,
    pub period_table: TableState,
    pub income_type_table: TableState,
    pub category_summary_table: TableState,

    // Modal
    pub modal: Option<Modal>,

    // Input mode
    pub input_mode: InputMode,

    // Loading and errors
    pub is_loading: bool,
    pub error_message: Option<String>,
    pub success_message: Option<String>,
}

impl Default for UIState {
    fn default() -> Self {
        Self {
            selected_month_index: 0,
            selected_tab: DashboardTab::Summary,
            settings_tab: SettingsTab::Categories,
            period_filter: None,
            category_filter: None,
            expense_table: TableState::default(),
            income_table: TableState::default(),
            category_table: TableState::default(),
            period_table: TableState::default(),
            income_type_table: TableState::default(),
            category_summary_table: TableState::default(),
            modal: None,
            input_mode: InputMode::Normal,
            is_loading: false,
            error_message: None,
            success_message: None,
        }
    }
}

/// Complete application state
#[derive(Debug)]
pub struct AppState {
    pub screen: Screen,
    pub user: Option<User>,
    pub data: DataState,
    pub ui: UIState,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            screen: Screen::Login,
            user: None,
            data: DataState::default(),
            ui: UIState::default(),
        }
    }
}

impl AppState {
    /// Get the currently selected month
    pub fn selected_month(&self) -> Option<&Month> {
        self.data.months.get(self.ui.selected_month_index)
    }

    /// Get the selected month ID
    pub fn selected_month_id(&self) -> Option<i32> {
        self.selected_month().map(|m| m.id)
    }

    /// Select next month
    pub fn next_month(&mut self) {
        if !self.data.months.is_empty() && self.ui.selected_month_index < self.data.months.len() - 1
        {
            self.ui.selected_month_index += 1;
        }
    }

    /// Select previous month
    pub fn previous_month(&mut self) {
        if self.ui.selected_month_index > 0 {
            self.ui.selected_month_index -= 1;
        }
    }

    /// Set the current month as selected
    pub fn select_current_month(&mut self) {
        if let Some(current) = &self.data.current_month {
            for (i, month) in self.data.months.iter().enumerate() {
                if month.id == current.id {
                    self.ui.selected_month_index = i;
                    break;
                }
            }
        }
    }

    /// Get filtered expenses
    pub fn filtered_expenses(&self) -> Vec<&Expense> {
        self.data
            .expenses
            .iter()
            .filter(|e| {
                let period_match = self
                    .ui
                    .period_filter
                    .as_ref()
                    .is_none_or(|p| &e.period == p);
                let category_match = self
                    .ui
                    .category_filter
                    .as_ref()
                    .is_none_or(|c| &e.category == c);
                period_match && category_match
            })
            .collect()
    }

    /// Get filtered incomes
    pub fn filtered_incomes(&self) -> Vec<&Income> {
        self.data
            .incomes
            .iter()
            .filter(|i| {
                self.ui
                    .period_filter
                    .as_ref()
                    .is_none_or(|p| &i.period == p)
            })
            .collect()
    }

    /// Clear messages after displaying
    pub fn clear_messages(&mut self) {
        self.ui.error_message = None;
        self.ui.success_message = None;
    }

    /// Set error message
    pub fn set_error(&mut self, message: impl Into<String>) {
        self.ui.error_message = Some(message.into());
        self.ui.success_message = None;
    }

    /// Set success message
    pub fn set_success(&mut self, message: impl Into<String>) {
        self.ui.success_message = Some(message.into());
        self.ui.error_message = None;
    }
}

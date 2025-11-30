//! State management tests for the Budget TUI application

use budget_tui::models::{Expense, Income, Month};
use budget_tui::state::{
    AppState, DashboardTab, EntityType, InputMode, Modal, Screen, SettingsTab,
};

#[test]
fn test_screen_enum() {
    let login = Screen::Login;
    let dashboard = Screen::Dashboard;

    assert_eq!(login, Screen::Login);
    assert_eq!(dashboard, Screen::Dashboard);
    assert_ne!(login, dashboard);
}

#[test]
fn test_dashboard_tab_all() {
    let tabs = DashboardTab::all();
    assert_eq!(tabs.len(), 5);
    assert_eq!(tabs[0], DashboardTab::Summary);
    assert_eq!(tabs[1], DashboardTab::Expenses);
    assert_eq!(tabs[2], DashboardTab::Income);
    assert_eq!(tabs[3], DashboardTab::Charts);
    assert_eq!(tabs[4], DashboardTab::Settings);
}

#[test]
fn test_dashboard_tab_as_str() {
    assert_eq!(DashboardTab::Summary.as_str(), "Summary");
    assert_eq!(DashboardTab::Expenses.as_str(), "Expenses");
    assert_eq!(DashboardTab::Income.as_str(), "Income");
    assert_eq!(DashboardTab::Charts.as_str(), "Charts");
    assert_eq!(DashboardTab::Settings.as_str(), "Settings");
}

#[test]
fn test_dashboard_tab_index() {
    assert_eq!(DashboardTab::Summary.index(), 0);
    assert_eq!(DashboardTab::Expenses.index(), 1);
    assert_eq!(DashboardTab::Income.index(), 2);
    assert_eq!(DashboardTab::Charts.index(), 3);
    assert_eq!(DashboardTab::Settings.index(), 4);
}

#[test]
fn test_dashboard_tab_from_index() {
    assert_eq!(DashboardTab::from_index(0), DashboardTab::Summary);
    assert_eq!(DashboardTab::from_index(1), DashboardTab::Expenses);
    assert_eq!(DashboardTab::from_index(2), DashboardTab::Income);
    assert_eq!(DashboardTab::from_index(3), DashboardTab::Charts);
    assert_eq!(DashboardTab::from_index(4), DashboardTab::Settings);
    // Out of bounds defaults to Summary
    assert_eq!(DashboardTab::from_index(99), DashboardTab::Summary);
}

#[test]
fn test_dashboard_tab_next() {
    assert_eq!(DashboardTab::Summary.next(), DashboardTab::Expenses);
    assert_eq!(DashboardTab::Expenses.next(), DashboardTab::Income);
    assert_eq!(DashboardTab::Income.next(), DashboardTab::Charts);
    assert_eq!(DashboardTab::Charts.next(), DashboardTab::Settings);
    // Wraps around
    assert_eq!(DashboardTab::Settings.next(), DashboardTab::Summary);
}

#[test]
fn test_dashboard_tab_previous() {
    // Wraps around
    assert_eq!(DashboardTab::Summary.previous(), DashboardTab::Settings);
    assert_eq!(DashboardTab::Expenses.previous(), DashboardTab::Summary);
    assert_eq!(DashboardTab::Income.previous(), DashboardTab::Expenses);
    assert_eq!(DashboardTab::Charts.previous(), DashboardTab::Income);
    assert_eq!(DashboardTab::Settings.previous(), DashboardTab::Charts);
}

#[test]
fn test_settings_tab_all() {
    let tabs = SettingsTab::all();
    assert_eq!(tabs.len(), 4);
    assert_eq!(tabs[0], SettingsTab::Categories);
    assert_eq!(tabs[1], SettingsTab::Periods);
    assert_eq!(tabs[2], SettingsTab::IncomeTypes);
    assert_eq!(tabs[3], SettingsTab::Password);
}

#[test]
fn test_settings_tab_as_str() {
    assert_eq!(SettingsTab::Categories.as_str(), "Categories");
    assert_eq!(SettingsTab::Periods.as_str(), "Periods");
    assert_eq!(SettingsTab::IncomeTypes.as_str(), "Income Types");
    assert_eq!(SettingsTab::Password.as_str(), "Password");
}

#[test]
fn test_settings_tab_index() {
    assert_eq!(SettingsTab::Categories.index(), 0);
    assert_eq!(SettingsTab::Periods.index(), 1);
    assert_eq!(SettingsTab::IncomeTypes.index(), 2);
    assert_eq!(SettingsTab::Password.index(), 3);
}

#[test]
fn test_settings_tab_from_index() {
    assert_eq!(SettingsTab::from_index(0), SettingsTab::Categories);
    assert_eq!(SettingsTab::from_index(1), SettingsTab::Periods);
    assert_eq!(SettingsTab::from_index(2), SettingsTab::IncomeTypes);
    assert_eq!(SettingsTab::from_index(3), SettingsTab::Password);
    // Out of bounds defaults to Categories
    assert_eq!(SettingsTab::from_index(99), SettingsTab::Categories);
}

#[test]
fn test_settings_tab_next() {
    assert_eq!(SettingsTab::Categories.next(), SettingsTab::Periods);
    assert_eq!(SettingsTab::Periods.next(), SettingsTab::IncomeTypes);
    assert_eq!(SettingsTab::IncomeTypes.next(), SettingsTab::Password);
    // Wraps around
    assert_eq!(SettingsTab::Password.next(), SettingsTab::Categories);
}

#[test]
fn test_settings_tab_previous() {
    // Wraps around
    assert_eq!(SettingsTab::Categories.previous(), SettingsTab::Password);
    assert_eq!(SettingsTab::Periods.previous(), SettingsTab::Categories);
    assert_eq!(SettingsTab::IncomeTypes.previous(), SettingsTab::Periods);
    assert_eq!(SettingsTab::Password.previous(), SettingsTab::IncomeTypes);
}

#[test]
fn test_input_mode() {
    let normal = InputMode::Normal;
    let editing = InputMode::Editing;

    assert_eq!(normal, InputMode::Normal);
    assert_eq!(editing, InputMode::Editing);
    assert_ne!(normal, editing);
}

#[test]
fn test_entity_type() {
    assert_eq!(EntityType::Expense, EntityType::Expense);
    assert_eq!(EntityType::Income, EntityType::Income);
    assert_eq!(EntityType::Category, EntityType::Category);
    assert_eq!(EntityType::Period, EntityType::Period);
    assert_eq!(EntityType::IncomeType, EntityType::IncomeType);
    assert_ne!(EntityType::Expense, EntityType::Income);
}

#[test]
fn test_modal_variants() {
    let help = Modal::Help;
    let password = Modal::PasswordForm;
    let confirm = Modal::ConfirmDelete {
        message: "Delete?".to_string(),
        id: 1,
        entity_type: EntityType::Expense,
    };

    assert_eq!(help, Modal::Help);
    assert_eq!(password, Modal::PasswordForm);

    if let Modal::ConfirmDelete {
        message,
        id,
        entity_type,
    } = confirm
    {
        assert_eq!(message, "Delete?");
        assert_eq!(id, 1);
        assert_eq!(entity_type, EntityType::Expense);
    } else {
        panic!("Expected ConfirmDelete modal");
    }
}

#[test]
fn test_app_state_default() {
    let state = AppState::default();

    assert_eq!(state.screen, Screen::Login);
    assert!(state.user.is_none());
    assert!(state.data.expenses.is_empty());
    assert!(state.data.incomes.is_empty());
    assert!(state.data.categories.is_empty());
    assert!(state.data.periods.is_empty());
    assert!(state.data.income_types.is_empty());
    assert!(state.data.months.is_empty());
    assert!(state.data.current_month.is_none());
    assert_eq!(state.ui.selected_tab, DashboardTab::Summary);
    assert_eq!(state.ui.settings_tab, SettingsTab::Categories);
    assert_eq!(state.ui.input_mode, InputMode::Normal);
    assert!(!state.ui.is_loading);
    assert!(state.ui.error_message.is_none());
    assert!(state.ui.success_message.is_none());
}

#[test]
fn test_app_state_month_navigation() {
    let mut state = AppState::default();

    // Add some months
    state.data.months = vec![
        Month {
            id: 1,
            year: 2024,
            month: 1,
            name: "January 2024".to_string(),
            start_date: "2024-01-01".to_string(),
            end_date: "2024-01-31".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
        Month {
            id: 2,
            year: 2024,
            month: 2,
            name: "February 2024".to_string(),
            start_date: "2024-02-01".to_string(),
            end_date: "2024-02-29".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
        Month {
            id: 3,
            year: 2024,
            month: 3,
            name: "March 2024".to_string(),
            start_date: "2024-03-01".to_string(),
            end_date: "2024-03-31".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
    ];

    // Initial state
    assert_eq!(state.ui.selected_month_index, 0);
    assert_eq!(state.selected_month_id(), Some(1));

    // Navigate forward
    state.next_month();
    assert_eq!(state.ui.selected_month_index, 1);
    assert_eq!(state.selected_month_id(), Some(2));

    state.next_month();
    assert_eq!(state.ui.selected_month_index, 2);
    assert_eq!(state.selected_month_id(), Some(3));

    // At the end, should not go beyond
    state.next_month();
    assert_eq!(state.ui.selected_month_index, 2);

    // Navigate backward
    state.previous_month();
    assert_eq!(state.ui.selected_month_index, 1);

    state.previous_month();
    assert_eq!(state.ui.selected_month_index, 0);

    // At the start, should not go below 0
    state.previous_month();
    assert_eq!(state.ui.selected_month_index, 0);
}

#[test]
fn test_app_state_select_current_month() {
    let mut state = AppState::default();

    state.data.months = vec![
        Month {
            id: 1,
            year: 2024,
            month: 1,
            name: "January 2024".to_string(),
            start_date: "2024-01-01".to_string(),
            end_date: "2024-01-31".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
        Month {
            id: 2,
            year: 2024,
            month: 2,
            name: "February 2024".to_string(),
            start_date: "2024-02-01".to_string(),
            end_date: "2024-02-29".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
        Month {
            id: 3,
            year: 2024,
            month: 3,
            name: "March 2024".to_string(),
            start_date: "2024-03-01".to_string(),
            end_date: "2024-03-31".to_string(),
            is_closed: false,
            closed_at: None,
            closed_by: None,
        },
    ];

    state.data.current_month = Some(Month {
        id: 2,
        year: 2024,
        month: 2,
        name: "February 2024".to_string(),
        start_date: "2024-02-01".to_string(),
        end_date: "2024-02-29".to_string(),
        is_closed: false,
        closed_at: None,
        closed_by: None,
    });

    state.select_current_month();
    assert_eq!(state.ui.selected_month_index, 1);
    assert_eq!(state.selected_month_id(), Some(2));
}

#[test]
fn test_app_state_selected_month_empty() {
    let state = AppState::default();

    assert!(state.selected_month().is_none());
    assert!(state.selected_month_id().is_none());
}

#[test]
fn test_app_state_filtered_expenses() {
    let mut state = AppState::default();

    state.data.expenses = vec![
        Expense {
            id: 1,
            expense_name: "Groceries".to_string(),
            period: "Monthly".to_string(),
            category: "Food".to_string(),
            budget: 500.0,
            cost: 450.0,
            notes: None,
            month_id: 1,
            purchases: None,
            order: 0,
            expense_date: None,
        },
        Expense {
            id: 2,
            expense_name: "Rent".to_string(),
            period: "Monthly".to_string(),
            category: "Housing".to_string(),
            budget: 1500.0,
            cost: 1500.0,
            notes: None,
            month_id: 1,
            purchases: None,
            order: 1,
            expense_date: None,
        },
        Expense {
            id: 3,
            expense_name: "Bus Pass".to_string(),
            period: "Weekly".to_string(),
            category: "Transport".to_string(),
            budget: 100.0,
            cost: 80.0,
            notes: None,
            month_id: 1,
            purchases: None,
            order: 2,
            expense_date: None,
        },
    ];

    // No filters - all expenses
    assert_eq!(state.filtered_expenses().len(), 3);

    // Filter by period
    state.ui.period_filter = Some("Monthly".to_string());
    let filtered = state.filtered_expenses();
    assert_eq!(filtered.len(), 2);
    assert!(filtered.iter().all(|e| e.period == "Monthly"));

    // Filter by category
    state.ui.period_filter = None;
    state.ui.category_filter = Some("Food".to_string());
    let filtered = state.filtered_expenses();
    assert_eq!(filtered.len(), 1);
    assert_eq!(filtered[0].expense_name, "Groceries");

    // Filter by both
    state.ui.period_filter = Some("Monthly".to_string());
    state.ui.category_filter = Some("Housing".to_string());
    let filtered = state.filtered_expenses();
    assert_eq!(filtered.len(), 1);
    assert_eq!(filtered[0].expense_name, "Rent");
}

#[test]
fn test_app_state_filtered_incomes() {
    let mut state = AppState::default();

    state.data.incomes = vec![
        Income {
            id: 1,
            income_type_id: 1,
            period: "Monthly".to_string(),
            budget: 5000.0,
            amount: 4800.0,
            month_id: 1,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
            created_by: None,
            updated_by: None,
        },
        Income {
            id: 2,
            income_type_id: 2,
            period: "Weekly".to_string(),
            budget: 200.0,
            amount: 200.0,
            month_id: 1,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
            created_by: None,
            updated_by: None,
        },
    ];

    // No filters - all incomes
    assert_eq!(state.filtered_incomes().len(), 2);

    // Filter by period
    state.ui.period_filter = Some("Monthly".to_string());
    let filtered = state.filtered_incomes();
    assert_eq!(filtered.len(), 1);
    assert_eq!(filtered[0].id, 1);
}

#[test]
fn test_app_state_messages() {
    let mut state = AppState::default();

    // Set error message
    state.set_error("Something went wrong");
    assert_eq!(
        state.ui.error_message,
        Some("Something went wrong".to_string())
    );
    assert!(state.ui.success_message.is_none());

    // Set success message (clears error)
    state.set_success("Operation successful");
    assert!(state.ui.error_message.is_none());
    assert_eq!(
        state.ui.success_message,
        Some("Operation successful".to_string())
    );

    // Clear all messages
    state.clear_messages();
    assert!(state.ui.error_message.is_none());
    assert!(state.ui.success_message.is_none());
}

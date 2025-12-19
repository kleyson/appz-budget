//! Model tests for the Budget TUI application

use budget_tui::models::{
    Category, CategoryCreate, CategoryUpdate, Expense, ExpenseCreate, ExpenseFilters,
    ExpenseUpdate, Income, IncomeCreate, IncomeFilters, IncomeType, IncomeTypeCreate,
    IncomeTypeUpdate, IncomeUpdate, Month, Period, PeriodCreate, PeriodUpdate, Purchase,
};

#[test]
fn test_expense_serialization() {
    let expense = Expense {
        id: 1,
        expense_name: "Groceries".to_string(),
        period: "Monthly".to_string(),
        category: "Food".to_string(),
        budget: 500.0,
        cost: 450.0,
        notes: Some("Weekly shopping".to_string()),
        month_id: 1,
        purchases: Some(vec![Purchase {
            name: "Walmart".to_string(),
            amount: 150.0,
            date: None,
        }]),
        order: 0,
        expense_date: None,
    };

    let json = serde_json::to_string(&expense).unwrap();
    let deserialized: Expense = serde_json::from_str(&json).unwrap();

    assert_eq!(expense.id, deserialized.id);
    assert_eq!(expense.expense_name, deserialized.expense_name);
    assert_eq!(expense.budget, deserialized.budget);
    assert_eq!(expense.cost, deserialized.cost);
    assert_eq!(expense.notes, deserialized.notes);
}

#[test]
fn test_expense_create_serialization() {
    let create = ExpenseCreate {
        expense_name: "Rent".to_string(),
        period: "Monthly".to_string(),
        category: "Housing".to_string(),
        budget: 1500.0,
        cost: 1500.0,
        notes: None,
        month_id: 1,
        purchases: None,
        expense_date: None,
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"expense_name\":\"Rent\""));
    assert!(json.contains("\"budget\":1500"));
}

#[test]
fn test_expense_update_skip_none() {
    let update = ExpenseUpdate {
        expense_name: Some("Updated Name".to_string()),
        cost: Some(200.0),
        ..Default::default()
    };

    let json = serde_json::to_string(&update).unwrap();
    assert!(json.contains("\"expense_name\":\"Updated Name\""));
    assert!(json.contains("\"cost\":200"));
    // None fields should not be included
    assert!(!json.contains("\"budget\""));
    assert!(!json.contains("\"period\""));
}

#[test]
fn test_expense_filters_to_query_params() {
    let filters = ExpenseFilters {
        period: Some("Monthly".to_string()),
        category: Some("Food".to_string()),
        month_id: Some(1),
    };

    let params = filters.to_query_params();
    assert_eq!(params.len(), 3);
    assert!(params.contains(&("period", "Monthly".to_string())));
    assert!(params.contains(&("category", "Food".to_string())));
    assert!(params.contains(&("month_id", "1".to_string())));
}

#[test]
fn test_expense_filters_empty() {
    let filters = ExpenseFilters::default();
    let params = filters.to_query_params();
    assert!(params.is_empty());
}

#[test]
fn test_income_serialization() {
    let income = Income {
        id: 1,
        income_type_id: 1,
        period: "Monthly".to_string(),
        budget: 5000.0,
        amount: 4800.0,
        month_id: 1,
        created_at: "2024-01-01".to_string(),
        updated_at: "2024-01-01".to_string(),
        created_by: Some("user".to_string()),
        updated_by: None,
    };

    let json = serde_json::to_string(&income).unwrap();
    let deserialized: Income = serde_json::from_str(&json).unwrap();

    assert_eq!(income.id, deserialized.id);
    assert_eq!(income.budget, deserialized.budget);
    assert_eq!(income.amount, deserialized.amount);
}

#[test]
fn test_income_filters_to_query_params() {
    let filters = IncomeFilters {
        period: Some("Monthly".to_string()),
        income_type_id: Some(2),
        month_id: Some(3),
    };

    let params = filters.to_query_params();
    assert_eq!(params.len(), 3);
    assert!(params.contains(&("period", "Monthly".to_string())));
    assert!(params.contains(&("income_type_id", "2".to_string())));
    assert!(params.contains(&("month_id", "3".to_string())));
}

#[test]
fn test_category_serialization() {
    let category = Category {
        id: 1,
        name: "Food".to_string(),
        color: "#FF0000".to_string(),
    };

    let json = serde_json::to_string(&category).unwrap();
    let deserialized: Category = serde_json::from_str(&json).unwrap();

    assert_eq!(category, deserialized);
}

#[test]
fn test_category_create_skip_none_color() {
    let create = CategoryCreate {
        name: "Transport".to_string(),
        color: None,
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"name\":\"Transport\""));
    assert!(!json.contains("\"color\""));
}

#[test]
fn test_category_create_with_color() {
    let create = CategoryCreate {
        name: "Transport".to_string(),
        color: Some("#00FF00".to_string()),
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"color\":\"#00FF00\""));
}

#[test]
fn test_period_serialization() {
    let period = Period {
        id: 1,
        name: "Monthly".to_string(),
        color: "#0000FF".to_string(),
    };

    let json = serde_json::to_string(&period).unwrap();
    let deserialized: Period = serde_json::from_str(&json).unwrap();

    assert_eq!(period, deserialized);
}

#[test]
fn test_income_type_serialization() {
    let income_type = IncomeType {
        id: 1,
        name: "Salary".to_string(),
        color: "#FFFF00".to_string(),
    };

    let json = serde_json::to_string(&income_type).unwrap();
    let deserialized: IncomeType = serde_json::from_str(&json).unwrap();

    assert_eq!(income_type, deserialized);
}

#[test]
fn test_month_serialization() {
    let month = Month {
        id: 1,
        year: 2024,
        month: 1,
        name: "January 2024".to_string(),
        start_date: "2024-01-01".to_string(),
        end_date: "2024-01-31".to_string(),
        is_closed: false,
        closed_at: None,
        closed_by: None,
    };

    let json = serde_json::to_string(&month).unwrap();
    let deserialized: Month = serde_json::from_str(&json).unwrap();

    assert_eq!(month.id, deserialized.id);
    assert_eq!(month.name, deserialized.name);
    assert_eq!(month.year, deserialized.year);
    assert_eq!(month.month, deserialized.month);
}

#[test]
fn test_purchase_serialization() {
    let purchase = Purchase {
        name: "Store A".to_string(),
        amount: 25.50,
        date: None,
    };

    let json = serde_json::to_string(&purchase).unwrap();
    let deserialized: Purchase = serde_json::from_str(&json).unwrap();

    assert_eq!(purchase, deserialized);
}

#[test]
fn test_income_create_serialization() {
    let create = IncomeCreate {
        income_type_id: 1,
        period: "Monthly".to_string(),
        budget: 5000.0,
        amount: 4800.0,
        month_id: 1,
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"income_type_id\":1"));
    assert!(json.contains("\"budget\":5000"));
}

#[test]
fn test_income_update_skip_none() {
    let update = IncomeUpdate {
        amount: Some(5200.0),
        ..Default::default()
    };

    let json = serde_json::to_string(&update).unwrap();
    assert!(json.contains("\"amount\":5200"));
    assert!(!json.contains("\"budget\""));
    assert!(!json.contains("\"period\""));
}

#[test]
fn test_period_create_update() {
    let create = PeriodCreate {
        name: "Weekly".to_string(),
        color: Some("#AABBCC".to_string()),
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"name\":\"Weekly\""));
    assert!(json.contains("\"color\":\"#AABBCC\""));

    let update = PeriodUpdate {
        name: "Bi-Weekly".to_string(),
        color: None,
    };

    let json = serde_json::to_string(&update).unwrap();
    assert!(json.contains("\"name\":\"Bi-Weekly\""));
    assert!(!json.contains("\"color\""));
}

#[test]
fn test_income_type_create_update() {
    let create = IncomeTypeCreate {
        name: "Bonus".to_string(),
        color: None,
    };

    let json = serde_json::to_string(&create).unwrap();
    assert!(json.contains("\"name\":\"Bonus\""));
    assert!(!json.contains("\"color\""));

    let update = IncomeTypeUpdate {
        name: "Annual Bonus".to_string(),
        color: Some("#112233".to_string()),
    };

    let json = serde_json::to_string(&update).unwrap();
    assert!(json.contains("\"name\":\"Annual Bonus\""));
    assert!(json.contains("\"color\":\"#112233\""));
}

#[test]
fn test_category_update() {
    let update = CategoryUpdate {
        name: "Groceries".to_string(),
        color: Some("#ABCDEF".to_string()),
    };

    let json = serde_json::to_string(&update).unwrap();
    assert!(json.contains("\"name\":\"Groceries\""));
    assert!(json.contains("\"color\":\"#ABCDEF\""));
}

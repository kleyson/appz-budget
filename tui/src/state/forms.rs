use crate::models::{
    Category, CategoryCreate, CategoryUpdate, Expense, ExpenseCreate, ExpenseUpdate, Income,
    IncomeCreate, IncomeType, IncomeTypeCreate, IncomeTypeUpdate, IncomeUpdate, Period,
    PeriodCreate, PeriodUpdate, Purchase,
};

/// Form field indices for expense form
/// Note: Cost is not included as it's always calculated from purchases
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExpenseField {
    Name,
    Period,
    Category,
    Budget,
    Purchases,
    Notes,
}

impl ExpenseField {
    pub fn all() -> &'static [ExpenseField] {
        &[
            ExpenseField::Name,
            ExpenseField::Period,
            ExpenseField::Category,
            ExpenseField::Budget,
            ExpenseField::Purchases,
            ExpenseField::Notes,
        ]
    }

    pub fn index(&self) -> usize {
        match self {
            ExpenseField::Name => 0,
            ExpenseField::Period => 1,
            ExpenseField::Category => 2,
            ExpenseField::Budget => 3,
            ExpenseField::Purchases => 4,
            ExpenseField::Notes => 5,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => ExpenseField::Name,
            1 => ExpenseField::Period,
            2 => ExpenseField::Category,
            3 => ExpenseField::Budget,
            4 => ExpenseField::Purchases,
            5 => ExpenseField::Notes,
            _ => ExpenseField::Name,
        }
    }

    pub fn next(&self) -> Self {
        let fields = Self::all();
        let idx = (self.index() + 1) % fields.len();
        fields[idx]
    }

    pub fn previous(&self) -> Self {
        let fields = Self::all();
        let idx = if self.index() == 0 {
            fields.len() - 1
        } else {
            self.index() - 1
        };
        fields[idx]
    }
}

/// Expense form state
#[derive(Debug, Clone)]
pub struct ExpenseFormState {
    pub editing_id: Option<i32>,
    pub name: String,
    pub period: String,
    pub category: String,
    pub budget: String,
    pub cost: String,
    pub notes: String,
    pub purchases: Vec<Purchase>,
    pub focused_field: ExpenseField,
}

impl Default for ExpenseFormState {
    fn default() -> Self {
        Self {
            editing_id: None,
            name: String::new(),
            period: String::new(),
            category: String::new(),
            budget: String::new(),
            cost: "0".to_string(),
            notes: String::new(),
            purchases: Vec::new(),
            focused_field: ExpenseField::Name,
        }
    }
}

impl ExpenseFormState {
    pub fn from_expense(expense: &Expense) -> Self {
        Self {
            editing_id: Some(expense.id),
            name: expense.expense_name.clone(),
            period: expense.period.clone(),
            category: expense.category.clone(),
            budget: expense.budget.to_string(),
            cost: expense.cost.to_string(),
            notes: expense.notes.clone().unwrap_or_default(),
            purchases: expense.purchases.clone().unwrap_or_default(),
            focused_field: ExpenseField::Name,
        }
    }

    /// Calculate cost from purchases (always calculated, never manually editable)
    pub fn calculated_cost(&self) -> f64 {
        self.purchases.iter().map(|p| p.amount).sum()
    }

    pub fn to_create(&self, month_id: i32) -> Option<ExpenseCreate> {
        let budget = self.budget.parse().ok()?;
        let cost = self.calculated_cost();
        Some(ExpenseCreate {
            expense_name: self.name.clone(),
            period: self.period.clone(),
            category: self.category.clone(),
            budget,
            cost,
            notes: if self.notes.is_empty() {
                None
            } else {
                Some(self.notes.clone())
            },
            month_id,
            purchases: if self.purchases.is_empty() {
                None
            } else {
                Some(self.purchases.clone())
            },
            expense_date: None,
        })
    }

    pub fn to_update(&self) -> Option<ExpenseUpdate> {
        let budget = self.budget.parse().ok()?;
        let cost = self.calculated_cost();
        Some(ExpenseUpdate {
            expense_name: Some(self.name.clone()),
            period: Some(self.period.clone()),
            category: Some(self.category.clone()),
            budget: Some(budget),
            cost: Some(cost),
            notes: Some(self.notes.clone()),
            purchases: Some(self.purchases.clone()),
            ..Default::default()
        })
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.name.trim().is_empty() {
            errors.push("Name is required".to_string());
        }
        if self.period.trim().is_empty() {
            errors.push("Period is required".to_string());
        }
        if self.category.trim().is_empty() {
            errors.push("Category is required".to_string());
        }
        if self.budget.parse::<f64>().is_err() {
            errors.push("Budget must be a valid number".to_string());
        }
        if self.purchases.is_empty() {
            errors.push("At least one purchase is required".to_string());
        } else if self.calculated_cost() == 0.0 {
            errors.push("Purchases must have amounts".to_string());
        }
        errors
    }
}

/// Income form field indices
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IncomeField {
    IncomeType,
    Period,
    Budget,
    Amount,
}

impl IncomeField {
    pub fn all() -> &'static [IncomeField] {
        &[
            IncomeField::IncomeType,
            IncomeField::Period,
            IncomeField::Budget,
            IncomeField::Amount,
        ]
    }

    pub fn index(&self) -> usize {
        match self {
            IncomeField::IncomeType => 0,
            IncomeField::Period => 1,
            IncomeField::Budget => 2,
            IncomeField::Amount => 3,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => IncomeField::IncomeType,
            1 => IncomeField::Period,
            2 => IncomeField::Budget,
            3 => IncomeField::Amount,
            _ => IncomeField::IncomeType,
        }
    }

    pub fn next(&self) -> Self {
        let fields = Self::all();
        let idx = (self.index() + 1) % fields.len();
        fields[idx]
    }

    pub fn previous(&self) -> Self {
        let fields = Self::all();
        let idx = if self.index() == 0 {
            fields.len() - 1
        } else {
            self.index() - 1
        };
        fields[idx]
    }
}

/// Income form state
#[derive(Debug, Clone)]
pub struct IncomeFormState {
    pub editing_id: Option<i32>,
    pub income_type_id: Option<i32>,
    pub period: String,
    pub budget: String,
    pub amount: String,
    pub focused_field: IncomeField,
}

impl Default for IncomeFormState {
    fn default() -> Self {
        Self {
            editing_id: None,
            income_type_id: None,
            period: String::new(),
            budget: String::new(),
            amount: "0".to_string(),
            focused_field: IncomeField::IncomeType,
        }
    }
}

impl IncomeFormState {
    pub fn from_income(income: &Income) -> Self {
        Self {
            editing_id: Some(income.id),
            income_type_id: Some(income.income_type_id),
            period: income.period.clone(),
            budget: income.budget.to_string(),
            amount: income.amount.to_string(),
            focused_field: IncomeField::IncomeType,
        }
    }

    pub fn to_create(&self, month_id: i32) -> Option<IncomeCreate> {
        let income_type_id = self.income_type_id?;
        let budget = self.budget.parse().ok()?;
        let amount = self.amount.parse().ok()?;
        Some(IncomeCreate {
            income_type_id,
            period: self.period.clone(),
            budget,
            amount,
            month_id,
        })
    }

    pub fn to_update(&self) -> Option<IncomeUpdate> {
        let budget = self.budget.parse().ok()?;
        let amount = self.amount.parse().ok()?;
        Some(IncomeUpdate {
            income_type_id: self.income_type_id,
            period: Some(self.period.clone()),
            budget: Some(budget),
            amount: Some(amount),
            ..Default::default()
        })
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.income_type_id.is_none() {
            errors.push("Income type is required".to_string());
        }
        if self.period.trim().is_empty() {
            errors.push("Period is required".to_string());
        }
        if self.budget.parse::<f64>().is_err() {
            errors.push("Budget must be a valid number".to_string());
        }
        if self.amount.parse::<f64>().is_err() {
            errors.push("Amount must be a valid number".to_string());
        }
        errors
    }
}

/// Category form state
#[derive(Debug, Clone, Default)]
pub struct CategoryFormState {
    pub editing_id: Option<i32>,
    pub name: String,
    pub color: String,
}

impl CategoryFormState {
    pub fn from_category(category: &Category) -> Self {
        Self {
            editing_id: Some(category.id),
            name: category.name.clone(),
            color: category.color.clone(),
        }
    }

    pub fn to_create(&self) -> CategoryCreate {
        CategoryCreate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn to_update(&self) -> CategoryUpdate {
        CategoryUpdate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.name.trim().is_empty() {
            errors.push("Name is required".to_string());
        }
        errors
    }
}

/// Period form state
#[derive(Debug, Clone, Default)]
pub struct PeriodFormState {
    pub editing_id: Option<i32>,
    pub name: String,
    pub color: String,
}

impl PeriodFormState {
    pub fn from_period(period: &Period) -> Self {
        Self {
            editing_id: Some(period.id),
            name: period.name.clone(),
            color: period.color.clone(),
        }
    }

    pub fn to_create(&self) -> PeriodCreate {
        PeriodCreate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn to_update(&self) -> PeriodUpdate {
        PeriodUpdate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.name.trim().is_empty() {
            errors.push("Name is required".to_string());
        }
        errors
    }
}

/// Income type form state
#[derive(Debug, Clone, Default)]
pub struct IncomeTypeFormState {
    pub editing_id: Option<i32>,
    pub name: String,
    pub color: String,
}

impl IncomeTypeFormState {
    pub fn from_income_type(income_type: &IncomeType) -> Self {
        Self {
            editing_id: Some(income_type.id),
            name: income_type.name.clone(),
            color: income_type.color.clone(),
        }
    }

    pub fn to_create(&self) -> IncomeTypeCreate {
        IncomeTypeCreate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn to_update(&self) -> IncomeTypeUpdate {
        IncomeTypeUpdate {
            name: self.name.clone(),
            color: if self.color.is_empty() {
                None
            } else {
                Some(self.color.clone())
            },
        }
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.name.trim().is_empty() {
            errors.push("Name is required".to_string());
        }
        errors
    }
}

/// Password change form state
#[derive(Debug, Clone, Default)]
pub struct PasswordFormState {
    pub current_password: String,
    pub new_password: String,
    pub confirm_password: String,
    pub focused_field: usize,
}

impl PasswordFormState {
    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.current_password.is_empty() {
            errors.push("Current password is required".to_string());
        }
        if self.new_password.is_empty() {
            errors.push("New password is required".to_string());
        }
        if self.new_password.len() < 8 {
            errors.push("New password must be at least 8 characters".to_string());
        }
        if self.new_password != self.confirm_password {
            errors.push("Passwords do not match".to_string());
        }
        errors
    }
}

/// Login form state
#[derive(Debug, Clone, Default)]
pub struct LoginFormState {
    pub email: String,
    pub password: String,
    pub focused_field: usize, // 0 = email, 1 = password
    pub error: Option<String>,
}

impl LoginFormState {
    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        if self.email.trim().is_empty() {
            errors.push("Email is required".to_string());
        }
        if self.password.is_empty() {
            errors.push("Password is required".to_string());
        }
        errors
    }

    pub fn next_field(&mut self) {
        self.focused_field = (self.focused_field + 1) % 2;
    }

    pub fn previous_field(&mut self) {
        self.focused_field = if self.focused_field == 0 { 1 } else { 0 };
    }
}

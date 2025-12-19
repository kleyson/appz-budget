use ratatui::{
    layout::{Alignment, Constraint, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use crate::state::forms::{
    CategoryFormState, ExpenseField, ExpenseFormState, IncomeFormState, IncomeTypeFormState,
    PasswordFormState, PeriodFormState, PurchaseEditField,
};
use crate::state::{DataState, EntityType, Modal};
use crate::ui::{centered_rect_fixed, hex_to_color};

/// Render a modal dialog
pub fn render(frame: &mut Frame, modal: &Modal) {
    render_with_forms(
        frame,
        modal,
        &ExpenseFormState::default(),
        &IncomeFormState::default(),
        &CategoryFormState::default(),
        &PeriodFormState::default(),
        &IncomeTypeFormState::default(),
        &PasswordFormState::default(),
        &DataState::default(),
    );
}

/// Render a modal dialog with form states
#[allow(clippy::too_many_arguments)]
pub fn render_with_forms(
    frame: &mut Frame,
    modal: &Modal,
    expense_form: &ExpenseFormState,
    income_form: &IncomeFormState,
    category_form: &CategoryFormState,
    period_form: &PeriodFormState,
    income_type_form: &IncomeTypeFormState,
    password_form: &PasswordFormState,
    data: &DataState,
) {
    match modal {
        Modal::ExpenseForm { .. } => render_expense_form(frame, expense_form, data),
        Modal::IncomeForm { .. } => render_income_form_with_state(frame, income_form, data),
        Modal::CategoryForm { .. } => render_category_form(frame, category_form),
        Modal::PeriodForm { .. } => render_period_form(frame, period_form),
        Modal::IncomeTypeForm { .. } => render_income_type_form(frame, income_type_form),
        Modal::PasswordForm => render_password_form_with_state(frame, password_form),
        Modal::ConfirmDelete {
            message,
            entity_type,
            ..
        } => render_confirm_delete(frame, message, *entity_type),
        Modal::ConfirmPay {
            expense_name,
            amount,
            amount_input,
            ..
        } => render_confirm_pay(frame, expense_name, *amount, amount_input),
        Modal::ConfirmCloseMonth {
            month_name,
            is_closing,
            ..
        } => render_confirm_close_month(frame, month_name, *is_closing),
        Modal::Help => render_help(frame),
    }
}

/// Render expense form modal with actual form state
fn render_expense_form(frame: &mut Frame, form: &ExpenseFormState, data: &DataState) {
    let is_edit = form.editing_id.is_some();
    let title = if is_edit {
        "Edit Expense"
    } else {
        "Add Expense"
    };
    // Increase height to accommodate purchases
    let purchases_height = form.purchases.len().max(1) as u16 + 2; // +2 for header and total
    let total_height = 16 + purchases_height.min(8); // Cap purchases display
    let area = centered_rect_fixed(65, total_height, frame.area());

    let block = Block::default()
        .title(format!(" {} ", title))
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2),                       // Name
        Constraint::Length(2),                       // Period
        Constraint::Length(2),                       // Category
        Constraint::Length(2),                       // Budget
        Constraint::Length(purchases_height.min(8)), // Purchases
        Constraint::Length(2),                       // Notes
        Constraint::Min(1),                          // Spacer
        Constraint::Length(1),                       // Instructions
    ])
    .split(inner);

    // Helper to render a form field
    let render_field = |frame: &mut Frame,
                        area: ratatui::layout::Rect,
                        label: &str,
                        value: &str,
                        is_focused: bool,
                        is_select: bool| {
        let display_value = if value.is_empty() {
            if is_select {
                "← / → to select"
            } else {
                "Type to enter..."
            }
        } else {
            value
        };

        let (label_style, value_style) = if is_focused {
            (
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
                Style::default().fg(Color::White),
            )
        } else {
            (
                Style::default().fg(Color::DarkGray),
                Style::default().fg(Color::Gray),
            )
        };

        let cursor = if is_focused && !is_select { "_" } else { "" };

        let line = Line::from(vec![
            Span::styled(format!("{:12}", label), label_style),
            Span::styled(display_value, value_style),
            Span::styled(cursor, Style::default().fg(Color::Cyan)),
        ]);
        frame.render_widget(Paragraph::new(line), area);
    };

    // Render each field
    render_field(
        frame,
        chunks[0],
        "Name:",
        &form.name,
        form.focused_field == ExpenseField::Name,
        false,
    );

    // For period, show the current value or hint
    let period_display = if form.period.is_empty() {
        if data.periods.is_empty() {
            "No periods available".to_string()
        } else {
            format!("← → ({} available)", data.periods.len())
        }
    } else {
        form.period.clone()
    };
    render_field(
        frame,
        chunks[1],
        "Period:",
        &period_display,
        form.focused_field == ExpenseField::Period,
        true,
    );

    // For category, show the current value or hint
    let category_display = if form.category.is_empty() {
        if data.categories.is_empty() {
            "No categories available".to_string()
        } else {
            format!("← → ({} available)", data.categories.len())
        }
    } else {
        form.category.clone()
    };
    render_field(
        frame,
        chunks[2],
        "Category:",
        &category_display,
        form.focused_field == ExpenseField::Category,
        true,
    );

    render_field(
        frame,
        chunks[3],
        "Budget:",
        &format!(
            "${}",
            if form.budget.is_empty() {
                "0.00"
            } else {
                &form.budget
            }
        ),
        form.focused_field == ExpenseField::Budget,
        false,
    );

    // Render purchases section
    let is_purchases_focused = form.focused_field == ExpenseField::Purchases;
    render_purchases_section(frame, chunks[4], form, is_purchases_focused);

    render_field(
        frame,
        chunks[5],
        "Notes:",
        &form.notes,
        form.focused_field == ExpenseField::Notes,
        false,
    );

    // Instructions - different when on purchases
    let instructions = if is_purchases_focused {
        Line::from(vec![
            Span::styled("^N", Style::default().fg(Color::Cyan)),
            Span::raw(":Add "),
            Span::styled("^D", Style::default().fg(Color::Cyan)),
            Span::raw(":Del "),
            Span::styled("↑/↓", Style::default().fg(Color::Cyan)),
            Span::raw(":Nav "),
            Span::styled("←/→", Style::default().fg(Color::Cyan)),
            Span::raw(":Field "),
            Span::styled("Tab", Style::default().fg(Color::Cyan)),
            Span::raw(":Next "),
            Span::styled("Enter", Style::default().fg(Color::Cyan)),
            Span::raw(":Save"),
        ])
    } else {
        Line::from(vec![
            Span::styled("Tab", Style::default().fg(Color::Cyan)),
            Span::raw(": Next  "),
            Span::styled("Enter", Style::default().fg(Color::Cyan)),
            Span::raw(": Save  "),
            Span::styled("Esc", Style::default().fg(Color::Cyan)),
            Span::raw(": Cancel"),
        ])
    };
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[7]);
}

/// Render purchases section within expense form
fn render_purchases_section(
    frame: &mut Frame,
    area: ratatui::layout::Rect,
    form: &ExpenseFormState,
    is_focused: bool,
) {
    let label_style = if is_focused {
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let mut lines: Vec<Line> = vec![];

    // Header with total
    let total = form.calculated_cost();
    let header = Line::from(vec![
        Span::styled(format!("{:12}", "Purchases:"), label_style),
        Span::styled(
            format!("(Total: ${:.2})", total),
            Style::default().fg(if total > 0.0 {
                Color::Green
            } else {
                Color::DarkGray
            }),
        ),
    ]);
    lines.push(header);

    if form.purchases.is_empty() {
        let hint = Line::from(vec![
            Span::raw("            "),
            Span::styled(
                if is_focused {
                    "Press Enter or Ctrl+N to add"
                } else {
                    "No purchases"
                },
                Style::default().fg(Color::DarkGray),
            ),
        ]);
        lines.push(hint);
    } else {
        for (i, purchase) in form.purchases.iter().enumerate() {
            let is_selected = is_focused && i == form.selected_purchase;
            let prefix = if is_selected { "  > " } else { "    " };

            let name_style = if is_selected && form.purchase_edit_field == PurchaseEditField::Name {
                Style::default()
                    .fg(Color::Yellow)
                    .add_modifier(Modifier::UNDERLINED)
            } else if is_selected {
                Style::default().fg(Color::White)
            } else {
                Style::default().fg(Color::Gray)
            };

            let amount_style =
                if is_selected && form.purchase_edit_field == PurchaseEditField::Amount {
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::UNDERLINED)
                } else if is_selected {
                    Style::default().fg(Color::White)
                } else {
                    Style::default().fg(Color::Gray)
                };

            let name_display = if purchase.name.is_empty() {
                "<name>".to_string()
            } else {
                purchase.name.clone()
            };

            // Get amount from string inputs for editing display
            let amount_input = form.get_purchase_amount_input(i);
            let amount_display = if amount_input.is_empty() {
                "$0".to_string()
            } else {
                format!("${}", amount_input)
            };

            let cursor_name = if is_selected && form.purchase_edit_field == PurchaseEditField::Name
            {
                "_"
            } else {
                ""
            };
            let cursor_amount =
                if is_selected && form.purchase_edit_field == PurchaseEditField::Amount {
                    "_"
                } else {
                    ""
                };

            let line = Line::from(vec![
                Span::styled(prefix, Style::default().fg(Color::Cyan)),
                Span::styled(format!("{:20}", name_display), name_style),
                Span::styled(cursor_name, Style::default().fg(Color::Cyan)),
                Span::raw(" "),
                Span::styled(amount_display, amount_style),
                Span::styled(cursor_amount, Style::default().fg(Color::Cyan)),
            ]);
            lines.push(line);
        }
    }

    let paragraph = Paragraph::new(lines);
    frame.render_widget(paragraph, area);
}

/// Render income form modal with form state
fn render_income_form_with_state(frame: &mut Frame, form: &IncomeFormState, data: &DataState) {
    use crate::state::forms::IncomeField;

    let is_edit = form.editing_id.is_some();
    let title = if is_edit { "Edit Income" } else { "Add Income" };
    let area = centered_rect_fixed(60, 16, frame.area());

    let block = Block::default()
        .title(format!(" {} ", title))
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Income Type
        Constraint::Length(2), // Period
        Constraint::Length(2), // Budget
        Constraint::Length(2), // Amount
        Constraint::Min(2),    // Spacer
        Constraint::Length(1), // Instructions
    ])
    .split(inner);

    // Helper to render a form field
    let render_field = |frame: &mut Frame,
                        area: ratatui::layout::Rect,
                        label: &str,
                        value: &str,
                        is_focused: bool,
                        is_select: bool| {
        let display_value = if value.is_empty() {
            if is_select {
                "← / → to select"
            } else {
                "Type to enter..."
            }
        } else {
            value
        };

        let (label_style, value_style) = if is_focused {
            (
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
                Style::default().fg(Color::White),
            )
        } else {
            (
                Style::default().fg(Color::DarkGray),
                Style::default().fg(Color::Gray),
            )
        };

        let cursor = if is_focused && !is_select { "_" } else { "" };

        let line = Line::from(vec![
            Span::styled(format!("{:12}", label), label_style),
            Span::styled(display_value, value_style),
            Span::styled(cursor, Style::default().fg(Color::Cyan)),
        ]);
        frame.render_widget(Paragraph::new(line), area);
    };

    // Get income type name from ID
    let income_type_display = if let Some(id) = form.income_type_id {
        data.income_types
            .iter()
            .find(|it| it.id == id)
            .map(|it| it.name.clone())
            .unwrap_or_else(|| "Unknown".to_string())
    } else if data.income_types.is_empty() {
        "No income types available".to_string()
    } else {
        format!("← → ({} available)", data.income_types.len())
    };

    render_field(
        frame,
        chunks[0],
        "Type:",
        &income_type_display,
        form.focused_field == IncomeField::IncomeType,
        true,
    );

    let period_display = if form.period.is_empty() {
        if data.periods.is_empty() {
            "No periods available".to_string()
        } else {
            format!("← → ({} available)", data.periods.len())
        }
    } else {
        form.period.clone()
    };
    render_field(
        frame,
        chunks[1],
        "Period:",
        &period_display,
        form.focused_field == IncomeField::Period,
        true,
    );

    render_field(
        frame,
        chunks[2],
        "Budget:",
        &format!(
            "${}",
            if form.budget.is_empty() {
                "0.00"
            } else {
                &form.budget
            }
        ),
        form.focused_field == IncomeField::Budget,
        false,
    );

    render_field(
        frame,
        chunks[3],
        "Amount:",
        &format!(
            "${}",
            if form.amount.is_empty() {
                "0.00"
            } else {
                &form.amount
            }
        ),
        form.focused_field == IncomeField::Amount,
        false,
    );

    let instructions = Line::from(vec![
        Span::styled("Tab", Style::default().fg(Color::Cyan)),
        Span::raw(": Next  "),
        Span::styled("Enter", Style::default().fg(Color::Cyan)),
        Span::raw(": Save  "),
        Span::styled("Esc", Style::default().fg(Color::Cyan)),
        Span::raw(": Cancel"),
    ]);
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[5]);
}

/// Render category form modal with actual state
fn render_category_form(frame: &mut Frame, form: &CategoryFormState) {
    render_entity_form_impl(
        frame,
        "Category",
        form.editing_id.is_some(),
        &form.name,
        &form.color,
        0,
    );
}

/// Render period form modal with actual state
fn render_period_form(frame: &mut Frame, form: &PeriodFormState) {
    render_entity_form_impl(
        frame,
        "Period",
        form.editing_id.is_some(),
        &form.name,
        &form.color,
        0,
    );
}

/// Render income type form modal with actual state
fn render_income_type_form(frame: &mut Frame, form: &IncomeTypeFormState) {
    render_entity_form_impl(
        frame,
        "Income Type",
        form.editing_id.is_some(),
        &form.name,
        &form.color,
        0,
    );
}

/// Common implementation for entity forms (category, period, income type)
fn render_entity_form_impl(
    frame: &mut Frame,
    entity_name: &str,
    is_edit: bool,
    name: &str,
    color: &str,
    focused_field: usize,
) {
    let title = if is_edit {
        format!("Edit {}", entity_name)
    } else {
        format!("Add {}", entity_name)
    };
    let area = centered_rect_fixed(50, 12, frame.area());

    let block = Block::default()
        .title(format!(" {} ", title))
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Name
        Constraint::Length(2), // Color
        Constraint::Min(2),    // Spacer
        Constraint::Length(1), // Instructions
    ])
    .split(inner);

    // Name field
    let name_focused = focused_field == 0;
    let name_display = if name.is_empty() {
        "Type name..."
    } else {
        name
    };
    let (name_label_style, name_value_style) = if name_focused {
        (
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
            Style::default().fg(Color::White),
        )
    } else {
        (
            Style::default().fg(Color::DarkGray),
            Style::default().fg(Color::Gray),
        )
    };
    let name_cursor = if name_focused { "_" } else { "" };
    let name_line = Line::from(vec![
        Span::styled(format!("{:12}", "Name:"), name_label_style),
        Span::styled(name_display, name_value_style),
        Span::styled(name_cursor, Style::default().fg(Color::Cyan)),
    ]);
    frame.render_widget(Paragraph::new(name_line), chunks[0]);

    // Color field
    let color_focused = focused_field == 1;
    let color_display = if color.is_empty() { "#3b82f6" } else { color };
    let (color_label_style, color_value_style) = if color_focused {
        (
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
            Style::default().fg(Color::White),
        )
    } else {
        (
            Style::default().fg(Color::DarkGray),
            Style::default().fg(Color::Gray),
        )
    };
    let color_cursor = if color_focused { "_" } else { "" };
    let parsed_color = hex_to_color(color_display);
    let color_line = Line::from(vec![
        Span::styled(format!("{:12}", "Color:"), color_label_style),
        Span::styled(color_display, color_value_style),
        Span::styled(color_cursor, Style::default().fg(Color::Cyan)),
        Span::raw(" "),
        Span::styled("████", Style::default().fg(parsed_color)),
    ]);
    frame.render_widget(Paragraph::new(color_line), chunks[1]);

    let instructions = Line::from(vec![
        Span::styled("r", Style::default().fg(Color::Cyan)),
        Span::raw(":Color "),
        Span::styled("Enter", Style::default().fg(Color::Cyan)),
        Span::raw(":Save "),
        Span::styled("Esc", Style::default().fg(Color::Cyan)),
        Span::raw(":Cancel"),
    ]);
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[3]);
}

/// Render password form modal with actual state
fn render_password_form_with_state(frame: &mut Frame, form: &PasswordFormState) {
    let area = centered_rect_fixed(50, 14, frame.area());

    let block = Block::default()
        .title(" Change Password ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Current
        Constraint::Length(2), // New
        Constraint::Length(2), // Confirm
        Constraint::Min(2),    // Spacer
        Constraint::Length(1), // Instructions
    ])
    .split(inner);

    let render_password_field = |frame: &mut Frame,
                                 area: ratatui::layout::Rect,
                                 label: &str,
                                 value: &str,
                                 is_focused: bool| {
        let display_owned = if value.is_empty() {
            "Enter password...".to_string()
        } else {
            "*".repeat(value.len().min(20))
        };

        let (label_style, value_style) = if is_focused {
            (
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
                Style::default().fg(Color::White),
            )
        } else {
            (
                Style::default().fg(Color::DarkGray),
                Style::default().fg(Color::Gray),
            )
        };
        let cursor = if is_focused { "_" } else { "" };

        let line = Line::from(vec![
            Span::styled(format!("{:12}", label), label_style),
            Span::styled(display_owned, value_style),
            Span::styled(cursor, Style::default().fg(Color::Cyan)),
        ]);
        frame.render_widget(Paragraph::new(line), area);
    };

    render_password_field(
        frame,
        chunks[0],
        "Current:",
        &form.current_password,
        form.focused_field == 0,
    );
    render_password_field(
        frame,
        chunks[1],
        "New:",
        &form.new_password,
        form.focused_field == 1,
    );
    render_password_field(
        frame,
        chunks[2],
        "Confirm:",
        &form.confirm_password,
        form.focused_field == 2,
    );

    let instructions = Line::from(vec![
        Span::styled("Tab", Style::default().fg(Color::Cyan)),
        Span::raw(": Next  "),
        Span::styled("Enter", Style::default().fg(Color::Cyan)),
        Span::raw(": Submit  "),
        Span::styled("Esc", Style::default().fg(Color::Cyan)),
        Span::raw(": Cancel"),
    ]);
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[4]);
}

/// Render confirmation dialog
fn render_confirm_delete(frame: &mut Frame, message: &str, _entity_type: EntityType) {
    let area = centered_rect_fixed(50, 8, frame.area());

    let block = Block::default()
        .title(" Confirm Delete ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Red))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Message
        Constraint::Min(1),    // Spacer
        Constraint::Length(1), // Buttons
    ])
    .split(inner);

    let message_para = Paragraph::new(message)
        .style(Style::default().fg(Color::White))
        .alignment(Alignment::Center);
    frame.render_widget(message_para, chunks[0]);

    let buttons = Line::from(vec![
        Span::styled("[y]", Style::default().fg(Color::Red)),
        Span::raw(" Yes, Delete  "),
        Span::styled("[n]", Style::default().fg(Color::Green)),
        Span::raw(" No, Cancel"),
    ]);
    let buttons_para = Paragraph::new(buttons)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::White));
    frame.render_widget(buttons_para, chunks[2]);
}

/// Render pay confirmation dialog with editable amount
fn render_confirm_pay(frame: &mut Frame, expense_name: &str, budget: f64, amount_input: &str) {
    let area = centered_rect_fixed(50, 11, frame.area());

    let block = Block::default()
        .title(" Pay Expense ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Green))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Expense name
        Constraint::Length(2), // Amount input
        Constraint::Length(1), // Budget hint
        Constraint::Min(1),    // Spacer
        Constraint::Length(1), // Instructions
    ])
    .split(inner);

    let name_para = Paragraph::new(format!("Add payment to '{}'", expense_name))
        .style(Style::default().fg(Color::White))
        .alignment(Alignment::Center);
    frame.render_widget(name_para, chunks[0]);

    // Editable amount input
    let amount_display = if amount_input.is_empty() {
        "0.00".to_string()
    } else {
        amount_input.to_string()
    };
    let amount_line = Line::from(vec![
        Span::styled("Amount: $", Style::default().fg(Color::DarkGray)),
        Span::styled(
            &amount_display,
            Style::default()
                .fg(Color::Green)
                .add_modifier(Modifier::BOLD),
        ),
        Span::styled("_", Style::default().fg(Color::Green)), // Cursor
    ]);
    let amount_para = Paragraph::new(amount_line).alignment(Alignment::Center);
    frame.render_widget(amount_para, chunks[1]);

    // Budget hint
    let hint_para = Paragraph::new(format!("Budgeted: ${:.2}", budget))
        .style(Style::default().fg(Color::DarkGray))
        .alignment(Alignment::Center);
    frame.render_widget(hint_para, chunks[2]);

    // Instructions
    let instructions = Line::from(vec![
        Span::styled("Enter", Style::default().fg(Color::Green)),
        Span::raw(": Pay  "),
        Span::styled("Esc", Style::default().fg(Color::Yellow)),
        Span::raw(": Cancel  "),
        Span::styled("Type", Style::default().fg(Color::Cyan)),
        Span::raw(": Edit amount"),
    ]);
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::White));
    frame.render_widget(instructions_para, chunks[4]);
}

/// Render close/open month confirmation dialog
fn render_confirm_close_month(frame: &mut Frame, month_name: &str, is_closing: bool) {
    let area = centered_rect_fixed(55, 9, frame.area());

    let (title, border_color, action_text, description) = if is_closing {
        (
            " Close Month ",
            Color::Yellow,
            "Close",
            "This will prevent adding or editing expenses and incomes.",
        )
    } else {
        (
            " Reopen Month ",
            Color::Green,
            "Reopen",
            "This will allow adding and editing expenses and incomes.",
        )
    };

    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(border_color))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Month name
        Constraint::Length(2), // Description
        Constraint::Min(1),    // Spacer
        Constraint::Length(1), // Buttons
    ])
    .split(inner);

    let name_para = Paragraph::new(format!("{} '{}'?", action_text, month_name))
        .style(Style::default().fg(Color::White))
        .alignment(Alignment::Center);
    frame.render_widget(name_para, chunks[0]);

    let desc_para = Paragraph::new(description)
        .style(Style::default().fg(Color::DarkGray))
        .alignment(Alignment::Center);
    frame.render_widget(desc_para, chunks[1]);

    let buttons = Line::from(vec![
        Span::styled("[y]", Style::default().fg(border_color)),
        Span::raw(format!(" Yes, {}  ", action_text)),
        Span::styled("[n]", Style::default().fg(Color::DarkGray)),
        Span::raw(" No, Cancel"),
    ]);
    let buttons_para = Paragraph::new(buttons)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::White));
    frame.render_widget(buttons_para, chunks[3]);
}

/// Render help overlay
fn render_help(frame: &mut Frame) {
    let area = centered_rect_fixed(60, 20, frame.area());

    let block = Block::default()
        .title(" Keyboard Shortcuts ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);

    let help_text = vec![
        Line::from(vec![Span::styled(
            "Global",
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )]),
        Line::from(vec![
            Span::styled("  q / Ctrl+C", Style::default().fg(Color::Yellow)),
            Span::raw("  Quit application"),
        ]),
        Line::from(vec![
            Span::styled("  ?", Style::default().fg(Color::Yellow)),
            Span::raw("           Show this help"),
        ]),
        Line::from(vec![
            Span::styled("  Tab", Style::default().fg(Color::Yellow)),
            Span::raw("         Next tab"),
        ]),
        Line::from(vec![
            Span::styled("  1-5", Style::default().fg(Color::Yellow)),
            Span::raw("         Jump to tab"),
        ]),
        Line::from(""),
        Line::from(vec![Span::styled(
            "Navigation",
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )]),
        Line::from(vec![
            Span::styled("  j/k or ↑/↓", Style::default().fg(Color::Yellow)),
            Span::raw("  Move up/down"),
        ]),
        Line::from(vec![
            Span::styled("  h/l or ←/→", Style::default().fg(Color::Yellow)),
            Span::raw("  Change month"),
        ]),
        Line::from(vec![
            Span::styled("  Enter", Style::default().fg(Color::Yellow)),
            Span::raw("       Select/Edit item"),
        ]),
        Line::from(vec![
            Span::styled("  n", Style::default().fg(Color::Yellow)),
            Span::raw("           Create new item"),
        ]),
        Line::from(vec![
            Span::styled("  d", Style::default().fg(Color::Yellow)),
            Span::raw("           Delete item"),
        ]),
        Line::from(vec![
            Span::styled("  p", Style::default().fg(Color::Yellow)),
            Span::raw("           Pay expense"),
        ]),
        Line::from(vec![
            Span::styled("  c", Style::default().fg(Color::Yellow)),
            Span::raw("           Close/Open month"),
        ]),
        Line::from(""),
        Line::from(vec![Span::styled(
            "Press any key to close",
            Style::default().fg(Color::DarkGray),
        )]),
    ];

    let help_para = Paragraph::new(help_text);
    frame.render_widget(help_para, inner);
}

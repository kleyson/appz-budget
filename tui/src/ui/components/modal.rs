use ratatui::{
    layout::{Alignment, Constraint, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use crate::state::{EntityType, Modal};
use crate::ui::centered_rect_fixed;

/// Render a modal dialog
pub fn render(frame: &mut Frame, modal: &Modal) {
    match modal {
        Modal::ExpenseForm { editing } => render_expense_form(frame, editing.is_some()),
        Modal::IncomeForm { editing } => render_income_form(frame, editing.is_some()),
        Modal::CategoryForm { editing } => render_entity_form(frame, "Category", editing.is_some()),
        Modal::PeriodForm { editing } => render_entity_form(frame, "Period", editing.is_some()),
        Modal::IncomeTypeForm { editing } => {
            render_entity_form(frame, "Income Type", editing.is_some())
        }
        Modal::PasswordForm => render_password_form(frame),
        Modal::ConfirmDelete {
            message,
            entity_type,
            ..
        } => render_confirm_delete(frame, message, *entity_type),
        Modal::ConfirmPay {
            expense_name,
            amount,
            ..
        } => render_confirm_pay(frame, expense_name, *amount),
        Modal::Help => render_help(frame),
    }
}

/// Render expense form modal
fn render_expense_form(frame: &mut Frame, is_edit: bool) {
    let title = if is_edit {
        "Edit Expense"
    } else {
        "Add Expense"
    };
    let area = centered_rect_fixed(60, 22, frame.area());

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
        Constraint::Length(2), // Name label + input
        Constraint::Length(2), // Period
        Constraint::Length(2), // Category
        Constraint::Length(2), // Budget
        Constraint::Length(2), // Purchases
        Constraint::Length(2), // Calculated Cost (read-only)
        Constraint::Length(2), // Notes
        Constraint::Min(2),    // Spacer
        Constraint::Length(1), // Instructions
    ])
    .split(inner);

    // Placeholder form fields
    let fields = [
        ("Name:", "Enter expense name...", false),
        ("Period:", "Select period...", false),
        ("Category:", "Select category...", false),
        ("Budget:", "0.00", false),
        ("Purchases:", "Add purchases... (+ to add)", false),
        ("Calc. Cost:", "0.00 (from purchases)", true), // Read-only
        ("Notes:", "Optional notes...", false),
    ];

    for (i, (label, placeholder, is_readonly)) in fields.iter().enumerate() {
        if i < chunks.len() - 2 {
            let text = format!("{:12} {}", label, placeholder);
            let style = if *is_readonly {
                Style::default().fg(Color::Rgb(100, 100, 100))
            } else {
                Style::default().fg(Color::DarkGray)
            };
            let para = Paragraph::new(text).style(style);
            frame.render_widget(para, chunks[i]);
        }
    }

    // Instructions
    let instructions = Line::from(vec![
        Span::styled("Tab", Style::default().fg(Color::Cyan)),
        Span::raw(": Next  "),
        Span::styled("+", Style::default().fg(Color::Cyan)),
        Span::raw(": Add Purchase  "),
        Span::styled("Enter", Style::default().fg(Color::Cyan)),
        Span::raw(": Save  "),
        Span::styled("Esc", Style::default().fg(Color::Cyan)),
        Span::raw(": Cancel"),
    ]);
    let instructions_para = Paragraph::new(instructions)
        .alignment(Alignment::Center)
        .style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[8]);
}

/// Render income form modal
fn render_income_form(frame: &mut Frame, is_edit: bool) {
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

    let fields = [
        ("Income Type:", "Select type..."),
        ("Period:", "Select period..."),
        ("Budget:", "0.00"),
        ("Amount:", "0.00"),
    ];

    for (i, (label, placeholder)) in fields.iter().enumerate() {
        if i < chunks.len() - 2 {
            let text = format!("{:12} {}", label, placeholder);
            let para = Paragraph::new(text).style(Style::default().fg(Color::DarkGray));
            frame.render_widget(para, chunks[i]);
        }
    }

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

/// Render entity form (category, period, income type)
fn render_entity_form(frame: &mut Frame, entity_name: &str, is_edit: bool) {
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

    let name_text = format!("{:12} {}", "Name:", "Enter name...");
    let name_para = Paragraph::new(name_text).style(Style::default().fg(Color::DarkGray));
    frame.render_widget(name_para, chunks[0]);

    let color_text = format!("{:12} {} {}", "Color:", "#ffffff", "████");
    let color_para = Paragraph::new(color_text).style(Style::default().fg(Color::DarkGray));
    frame.render_widget(color_para, chunks[1]);

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
    frame.render_widget(instructions_para, chunks[3]);
}

/// Render password form modal
fn render_password_form(frame: &mut Frame) {
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

    let fields = [
        ("Current:", "********"),
        ("New:", "Enter new password..."),
        ("Confirm:", "Confirm password..."),
    ];

    for (i, (label, placeholder)) in fields.iter().enumerate() {
        if i < chunks.len() - 2 {
            let text = format!("{:12} {}", label, placeholder);
            let para = Paragraph::new(text).style(Style::default().fg(Color::DarkGray));
            frame.render_widget(para, chunks[i]);
        }
    }

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

/// Render pay confirmation dialog
fn render_confirm_pay(frame: &mut Frame, expense_name: &str, amount: f64) {
    let area = centered_rect_fixed(50, 9, frame.area());

    let block = Block::default()
        .title(" Confirm Payment ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Green))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    frame.render_widget(Clear, area);
    frame.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let chunks = Layout::vertical([
        Constraint::Length(2), // Expense name
        Constraint::Length(1), // Amount
        Constraint::Min(1),    // Spacer
        Constraint::Length(1), // Buttons
    ])
    .split(inner);

    let name_para = Paragraph::new(format!("Pay expense '{}'?", expense_name))
        .style(Style::default().fg(Color::White))
        .alignment(Alignment::Center);
    frame.render_widget(name_para, chunks[0]);

    let amount_para = Paragraph::new(format!("Amount: ${:.2}", amount))
        .style(Style::default().fg(Color::Green))
        .alignment(Alignment::Center);
    frame.render_widget(amount_para, chunks[1]);

    let buttons = Line::from(vec![
        Span::styled("[y]", Style::default().fg(Color::Green)),
        Span::raw(" Yes, Pay  "),
        Span::styled("[n]", Style::default().fg(Color::Yellow)),
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
        Line::from(""),
        Line::from(vec![Span::styled(
            "Press any key to close",
            Style::default().fg(Color::DarkGray),
        )]),
    ];

    let help_para = Paragraph::new(help_text);
    frame.render_widget(help_para, inner);
}

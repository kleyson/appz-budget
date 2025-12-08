pub mod api_config;
pub mod components;
pub mod dashboard;
pub mod login;
pub mod tabs;

use ratatui::{
    layout::{Alignment, Constraint, Layout, Rect},
    style::{Color, Style},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use crate::state::forms::{
    CategoryFormState, ExpenseFormState, IncomeFormState, IncomeTypeFormState, PasswordFormState,
    PeriodFormState,
};
use crate::state::AppState;

/// Render the appropriate screen based on app state
pub fn render(app: &AppState, frame: &mut Frame) {
    render_with_forms(
        app,
        frame,
        &ExpenseFormState::default(),
        &IncomeFormState::default(),
        &CategoryFormState::default(),
        &PeriodFormState::default(),
        &IncomeTypeFormState::default(),
        &PasswordFormState::default(),
    );
}

/// Render the appropriate screen based on app state with form states
#[allow(clippy::too_many_arguments)]
pub fn render_with_forms(
    app: &AppState,
    frame: &mut Frame,
    expense_form: &ExpenseFormState,
    income_form: &IncomeFormState,
    category_form: &CategoryFormState,
    period_form: &PeriodFormState,
    income_type_form: &IncomeTypeFormState,
    password_form: &PasswordFormState,
) {
    match app.screen {
        crate::state::Screen::Login => login::render(app, frame),
        crate::state::Screen::ApiConfig => {
            // ApiConfig is rendered directly from App with its own state
            // This shouldn't be called, but handle it gracefully
            login::render(app, frame)
        }
        crate::state::Screen::Dashboard => dashboard::render_with_forms(
            app,
            frame,
            expense_form,
            income_form,
            category_form,
            period_form,
            income_type_form,
            password_form,
        ),
    }

    // Render loading overlay if loading
    if app.ui.is_loading {
        render_loading(frame);
    }

    // Render error/success messages
    if let Some(ref msg) = app.ui.error_message {
        render_message(frame, msg, MessageType::Error);
    } else if let Some(ref msg) = app.ui.success_message {
        render_message(frame, msg, MessageType::Success);
    }
}

/// Render a loading overlay
fn render_loading(frame: &mut Frame) {
    let area = centered_rect(30, 5, frame.area());
    let block = Block::default()
        .title(" Loading ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .style(Style::default().bg(Color::Black));

    let text = Paragraph::new("Please wait...")
        .alignment(Alignment::Center)
        .block(block);

    frame.render_widget(Clear, area);
    frame.render_widget(text, area);
}

enum MessageType {
    Error,
    Success,
}

/// Render an error or success message as a popup
fn render_message(frame: &mut Frame, message: &str, msg_type: MessageType) {
    let area = frame.area();

    let (title, border_color, text_color) = match msg_type {
        MessageType::Error => (" Error ", Color::Red, Color::Red),
        MessageType::Success => (" Success ", Color::Green, Color::Green),
    };

    // Calculate popup size based on message length
    let msg_width = (message.len() as u16 + 4)
        .min(area.width.saturating_sub(4))
        .max(20);
    let popup_width = msg_width + 4; // padding
    let popup_height = 3;

    // Center the popup horizontally and position it above the footer
    let message_area = Rect {
        x: area.x + (area.width.saturating_sub(popup_width)) / 2,
        y: area.height.saturating_sub(popup_height + 2), // +2 to be above footer
        width: popup_width,
        height: popup_height,
    };

    // Create a bordered block for the message
    let block = Block::default()
        .title(title)
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(border_color))
        .style(Style::default().bg(Color::Rgb(30, 30, 35)));

    // Clear the area and render the block
    frame.render_widget(Clear, message_area);
    frame.render_widget(block.clone(), message_area);

    // Render the message text inside the block
    let inner = block.inner(message_area);
    let text = Paragraph::new(message)
        .style(Style::default().fg(text_color))
        .alignment(Alignment::Center);
    frame.render_widget(text, inner);
}

/// Helper function to create a centered rect
pub fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::vertical([
        Constraint::Percentage((100 - percent_y) / 2),
        Constraint::Percentage(percent_y),
        Constraint::Percentage((100 - percent_y) / 2),
    ])
    .split(r);

    Layout::horizontal([
        Constraint::Percentage((100 - percent_x) / 2),
        Constraint::Percentage(percent_x),
        Constraint::Percentage((100 - percent_x) / 2),
    ])
    .split(popup_layout[1])[1]
}

/// Helper function to create a fixed-size centered rect
pub fn centered_rect_fixed(width: u16, height: u16, r: Rect) -> Rect {
    let x = r.x + (r.width.saturating_sub(width)) / 2;
    let y = r.y + (r.height.saturating_sub(height)) / 2;
    Rect {
        x,
        y,
        width: width.min(r.width),
        height: height.min(r.height),
    }
}

/// Convert a hex color string to ratatui Color
pub fn hex_to_color(hex: &str) -> Color {
    let hex = hex.trim_start_matches('#');
    if hex.len() != 6 {
        return Color::White;
    }
    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
    Color::Rgb(r, g, b)
}

/// Format a number as currency
pub fn format_currency(amount: f64) -> String {
    if amount >= 0.0 {
        format!("${:.2}", amount)
    } else {
        format!("-${:.2}", amount.abs())
    }
}

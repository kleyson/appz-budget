use ratatui::{
    layout::{Alignment, Constraint, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use super::centered_rect_fixed;
use crate::state::{AppState, InputMode};

/// Login form state stored in the app
#[derive(Default)]
pub struct LoginState {
    pub email: String,
    pub password: String,
    pub focused_field: usize,
    pub error: Option<String>,
}

/// Login form fields
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoginField {
    Email,
    Password,
}

impl LoginField {
    pub fn index(self) -> usize {
        match self {
            LoginField::Email => 0,
            LoginField::Password => 1,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => LoginField::Email,
            _ => LoginField::Password,
        }
    }

    pub fn count() -> usize {
        2
    }
}

// Colors
const CYAN: Color = Color::Cyan;
const GREEN: Color = Color::Green;
const RED: Color = Color::Red;
const YELLOW: Color = Color::Yellow;
const GRAY: Color = Color::Gray;
const DARK_GRAY: Color = Color::DarkGray;
const WHITE: Color = Color::White;

/// Render the login screen (fallback, not used)
pub fn render(app: &AppState, frame: &mut Frame) {
    let area = frame.area();
    let bg = Block::default().style(Style::default().bg(Color::Black));
    frame.render_widget(bg, area);

    let login_area = centered_rect_fixed(50, 14, area);
    let block = Block::default()
        .title(" Appz Budget ")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(CYAN));

    frame.render_widget(Clear, login_area);
    frame.render_widget(block.clone(), login_area);

    let inner = block.inner(login_area);
    let chunks = Layout::vertical([
        Constraint::Length(2),
        Constraint::Length(1),
        Constraint::Length(3),
        Constraint::Length(1),
        Constraint::Length(3),
        Constraint::Min(1),
    ])
    .split(inner);

    let welcome = Paragraph::new("Welcome back")
        .style(Style::default().fg(WHITE).add_modifier(Modifier::BOLD))
        .alignment(Alignment::Center);
    frame.render_widget(welcome, chunks[0]);

    let email_border_color = if app.ui.input_mode == InputMode::Editing {
        CYAN
    } else {
        DARK_GRAY
    };
    let email_block = Block::default()
        .title(" Email ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(email_border_color));
    let email_input = Paragraph::new("Enter your email...")
        .style(Style::default().fg(DARK_GRAY))
        .block(email_block);
    frame.render_widget(email_input, chunks[2]);

    let password_block = Block::default()
        .title(" Password ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(DARK_GRAY));
    let password_input = Paragraph::new("Enter your password...")
        .style(Style::default().fg(DARK_GRAY))
        .block(password_block);
    frame.render_widget(password_input, chunks[4]);
}

/// Render login screen with actual form state
#[allow(clippy::too_many_arguments)]
pub fn render_with_state(
    frame: &mut Frame,
    email: &str,
    password: &str,
    focused_field: usize,
    error: Option<&str>,
    is_loading: bool,
    version: &str,
    server_url: &str,
) {
    let area = frame.area();

    // Black background
    let bg = Block::default().style(Style::default().bg(Color::Black));
    frame.render_widget(bg, area);

    // Calculate card size
    let card_width = 54u16;
    let card_height = 16u16;
    let card_area = centered_rect_fixed(card_width, card_height, area);

    // Main card
    let card_block = Block::default()
        .title(format!(" Appz Budget v{} ", version))
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(CYAN));

    frame.render_widget(Clear, card_area);
    frame.render_widget(card_block.clone(), card_area);

    let inner = card_block.inner(card_area);

    // Layout
    let chunks = Layout::vertical([
        Constraint::Length(1), // Server info
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // Email input
        Constraint::Length(3), // Password input
        Constraint::Length(1), // Error
        Constraint::Length(1), // Spacer
        Constraint::Min(1),    // Instructions
    ])
    .horizontal_margin(1)
    .split(inner);

    // Server info line
    let server_display = if server_url.len() > 35 {
        format!("{}...", &server_url[..32])
    } else {
        server_url.to_string()
    };
    let server_line = Line::from(vec![
        Span::styled("Server: ", Style::default().fg(GRAY)),
        Span::styled(&server_display, Style::default().fg(GREEN)),
        Span::styled("  ", Style::default()),
        Span::styled("[s]", Style::default().fg(YELLOW)),
        Span::styled(" config", Style::default().fg(GRAY)),
    ]);
    frame.render_widget(Paragraph::new(server_line), chunks[0]);

    // Email field
    let email_focused = focused_field == LoginField::Email.index();
    let email_border = if email_focused { CYAN } else { GRAY };
    let email_block = Block::default()
        .title(" Email ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(email_border));

    let email_text = if email.is_empty() {
        Span::styled("you@example.com", Style::default().fg(DARK_GRAY))
    } else {
        Span::styled(email, Style::default().fg(WHITE))
    };
    let email_widget = Paragraph::new(email_text).block(email_block);
    frame.render_widget(email_widget, chunks[2]);

    // Password field
    let password_focused = focused_field == LoginField::Password.index();
    let password_border = if password_focused { CYAN } else { GRAY };
    let password_block = Block::default()
        .title(" Password ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(password_border));

    let password_text = if password.is_empty() {
        Span::styled("Enter your password", Style::default().fg(DARK_GRAY))
    } else {
        Span::styled("*".repeat(password.len()), Style::default().fg(WHITE))
    };
    let password_widget = Paragraph::new(password_text).block(password_block);
    frame.render_widget(password_widget, chunks[3]);

    // Cursor position
    if email_focused {
        frame.set_cursor_position((chunks[2].x + 1 + email.len() as u16, chunks[2].y + 1));
    } else if password_focused {
        frame.set_cursor_position((chunks[3].x + 1 + password.len() as u16, chunks[3].y + 1));
    }

    // Error message
    if let Some(err) = error {
        let error_line = Line::from(vec![
            Span::styled(
                "Error: ",
                Style::default().fg(RED).add_modifier(Modifier::BOLD),
            ),
            Span::styled(err, Style::default().fg(RED)),
        ]);
        frame.render_widget(Paragraph::new(error_line), chunks[4]);
    }

    // Instructions
    let instructions = if is_loading {
        Line::from(vec![Span::styled(
            "Signing in...",
            Style::default().fg(YELLOW),
        )])
    } else {
        Line::from(vec![
            Span::styled("Tab", Style::default().fg(CYAN)),
            Span::raw(" switch  "),
            Span::styled("Enter", Style::default().fg(CYAN)),
            Span::raw(" login  "),
            Span::styled("s", Style::default().fg(CYAN)),
            Span::raw(" server  "),
            Span::styled("Esc", Style::default().fg(CYAN)),
            Span::raw(" quit"),
        ])
    };
    frame.render_widget(
        Paragraph::new(instructions)
            .alignment(Alignment::Center)
            .style(Style::default().fg(GRAY)),
        chunks[6],
    );
}

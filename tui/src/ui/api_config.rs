use ratatui::{
    layout::{Alignment, Constraint, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use super::centered_rect_fixed;

/// API config form fields
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApiConfigField {
    ApiUrl,
    ApiKey,
}

impl ApiConfigField {
    pub fn index(self) -> usize {
        match self {
            ApiConfigField::ApiUrl => 0,
            ApiConfigField::ApiKey => 1,
        }
    }

    pub fn from_index(index: usize) -> Self {
        match index {
            0 => ApiConfigField::ApiUrl,
            _ => ApiConfigField::ApiKey,
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

/// Render the API configuration screen
#[allow(clippy::too_many_arguments)]
pub fn render(
    frame: &mut Frame,
    api_url: &str,
    api_key: &str,
    focused_field: usize,
    error: Option<&str>,
    version: &str,
) {
    let area = frame.area();

    // Black background
    let bg = Block::default().style(Style::default().bg(Color::Black));
    frame.render_widget(bg, area);

    // Card size
    let card_width = 54u16;
    let card_height = 14u16;
    let card_area = centered_rect_fixed(card_width, card_height, area);

    // Main card
    let card_block = Block::default()
        .title(format!(" Server Config v{} ", version))
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .border_style(Style::default().fg(YELLOW));

    frame.render_widget(Clear, card_area);
    frame.render_widget(card_block.clone(), card_area);

    let inner = card_block.inner(card_area);

    // Layout
    let chunks = Layout::vertical([
        Constraint::Length(1), // Header
        Constraint::Length(1), // Spacer
        Constraint::Length(3), // API URL
        Constraint::Length(3), // API Key
        Constraint::Length(1), // Error
        Constraint::Min(1),    // Instructions
    ])
    .horizontal_margin(1)
    .split(inner);

    // Header
    let header = Paragraph::new("Configure your backend server")
        .style(Style::default().fg(WHITE))
        .alignment(Alignment::Center);
    frame.render_widget(header, chunks[0]);

    // API URL field
    let url_focused = focused_field == ApiConfigField::ApiUrl.index();
    let url_border = if url_focused { CYAN } else { GRAY };
    let url_block = Block::default()
        .title(" API URL ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(url_border));

    let url_text = if api_url.is_empty() {
        Span::styled("https://budget.appz.wtf", Style::default().fg(DARK_GRAY))
    } else {
        Span::styled(api_url, Style::default().fg(GREEN))
    };
    let url_widget = Paragraph::new(url_text).block(url_block);
    frame.render_widget(url_widget, chunks[2]);

    // API Key field
    let key_focused = focused_field == ApiConfigField::ApiKey.index();
    let key_border = if key_focused { CYAN } else { GRAY };
    let key_block = Block::default()
        .title(" API Key ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(key_border));

    let key_text = if api_key.is_empty() {
        Span::styled("(optional)", Style::default().fg(DARK_GRAY))
    } else {
        // Show partial key for security
        let display = if api_key.len() > 8 {
            format!("{}...", &api_key[..8])
        } else {
            api_key.to_string()
        };
        Span::styled(display, Style::default().fg(WHITE))
    };
    let key_widget = Paragraph::new(key_text).block(key_block);
    frame.render_widget(key_widget, chunks[3]);

    // Cursor position
    if url_focused {
        frame.set_cursor_position((chunks[2].x + 1 + api_url.len() as u16, chunks[2].y + 1));
    } else if key_focused {
        frame.set_cursor_position((chunks[3].x + 1 + api_key.len() as u16, chunks[3].y + 1));
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
    let instructions = Line::from(vec![
        Span::styled("Tab", Style::default().fg(CYAN)),
        Span::raw(" switch  "),
        Span::styled("Enter", Style::default().fg(CYAN)),
        Span::raw(" save  "),
        Span::styled("Esc", Style::default().fg(CYAN)),
        Span::raw(" cancel"),
    ]);
    frame.render_widget(
        Paragraph::new(instructions)
            .alignment(Alignment::Center)
            .style(Style::default().fg(GRAY)),
        chunks[5],
    );
}

use ratatui::{
    layout::{Alignment, Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Tabs},
    Frame,
};

use super::components;
use super::tabs;
use crate::state::forms::{
    CategoryFormState, ExpenseFormState, IncomeFormState, IncomeTypeFormState, PasswordFormState,
    PeriodFormState,
};
use crate::state::{AppState, DashboardTab};

/// Render the main dashboard
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

/// Render the main dashboard with form states
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
    let area = frame.area();

    // Main layout: header, tabs, content, footer
    let chunks = Layout::vertical([
        Constraint::Length(3), // Header with month selector
        Constraint::Length(3), // Tab bar
        Constraint::Min(10),   // Content area
        Constraint::Length(1), // Footer/help line
    ])
    .split(area);

    // Render header with month selector
    render_header(app, frame, chunks[0]);

    // Render tab bar
    render_tabs(app, frame, chunks[1]);

    // Render content based on selected tab
    match app.ui.selected_tab {
        DashboardTab::Summary => tabs::summary::render(app, frame, chunks[2]),
        DashboardTab::Expenses => tabs::expenses::render(app, frame, chunks[2]),
        DashboardTab::Income => tabs::income::render(app, frame, chunks[2]),
        DashboardTab::Charts => tabs::charts::render(app, frame, chunks[2]),
        DashboardTab::Settings => tabs::settings::render(app, frame, chunks[2]),
    }

    // Render footer with keyboard shortcuts
    render_footer(app, frame, chunks[3]);

    // Render modal if present
    if let Some(ref modal) = app.ui.modal {
        components::modal::render_with_forms(
            frame,
            modal,
            expense_form,
            income_form,
            category_form,
            period_form,
            income_type_form,
            password_form,
            &app.data,
        );
    }
}

/// Render the header with app title and month selector
fn render_header(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .borders(Borders::BOTTOM)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Split header into title and month selector
    let header_chunks = Layout::horizontal([
        Constraint::Length(20), // App title
        Constraint::Min(20),    // Spacer
        Constraint::Length(30), // Month selector
        Constraint::Length(5),  // Help hint
    ])
    .split(inner);

    // App title
    let title = Paragraph::new(" Appz Budget").style(
        Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD),
    );
    frame.render_widget(title, header_chunks[0]);

    // Month selector with closed indicator
    if let Some(month) = app.selected_month() {
        let month_spans = if month.is_closed {
            vec![
                Span::raw("◀ "),
                Span::styled(month.display_name(), Style::default().fg(Color::White)),
                Span::raw(" "),
                Span::styled(
                    "[CLOSED]",
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::raw(" ▶"),
            ]
        } else {
            vec![
                Span::raw("◀ "),
                Span::styled(month.display_name(), Style::default().fg(Color::White)),
                Span::raw(" ▶"),
            ]
        };
        let month_selector = Paragraph::new(Line::from(month_spans)).alignment(Alignment::Center);
        frame.render_widget(month_selector, header_chunks[2]);
    } else {
        let month_selector = Paragraph::new("No month selected")
            .style(Style::default().fg(Color::DarkGray))
            .alignment(Alignment::Center);
        frame.render_widget(month_selector, header_chunks[2]);
    }

    // Help hint
    let help = Paragraph::new("[?]")
        .style(Style::default().fg(Color::DarkGray))
        .alignment(Alignment::Right);
    frame.render_widget(help, header_chunks[3]);
}

/// Render the tab bar
fn render_tabs(app: &AppState, frame: &mut Frame, area: Rect) {
    let titles: Vec<Line> = DashboardTab::all()
        .iter()
        .map(|t| Line::from(format!(" {} ", t.as_str())))
        .collect();

    let tabs = Tabs::new(titles)
        .block(
            Block::default()
                .borders(Borders::BOTTOM)
                .border_style(Style::default().fg(Color::DarkGray)),
        )
        .select(app.ui.selected_tab.index())
        .style(Style::default().fg(Color::DarkGray))
        .highlight_style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        );

    frame.render_widget(tabs, area);
}

/// Render the footer with keyboard shortcuts
fn render_footer(app: &AppState, frame: &mut Frame, area: Rect) {
    let shortcuts = match app.ui.selected_tab {
        DashboardTab::Summary => vec![
            ("h/l", "Month"),
            ("c", "Close/Open"),
            ("Tab", "Tab"),
            ("q", "Quit"),
            ("?", "Help"),
        ],
        DashboardTab::Expenses => vec![
            ("j/k", "Nav"),
            ("n", "New"),
            ("e", "Edit"),
            ("d", "Del"),
            ("p", "Pay"),
            ("c", "Close"),
            ("q", "Quit"),
        ],
        DashboardTab::Income => vec![
            ("j/k", "Nav"),
            ("n", "New"),
            ("e", "Edit"),
            ("d", "Del"),
            ("c", "Close"),
            ("Tab", "Tab"),
            ("q", "Quit"),
        ],
        DashboardTab::Charts => vec![
            ("h/l", "Month"),
            ("c", "Close/Open"),
            ("Tab", "Tab"),
            ("q", "Quit"),
        ],
        DashboardTab::Settings => vec![
            ("j/k", "Navigate"),
            ("n", "New"),
            ("e", "Edit"),
            ("d", "Delete"),
            ("Tab", "Tab"),
            ("q", "Quit"),
        ],
    };

    let spans: Vec<Span> = shortcuts
        .iter()
        .flat_map(|(key, action)| {
            vec![
                Span::styled(*key, Style::default().fg(Color::Cyan)),
                Span::raw(format!(":{} ", action)),
            ]
        })
        .collect();

    let line = Line::from(spans);
    let footer = Paragraph::new(line).style(Style::default().fg(Color::DarkGray));
    frame.render_widget(footer, area);
}

use ratatui::{
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Cell, List, ListItem, Paragraph, Row, Table},
    Frame,
};

use crate::state::{AppState, SettingsTab};
use crate::ui::hex_to_color;

/// Render the settings tab
pub fn render(app: &AppState, frame: &mut Frame, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Min(10),   // Main content
        Constraint::Length(2), // Help bar
    ])
    .split(area);

    let main_chunks = Layout::horizontal([
        Constraint::Length(20), // Settings sidebar
        Constraint::Min(30),    // Content area
    ])
    .split(chunks[0]);

    // Render settings sidebar
    render_sidebar(app, frame, main_chunks[0]);

    // Render content based on selected settings tab
    match app.ui.settings_tab {
        SettingsTab::Categories => render_categories(app, frame, main_chunks[1]),
        SettingsTab::Periods => render_periods(app, frame, main_chunks[1]),
        SettingsTab::IncomeTypes => render_income_types(app, frame, main_chunks[1]),
        SettingsTab::Password => render_password(app, frame, main_chunks[1]),
    }

    // Render help bar
    render_help_bar(frame, chunks[1]);
}

/// Render the settings sidebar
fn render_sidebar(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Sections ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let items: Vec<ListItem> = SettingsTab::all()
        .iter()
        .enumerate()
        .map(|(i, tab)| {
            let is_selected = *tab == app.ui.settings_tab;
            let style = if is_selected {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::White)
            };
            let prefix = if is_selected { "▶ " } else { "  " };
            let text = format!("{}[{}] {}", prefix, i + 1, tab.as_str());
            ListItem::new(Line::from(vec![Span::styled(
                text,
                if is_selected {
                    style
                } else {
                    Style::default().fg(Color::White)
                },
            )]))
        })
        .collect();

    let list = List::new(items).block(block);
    frame.render_widget(list, area);
}

/// Render help bar at the bottom
fn render_help_bar(frame: &mut Frame, area: Rect) {
    let help = Line::from(vec![
        Span::styled(" 1-4 ", Style::default().fg(Color::Black).bg(Color::Cyan)),
        Span::raw(" Section  "),
        Span::styled(" ↑↓ ", Style::default().fg(Color::Black).bg(Color::Cyan)),
        Span::raw(" Select item  "),
        Span::styled(" n ", Style::default().fg(Color::Black).bg(Color::Green)),
        Span::raw(" New  "),
        Span::styled(" e ", Style::default().fg(Color::Black).bg(Color::Yellow)),
        Span::raw(" Edit  "),
        Span::styled(" d ", Style::default().fg(Color::Black).bg(Color::Red)),
        Span::raw(" Delete  "),
        Span::styled(" ? ", Style::default().fg(Color::Black).bg(Color::Magenta)),
        Span::raw(" Help"),
    ]);
    frame.render_widget(Paragraph::new(help), area);
}

/// Render categories management
fn render_categories(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(format!(" Categories ({}) ", app.data.categories.len()))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Name", "Color", "Preview"].iter().map(|h| {
        Cell::from(*h).style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    });
    let header = Row::new(header_cells).height(1);

    let rows: Vec<Row> = app
        .data
        .categories
        .iter()
        .map(|cat| {
            let color = hex_to_color(&cat.color);
            Row::new(vec![
                Cell::from(cat.name.clone()),
                Cell::from(cat.color.clone()),
                Cell::from("████").style(Style::default().fg(color)),
            ])
        })
        .collect();

    let widths = [
        Constraint::Percentage(50),
        Constraint::Percentage(25),
        Constraint::Percentage(25),
    ];

    let table = Table::new(rows, widths)
        .header(header)
        .block(block)
        .row_highlight_style(
            Style::default()
                .bg(Color::Rgb(50, 50, 60))
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("▶ ");

    let mut table_state = app.ui.category_table.clone();
    frame.render_stateful_widget(table, area, &mut table_state);
}

/// Render periods management
fn render_periods(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(format!(" Periods ({}) ", app.data.periods.len()))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Name", "Color", "Preview"].iter().map(|h| {
        Cell::from(*h).style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    });
    let header = Row::new(header_cells).height(1);

    let rows: Vec<Row> = app
        .data
        .periods
        .iter()
        .map(|period| {
            let color = hex_to_color(&period.color);
            Row::new(vec![
                Cell::from(period.name.clone()),
                Cell::from(period.color.clone()),
                Cell::from("████").style(Style::default().fg(color)),
            ])
        })
        .collect();

    let widths = [
        Constraint::Percentage(50),
        Constraint::Percentage(25),
        Constraint::Percentage(25),
    ];

    let table = Table::new(rows, widths)
        .header(header)
        .block(block)
        .row_highlight_style(
            Style::default()
                .bg(Color::Rgb(50, 50, 60))
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("▶ ");

    let mut table_state = app.ui.period_table.clone();
    frame.render_stateful_widget(table, area, &mut table_state);
}

/// Render income types management
fn render_income_types(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(format!(" Income Types ({}) ", app.data.income_types.len()))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Name", "Color", "Preview"].iter().map(|h| {
        Cell::from(*h).style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    });
    let header = Row::new(header_cells).height(1);

    let rows: Vec<Row> = app
        .data
        .income_types
        .iter()
        .map(|it| {
            let color = hex_to_color(&it.color);
            Row::new(vec![
                Cell::from(it.name.clone()),
                Cell::from(it.color.clone()),
                Cell::from("████").style(Style::default().fg(color)),
            ])
        })
        .collect();

    let widths = [
        Constraint::Percentage(50),
        Constraint::Percentage(25),
        Constraint::Percentage(25),
    ];

    let table = Table::new(rows, widths)
        .header(header)
        .block(block)
        .row_highlight_style(
            Style::default()
                .bg(Color::Rgb(50, 50, 60))
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("▶ ");

    let mut table_state = app.ui.income_type_table.clone();
    frame.render_stateful_widget(table, area, &mut table_state);
}

/// Render password change form
fn render_password(_app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Change Password ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    let chunks = Layout::vertical([
        Constraint::Length(2), // Current password label
        Constraint::Length(3), // Current password input
        Constraint::Length(2), // New password label
        Constraint::Length(3), // New password input
        Constraint::Length(2), // Confirm password label
        Constraint::Length(3), // Confirm password input
        Constraint::Length(2), // Spacer
        Constraint::Length(1), // Instructions
        Constraint::Min(0),    // Remaining
    ])
    .split(inner);

    // Current password
    let current_label = Paragraph::new("Current Password:").style(Style::default().fg(Color::Gray));
    frame.render_widget(current_label, chunks[0]);

    let current_input = Paragraph::new("********")
        .style(Style::default().fg(Color::DarkGray))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::DarkGray)),
        );
    frame.render_widget(current_input, chunks[1]);

    // New password
    let new_label = Paragraph::new("New Password:").style(Style::default().fg(Color::Gray));
    frame.render_widget(new_label, chunks[2]);

    let new_input = Paragraph::new("Enter new password...")
        .style(Style::default().fg(Color::DarkGray))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::DarkGray)),
        );
    frame.render_widget(new_input, chunks[3]);

    // Confirm password
    let confirm_label = Paragraph::new("Confirm Password:").style(Style::default().fg(Color::Gray));
    frame.render_widget(confirm_label, chunks[4]);

    let confirm_input = Paragraph::new("Confirm new password...")
        .style(Style::default().fg(Color::DarkGray))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::DarkGray)),
        );
    frame.render_widget(confirm_input, chunks[5]);

    // Instructions
    let instructions = Line::from(vec![
        Span::styled("Tab", Style::default().fg(Color::Cyan)),
        Span::raw(": Switch field  "),
        Span::styled("Enter", Style::default().fg(Color::Cyan)),
        Span::raw(": Submit"),
    ]);
    let instructions_para =
        Paragraph::new(instructions).style(Style::default().fg(Color::DarkGray));
    frame.render_widget(instructions_para, chunks[7]);
}

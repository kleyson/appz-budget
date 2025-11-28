use ratatui::{
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Cell, Paragraph, Row, Table},
    Frame,
};

use crate::state::AppState;
use crate::ui::{format_currency, hex_to_color};

/// Render the income tab
pub fn render(app: &AppState, frame: &mut Frame, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Length(3), // Filter bar
        Constraint::Min(5),    // Income table
    ])
    .split(area);

    // Render filter bar
    render_filter_bar(app, frame, chunks[0]);

    // Render income table
    render_income_table(app, frame, chunks[1]);
}

/// Render the filter bar
fn render_filter_bar(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .borders(Borders::BOTTOM)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    let filter_chunks = Layout::horizontal([
        Constraint::Length(20), // Period filter
        Constraint::Min(10),    // Spacer
        Constraint::Length(15), // Add button hint
    ])
    .split(inner);

    // Period filter
    let period_text = app
        .ui
        .period_filter
        .as_ref()
        .map_or("All Periods", |p| p.as_str());
    let period =
        Paragraph::new(format!(" [{}] ", period_text)).style(Style::default().fg(Color::White));
    frame.render_widget(period, filter_chunks[0]);

    // Add hint
    let add_hint = Paragraph::new("[n] Add New").style(Style::default().fg(Color::Cyan));
    frame.render_widget(add_hint, filter_chunks[2]);
}

/// Render the income table
fn render_income_table(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(format!(" Income ({}) ", app.filtered_incomes().len()))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Income Type", "Period", "Budget", "Amount", "Status"]
        .iter()
        .map(|h| {
            Cell::from(*h).style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
        });
    let header = Row::new(header_cells).height(1);

    let filtered_incomes = app.filtered_incomes();
    let rows: Vec<Row> = filtered_incomes
        .iter()
        .map(|income| {
            // Find income type name and color
            let (type_name, type_color) = app
                .data
                .income_types
                .iter()
                .find(|it| it.id == income.income_type_id)
                .map(|it| (it.name.clone(), hex_to_color(&it.color)))
                .unwrap_or(("Unknown".to_string(), Color::White));

            // Find period color
            let period_color = app
                .data
                .periods
                .iter()
                .find(|p| p.name == income.period)
                .map(|p| hex_to_color(&p.color))
                .unwrap_or(Color::White);

            // Status
            let pct = if income.budget > 0.0 {
                (income.amount / income.budget * 100.0) as i32
            } else {
                0
            };
            let status_cell = if pct >= 100 {
                Cell::from(format!("{}%", pct)).style(Style::default().fg(Color::Green))
            } else if pct >= 75 {
                Cell::from(format!("{}%", pct)).style(Style::default().fg(Color::Yellow))
            } else {
                Cell::from(format!("{}%", pct)).style(Style::default().fg(Color::Red))
            };

            Row::new(vec![
                Cell::from(type_name).style(Style::default().fg(type_color)),
                Cell::from(income.period.clone()).style(Style::default().fg(period_color)),
                Cell::from(format_currency(income.budget)),
                Cell::from(format_currency(income.amount)),
                status_cell,
            ])
        })
        .collect();

    let widths = [
        Constraint::Percentage(25),
        Constraint::Percentage(20),
        Constraint::Percentage(20),
        Constraint::Percentage(20),
        Constraint::Percentage(15),
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

    let mut table_state = app.ui.income_table.clone();
    frame.render_stateful_widget(table, area, &mut table_state);
}

use ratatui::{
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Cell, Paragraph, Row, Table},
    Frame,
};

use crate::state::AppState;
use crate::ui::{format_currency, hex_to_color};

/// Render the expenses tab
pub fn render(app: &AppState, frame: &mut Frame, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Length(3), // Filter bar
        Constraint::Min(5),    // Expense table
    ])
    .split(area);

    // Render filter bar
    render_filter_bar(app, frame, chunks[0]);

    // Render expense table
    render_expense_table(app, frame, chunks[1]);
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
        Constraint::Length(20), // Category filter
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

    // Category filter
    let category_text = app
        .ui
        .category_filter
        .as_ref()
        .map_or("All Categories", |c| c.as_str());
    let category =
        Paragraph::new(format!(" [{}] ", category_text)).style(Style::default().fg(Color::White));
    frame.render_widget(category, filter_chunks[1]);

    // Add hint
    let add_hint = Paragraph::new("[n] Add New").style(Style::default().fg(Color::Cyan));
    frame.render_widget(add_hint, filter_chunks[3]);
}

/// Render the expense table
fn render_expense_table(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(format!(" Expenses ({}) ", app.filtered_expenses().len()))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Name", "Period", "Category", "Budget", "Cost", "Status"]
        .iter()
        .map(|h| {
            Cell::from(*h).style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
        });
    let header = Row::new(header_cells).height(1);

    let filtered_expenses = app.filtered_expenses();
    let rows: Vec<Row> = filtered_expenses
        .iter()
        .map(|expense| {
            // Find category color
            let category_color = app
                .data
                .categories
                .iter()
                .find(|c| c.name == expense.category)
                .map(|c| hex_to_color(&c.color))
                .unwrap_or(Color::White);

            // Find period color
            let period_color = app
                .data
                .periods
                .iter()
                .find(|p| p.name == expense.period)
                .map(|p| hex_to_color(&p.color))
                .unwrap_or(Color::White);

            // Status
            let over_budget = expense.cost > expense.budget;
            let status_cell = if over_budget {
                Cell::from("Over").style(Style::default().fg(Color::Red))
            } else {
                Cell::from("OK").style(Style::default().fg(Color::Green))
            };

            Row::new(vec![
                Cell::from(expense.expense_name.clone()),
                Cell::from(expense.period.clone()).style(Style::default().fg(period_color)),
                Cell::from(expense.category.clone()).style(Style::default().fg(category_color)),
                Cell::from(format_currency(expense.budget)),
                Cell::from(format_currency(expense.cost)),
                status_cell,
            ])
        })
        .collect();

    let widths = [
        Constraint::Percentage(25),
        Constraint::Percentage(15),
        Constraint::Percentage(15),
        Constraint::Percentage(15),
        Constraint::Percentage(15),
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

    // Create a mutable copy of table state for rendering
    let mut table_state = app.ui.expense_table.clone();
    frame.render_stateful_widget(table, area, &mut table_state);
}

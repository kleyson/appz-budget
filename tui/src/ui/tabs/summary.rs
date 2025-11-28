use ratatui::{
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Cell, Paragraph, Row, Table},
    Frame,
};

use crate::state::AppState;
use crate::ui::format_currency;

/// Render the summary tab
pub fn render(app: &AppState, frame: &mut Frame, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Length(7),  // Summary cards
        Constraint::Length(1),  // Spacer
        Constraint::Length(10), // Period summary table
        Constraint::Length(1),  // Spacer
        Constraint::Min(8),     // Category and Income tables
    ])
    .split(area);

    // Render summary cards
    render_summary_cards(app, frame, chunks[0]);

    // Render period summary table
    render_period_summary(app, frame, chunks[2]);

    // Split tables area horizontally
    let table_chunks = Layout::horizontal([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(chunks[4]);

    // Render category summary table
    render_category_summary(app, frame, table_chunks[0]);

    // Render income type summary table
    render_income_summary(app, frame, table_chunks[1]);
}

/// Render the summary cards (income, expenses, balance)
fn render_summary_cards(app: &AppState, frame: &mut Frame, area: Rect) {
    let card_chunks = Layout::horizontal([
        Constraint::Ratio(1, 3),
        Constraint::Ratio(1, 3),
        Constraint::Ratio(1, 3),
    ])
    .split(area);

    if let Some(ref totals) = app.data.summary_totals {
        // Income card
        let income_pct = if totals.total_budgeted_income > 0.0 {
            (totals.total_current_income / totals.total_budgeted_income * 100.0).min(100.0)
        } else {
            0.0
        };
        render_card(
            frame,
            card_chunks[0],
            "Income",
            &format_currency(totals.total_current_income),
            &format!("of {}", format_currency(totals.total_budgeted_income)),
            income_pct,
            Color::Green,
        );

        // Expenses card
        let expense_pct = if totals.total_budgeted_expenses > 0.0 {
            (totals.total_current_expenses / totals.total_budgeted_expenses * 100.0).min(100.0)
        } else {
            0.0
        };
        let expense_color = if totals.expenses_over_budget() {
            Color::Red
        } else {
            Color::Yellow
        };
        render_card(
            frame,
            card_chunks[1],
            "Expenses",
            &format_currency(totals.total_current_expenses),
            &format!("of {}", format_currency(totals.total_budgeted_expenses)),
            expense_pct,
            expense_color,
        );

        // Balance card
        let balance = totals.balance_current();
        let balance_color = if balance >= 0.0 {
            Color::Green
        } else {
            Color::Red
        };
        let budgeted_balance = totals.balance_budgeted();
        let balance_pct = if budgeted_balance > 0.0 {
            (balance / budgeted_balance * 100.0).clamp(0.0, 100.0)
        } else {
            0.0
        };
        render_card(
            frame,
            card_chunks[2],
            "Balance",
            &format_currency(balance),
            &format!("of {}", format_currency(budgeted_balance)),
            balance_pct,
            balance_color,
        );
    } else {
        // No data
        let no_data = Paragraph::new("No data available")
            .style(Style::default().fg(Color::DarkGray))
            .block(Block::default().borders(Borders::ALL));
        frame.render_widget(no_data, area);
    }
}

/// Render a single summary card
fn render_card(
    frame: &mut Frame,
    area: Rect,
    title: &str,
    value: &str,
    subtitle: &str,
    percentage: f64,
    color: Color,
) {
    let block = Block::default()
        .title(format!(" {} ", title))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    let chunks = Layout::vertical([
        Constraint::Length(2), // Value
        Constraint::Length(1), // Subtitle
        Constraint::Length(1), // Progress bar
    ])
    .split(inner);

    // Value
    let value_para =
        Paragraph::new(value).style(Style::default().fg(color).add_modifier(Modifier::BOLD));
    frame.render_widget(value_para, chunks[0]);

    // Subtitle
    let subtitle_para = Paragraph::new(subtitle).style(Style::default().fg(Color::DarkGray));
    frame.render_widget(subtitle_para, chunks[1]);

    // Progress bar
    let bar_width = chunks[2].width.saturating_sub(2);
    let filled_width = ((percentage / 100.0) * bar_width as f64) as usize;
    let empty_width = bar_width as usize - filled_width;

    let bar_spans = vec![
        Span::styled("█".repeat(filled_width), Style::default().fg(color)),
        Span::styled(
            "░".repeat(empty_width),
            Style::default().fg(Color::DarkGray),
        ),
    ];
    let bar = Paragraph::new(Line::from(bar_spans));
    frame.render_widget(bar, chunks[2]);
}

/// Render the period summary table
fn render_period_summary(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Summary by Period ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Period", "Income", "Expenses", "Difference"]
        .iter()
        .map(|h| {
            Cell::from(*h).style(
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )
        });
    let header = Row::new(header_cells).height(1);

    let mut rows: Vec<Row> = if let Some(ref period_summary) = app.data.period_summary {
        period_summary
            .periods
            .iter()
            .map(|ps| {
                let diff_color = if ps.difference >= 0.0 {
                    Color::Green
                } else {
                    Color::Red
                };
                Row::new(vec![
                    Cell::from(ps.period.clone()),
                    Cell::from(format_currency(ps.total_income))
                        .style(Style::default().fg(Color::Green)),
                    Cell::from(format_currency(ps.total_expenses))
                        .style(Style::default().fg(Color::Red)),
                    Cell::from(format_currency(ps.difference)).style(Style::default().fg(diff_color)),
                ])
            })
            .collect()
    } else {
        vec![]
    };

    // Add totals row
    if let Some(ref period_summary) = app.data.period_summary {
        let total_diff_color = if period_summary.grand_total_difference >= 0.0 {
            Color::Green
        } else {
            Color::Red
        };
        let total_row = Row::new(vec![
            Cell::from("Total").style(Style::default().add_modifier(Modifier::BOLD)),
            Cell::from(format_currency(period_summary.grand_total_income))
                .style(Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
            Cell::from(format_currency(period_summary.grand_total_expenses))
                .style(Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
            Cell::from(format_currency(period_summary.grand_total_difference))
                .style(Style::default().fg(total_diff_color).add_modifier(Modifier::BOLD)),
        ]);
        rows.push(total_row);
    }

    let table = Table::new(
        rows,
        [
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(25),
        ],
    )
    .header(header)
    .block(block);

    frame.render_widget(table, area);
}

/// Render the category summary table
fn render_category_summary(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Expenses by Category ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Category", "Budget", "Total", "Status"].iter().map(|h| {
        Cell::from(*h).style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    });
    let header = Row::new(header_cells).height(1);

    let rows: Vec<Row> = app
        .data
        .category_summary
        .iter()
        .map(|cs| {
            let status = if cs.over_budget {
                Cell::from("Over Budget").style(Style::default().fg(Color::Red))
            } else {
                Cell::from("On Budget").style(Style::default().fg(Color::Green))
            };
            Row::new(vec![
                Cell::from(cs.category.clone()),
                Cell::from(format_currency(cs.budget)),
                Cell::from(format_currency(cs.total)),
                status,
            ])
        })
        .collect();

    let table = Table::new(
        rows,
        [
            Constraint::Percentage(30),
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(20),
        ],
    )
    .header(header)
    .block(block);

    frame.render_widget(table, area);
}

/// Render the income type summary table
fn render_income_summary(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Income by Type ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let header_cells = ["Income Type", "Budget", "Total"].iter().map(|h| {
        Cell::from(*h).style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    });
    let header = Row::new(header_cells).height(1);

    let rows: Vec<Row> = app
        .data
        .income_type_summary
        .iter()
        .map(|its| {
            Row::new(vec![
                Cell::from(its.income_type.clone()),
                Cell::from(format_currency(its.budget)),
                Cell::from(format_currency(its.total)),
            ])
        })
        .collect();

    let table = Table::new(
        rows,
        [
            Constraint::Percentage(40),
            Constraint::Percentage(30),
            Constraint::Percentage(30),
        ],
    )
    .header(header)
    .block(block);

    frame.render_widget(table, area);
}

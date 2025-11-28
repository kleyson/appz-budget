use ratatui::{
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Frame,
};

use crate::state::AppState;
use crate::ui::{format_currency, hex_to_color};

/// Render the charts tab
pub fn render(app: &AppState, frame: &mut Frame, area: Rect) {
    let chunks = Layout::vertical([
        Constraint::Percentage(50), // Budget vs Actual chart
        Constraint::Percentage(50), // Category distribution
    ])
    .split(area);

    render_budget_vs_actual(app, frame, chunks[0]);
    render_expense_distribution(app, frame, chunks[1]);
}

/// Render budget vs actual bar chart
fn render_budget_vs_actual(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Budget vs Actual by Category ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    if app.data.category_summary.is_empty() {
        let no_data =
            Paragraph::new("No data available").style(Style::default().fg(Color::DarkGray));
        frame.render_widget(no_data, inner);
        return;
    }

    // Find max budget for scaling
    let max_value = app
        .data
        .category_summary
        .iter()
        .map(|cs| cs.budget.max(cs.total))
        .fold(0.0f64, |a, b| a.max(b));

    if max_value == 0.0 {
        let no_data = Paragraph::new("No budget data").style(Style::default().fg(Color::DarkGray));
        frame.render_widget(no_data, inner);
        return;
    }

    // Calculate row height
    let row_height = if !app.data.category_summary.is_empty() {
        (inner.height as usize / app.data.category_summary.len()).max(2)
    } else {
        2
    };

    let mut y_offset = inner.y;
    for cs in &app.data.category_summary {
        if y_offset >= inner.y + inner.height {
            break;
        }

        let bar_width = inner.width.saturating_sub(25); // Leave room for label and values

        // Calculate bar lengths
        let budget_len = ((cs.budget / max_value) * bar_width as f64) as usize;
        let actual_len = ((cs.total / max_value) * bar_width as f64) as usize;

        // Get category color
        let cat_color = app
            .data
            .categories
            .iter()
            .find(|c| c.name == cs.category)
            .map(|c| hex_to_color(&c.color))
            .unwrap_or(Color::White);

        // Category label
        let label = format!("{:12}", truncate_str(&cs.category, 12));
        let label_span = Span::styled(label, Style::default().fg(cat_color));

        // Build the bar
        let mut bar_spans = vec![label_span, Span::raw(" ")];

        // Actual bar (filled)
        let actual_bar = "█".repeat(actual_len.min(bar_width as usize));
        let actual_color = if cs.over_budget {
            Color::Red
        } else {
            Color::Green
        };
        bar_spans.push(Span::styled(actual_bar, Style::default().fg(actual_color)));

        // Remaining budget (unfilled)
        if budget_len > actual_len {
            let remaining = "░".repeat(budget_len - actual_len);
            bar_spans.push(Span::styled(
                remaining,
                Style::default().fg(Color::DarkGray),
            ));
        }

        // Values
        let values = format!(
            " {} / {}",
            format_currency(cs.total),
            format_currency(cs.budget)
        );
        let value_color = if cs.over_budget {
            Color::Red
        } else {
            Color::White
        };
        bar_spans.push(Span::styled(values, Style::default().fg(value_color)));

        // Over budget indicator
        if cs.over_budget {
            bar_spans.push(Span::styled(" ⚠", Style::default().fg(Color::Red)));
        }

        let line = Line::from(bar_spans);
        let row_area = Rect {
            x: inner.x,
            y: y_offset,
            width: inner.width,
            height: 1,
        };
        let para = Paragraph::new(line);
        frame.render_widget(para, row_area);

        y_offset += row_height as u16;
    }

    // Legend
    if y_offset < inner.y + inner.height {
        let legend_y = inner.y + inner.height - 2;
        let legend = Line::from(vec![
            Span::styled("█", Style::default().fg(Color::Green)),
            Span::raw(" Actual  "),
            Span::styled("░", Style::default().fg(Color::DarkGray)),
            Span::raw(" Budget  "),
            Span::styled("⚠", Style::default().fg(Color::Red)),
            Span::raw(" Over Budget"),
        ]);
        let legend_area = Rect {
            x: inner.x,
            y: legend_y,
            width: inner.width,
            height: 1,
        };
        let legend_para = Paragraph::new(legend).style(Style::default().fg(Color::DarkGray));
        frame.render_widget(legend_para, legend_area);
    }
}

/// Render expense distribution (simple text-based representation)
fn render_expense_distribution(app: &AppState, frame: &mut Frame, area: Rect) {
    let block = Block::default()
        .title(" Expense Distribution ")
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    if app.data.category_summary.is_empty() {
        let no_data =
            Paragraph::new("No data available").style(Style::default().fg(Color::DarkGray));
        frame.render_widget(no_data, inner);
        return;
    }

    // Calculate total
    let total: f64 = app.data.category_summary.iter().map(|cs| cs.total).sum();

    if total == 0.0 {
        let no_data =
            Paragraph::new("No expenses recorded").style(Style::default().fg(Color::DarkGray));
        frame.render_widget(no_data, inner);
        return;
    }

    // Build percentage bars
    let mut lines: Vec<Line> = Vec::new();
    for cs in &app.data.category_summary {
        let pct = (cs.total / total * 100.0) as i32;
        let bar_width = (inner.width as usize).saturating_sub(30);
        let filled_len = ((pct as f64 / 100.0) * bar_width as f64) as usize;

        // Get category color
        let cat_color = app
            .data
            .categories
            .iter()
            .find(|c| c.name == cs.category)
            .map(|c| hex_to_color(&c.color))
            .unwrap_or(Color::White);

        let label = format!("{:12}", truncate_str(&cs.category, 12));
        let bar = "█".repeat(filled_len);
        let pct_str = format!(" {:>3}% ({})", pct, format_currency(cs.total));

        lines.push(Line::from(vec![
            Span::styled(label, Style::default().fg(cat_color)),
            Span::raw(" "),
            Span::styled(bar, Style::default().fg(cat_color)),
            Span::styled(pct_str, Style::default().fg(Color::White)),
        ]));
    }

    // Add total line
    lines.push(Line::from(""));
    lines.push(Line::from(vec![Span::styled(
        format!("Total: {}", format_currency(total)),
        Style::default()
            .fg(Color::White)
            .add_modifier(Modifier::BOLD),
    )]));

    let paragraph = Paragraph::new(lines);
    frame.render_widget(paragraph, inner);
}

/// Truncate a string to a maximum length
fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len.saturating_sub(3)])
    }
}

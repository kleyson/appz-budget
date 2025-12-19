//! Budget TUI - Terminal User Interface for Budget Management
//!
//! This library provides the core components for a terminal-based budget
//! management application built with Ratatui.

pub mod api;
pub mod app;
pub mod config;
pub mod event;
pub mod models;
pub mod state;
pub mod ui;

pub use models::*;
pub use state::*;

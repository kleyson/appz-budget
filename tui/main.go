package main

import (
	"fmt"
	"os"

	"github.com/appz/budget-tui/internal/config"
	"github.com/appz/budget-tui/internal/ui"
	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Create the app
	app := ui.NewApp(cfg)

	// Run the program
	p := tea.NewProgram(app, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error running program: %v\n", err)
		os.Exit(1)
	}
}

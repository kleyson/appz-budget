package ui

import (
	"github.com/charmbracelet/lipgloss"
)

// Color palette - Modern dark theme inspired by Catppuccin Mocha
var (
	// Base colors
	ColorBase    = lipgloss.Color("#1e1e2e")
	ColorSurface = lipgloss.Color("#313244")
	ColorOverlay = lipgloss.Color("#45475a")
	ColorText    = lipgloss.Color("#cdd6f4")
	ColorSubtext = lipgloss.Color("#a6adc8")
	ColorMuted   = lipgloss.Color("#6c7086")

	// Accent colors
	ColorPrimary   = lipgloss.Color("#89b4fa") // Blue
	ColorSecondary = lipgloss.Color("#f5c2e7") // Pink
	ColorSuccess   = lipgloss.Color("#a6e3a1") // Green
	ColorWarning   = lipgloss.Color("#f9e2af") // Yellow
	ColorDanger    = lipgloss.Color("#f38ba8") // Red
	ColorInfo      = lipgloss.Color("#89dceb") // Teal

	// Category/Period colors
	ColorPurple   = lipgloss.Color("#cba6f7")
	ColorPeach    = lipgloss.Color("#fab387")
	ColorMaroon   = lipgloss.Color("#eba0ac")
	ColorLavender = lipgloss.Color("#b4befe")
)

// Styles
var (
	// App container
	AppStyle = lipgloss.NewStyle().
			Background(ColorBase).
			Foreground(ColorText)

	// Header
	HeaderStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			Padding(1, 2).
			MarginBottom(1)

	LogoStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary)

	// Titles
	TitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorText).
			Padding(0, 1)

	SubtitleStyle = lipgloss.NewStyle().
			Foreground(ColorSubtext).
			Padding(0, 1)

	// Navigation tabs
	TabStyle = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(0, 2)

	ActiveTabStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			Border(lipgloss.NormalBorder(), false, false, true, false).
			BorderForeground(ColorPrimary).
			Padding(0, 2)

	// Cards/Boxes
	CardStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorOverlay).
			Padding(1, 2).
			MarginRight(1).
			MarginBottom(1)

	CardTitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorText).
			MarginBottom(1)

	// Input fields
	InputStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorOverlay).
			Padding(0, 1).
			Width(40)

	InputFocusedStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorPrimary).
				Padding(0, 1).
				Width(40)

	InputLabelStyle = lipgloss.NewStyle().
			Foreground(ColorSubtext).
			MarginBottom(0)

	// Buttons
	ButtonStyle = lipgloss.NewStyle().
			Foreground(ColorBase).
			Background(ColorPrimary).
			Padding(0, 3).
			MarginRight(1)

	ButtonFocusedStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSecondary).
				Bold(true).
				Padding(0, 3).
				MarginRight(1)

	ButtonDangerStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorDanger).
				Padding(0, 3).
				MarginRight(1)

	ButtonSuccessStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSuccess).
				Padding(0, 3).
				MarginRight(1)

	// Table styles
	TableHeaderStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(ColorPrimary).
				Border(lipgloss.NormalBorder(), false, false, true, false).
				BorderForeground(ColorOverlay).
				Padding(0, 1)

	TableRowStyle = lipgloss.NewStyle().
			Foreground(ColorText).
			Padding(0, 1)

	TableRowSelectedStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorPrimary).
				Padding(0, 1)

	// List items
	ListItemStyle = lipgloss.NewStyle().
			Foreground(ColorText).
			Padding(0, 2)

	ListItemSelectedStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary).
				Bold(true).
				Padding(0, 2)

	// Status indicators
	SuccessStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess)

	WarningStyle = lipgloss.NewStyle().
			Foreground(ColorWarning)

	DangerStyle = lipgloss.NewStyle().
			Foreground(ColorDanger)

	InfoStyle = lipgloss.NewStyle().
			Foreground(ColorInfo)

	// Money values
	MoneyPositiveStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess)

	MoneyNegativeStyle = lipgloss.NewStyle().
				Foreground(ColorDanger)

	MoneyNeutralStyle = lipgloss.NewStyle().
				Foreground(ColorText)

	// Progress bar
	ProgressBarStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary)

	ProgressBarOverBudgetStyle = lipgloss.NewStyle().
					Foreground(ColorDanger)

	// Help text
	HelpStyle = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(1, 2)

	// Error/Message styles
	ErrorStyle = lipgloss.NewStyle().
			Foreground(ColorDanger).
			Bold(true).
			Padding(0, 1)

	MessageStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Padding(0, 1)

	// Modal/Dialog
	ModalStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorPrimary).
			Background(ColorSurface).
			Padding(2, 4)

	ModalTitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			MarginBottom(1)

	// Sidebar
	SidebarStyle = lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), false, true, false, false).
			BorderForeground(ColorOverlay).
			Padding(1, 2).
			Width(25)

	SidebarItemStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Padding(0, 1)

	SidebarItemSelectedStyle = lipgloss.NewStyle().
					Foreground(ColorPrimary).
					Bold(true).
					Padding(0, 1)

	// Badges
	BadgeStyle = lipgloss.NewStyle().
			Foreground(ColorBase).
			Background(ColorPrimary).
			Padding(0, 1)

	BadgeSuccessStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSuccess).
				Padding(0, 1)

	BadgeWarningStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorWarning).
				Padding(0, 1)

	BadgeDangerStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorDanger).
				Padding(0, 1)

	// Divider
	DividerStyle = lipgloss.NewStyle().
			Foreground(ColorOverlay)
)

// Helper functions

func RenderDivider(width int) string {
	line := ""
	for i := 0; i < width; i++ {
		line += "─"
	}
	return DividerStyle.Render(line)
}

func RenderProgressBar(current, total float64, width int) string {
	if total == 0 {
		return ""
	}

	percentage := current / total
	if percentage > 1 {
		percentage = 1
	}

	filled := int(float64(width) * percentage)
	empty := width - filled

	bar := ""
	style := ProgressBarStyle
	if current > total {
		style = ProgressBarOverBudgetStyle
	}

	for i := 0; i < filled; i++ {
		bar += "█"
	}
	for i := 0; i < empty; i++ {
		bar += "░"
	}

	return style.Render(bar)
}

func FormatMoney(amount float64) string {
	if amount >= 0 {
		return MoneyPositiveStyle.Render(formatCurrency(amount))
	}
	return MoneyNegativeStyle.Render(formatCurrency(amount))
}

func formatCurrency(amount float64) string {
	negative := amount < 0
	if negative {
		amount = -amount
	}

	result := "$"
	if negative {
		result = "-$"
	}

	// Format with thousand separators
	whole := int64(amount)
	cents := int64((amount - float64(whole)) * 100)

	// Add commas
	str := ""
	for whole > 0 || str == "" {
		if str != "" && len(str)%4 == 3 {
			str = "," + str
		}
		str = string(rune('0'+whole%10)) + str
		whole /= 10
	}

	return result + str + "." + string(rune('0'+cents/10)) + string(rune('0'+cents%10))
}

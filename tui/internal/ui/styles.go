package ui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// ═══════════════════════════════════════════════════════════════════════════════
// LUXE TERMINAL - Refined Finance Theme
// A sophisticated, premium terminal aesthetic with deep rich colors and
// elegant typography inspired by high-end fintech applications
// ═══════════════════════════════════════════════════════════════════════════════

// Color palette - Luxe Terminal Theme
var (
	// ─────────────────────────────────────────────────────────────────────────
	// BASE COLORS - Deep, rich foundation
	// ─────────────────────────────────────────────────────────────────────────
	ColorBase       = lipgloss.Color("#0f172a") // Deep navy black
	ColorSurface    = lipgloss.Color("#1e293b") // Elevated slate
	ColorSurfaceAlt = lipgloss.Color("#334155") // Card backgrounds
	ColorOverlay    = lipgloss.Color("#475569") // Borders, dividers
	ColorOverlayDim = lipgloss.Color("#334155") // Subtle borders

	// ─────────────────────────────────────────────────────────────────────────
	// TEXT COLORS - Refined hierarchy
	// ─────────────────────────────────────────────────────────────────────────
	ColorText        = lipgloss.Color("#f8fafc") // Pure white text
	ColorTextBright  = lipgloss.Color("#ffffff") // Bright highlights
	ColorSubtext     = lipgloss.Color("#cbd5e1") // Secondary text
	ColorMuted       = lipgloss.Color("#64748b") // Tertiary/disabled
	ColorPlaceholder = lipgloss.Color("#475569") // Input placeholders

	// ─────────────────────────────────────────────────────────────────────────
	// PRIMARY - Indigo Blues (Brand)
	// ─────────────────────────────────────────────────────────────────────────
	ColorPrimary       = lipgloss.Color("#818cf8") // Primary indigo
	ColorPrimaryBright = lipgloss.Color("#a5b4fc") // Lighter variant
	ColorPrimaryDim    = lipgloss.Color("#6366f1") // Darker variant
	ColorPrimaryBg     = lipgloss.Color("#312e81") // Background tint

	// ─────────────────────────────────────────────────────────────────────────
	// SECONDARY - Warm Amber (Accents)
	// ─────────────────────────────────────────────────────────────────────────
	ColorSecondary       = lipgloss.Color("#fbbf24") // Golden amber
	ColorSecondaryBright = lipgloss.Color("#fcd34d") // Light gold
	ColorSecondaryDim    = lipgloss.Color("#f59e0b") // Rich amber

	// ─────────────────────────────────────────────────────────────────────────
	// SEMANTIC COLORS - Status indicators
	// ─────────────────────────────────────────────────────────────────────────
	ColorSuccess    = lipgloss.Color("#34d399") // Emerald green
	ColorSuccessDim = lipgloss.Color("#10b981") // Deep emerald
	ColorWarning    = lipgloss.Color("#fbbf24") // Amber warning
	ColorWarningDim = lipgloss.Color("#f59e0b") // Deep amber
	ColorDanger     = lipgloss.Color("#f87171") // Soft red
	ColorDangerDim  = lipgloss.Color("#ef4444") // Vivid red
	ColorInfo       = lipgloss.Color("#38bdf8") // Sky blue
	ColorInfoDim    = lipgloss.Color("#0ea5e9") // Deep sky

	// ─────────────────────────────────────────────────────────────────────────
	// CATEGORY/ACCENT COLORS - Rich palette
	// ─────────────────────────────────────────────────────────────────────────
	ColorPurple   = lipgloss.Color("#a78bfa") // Violet
	ColorPeach    = lipgloss.Color("#fb923c") // Orange peach
	ColorMaroon   = lipgloss.Color("#fb7185") // Rose pink
	ColorLavender = lipgloss.Color("#c4b5fd") // Light purple
	ColorTeal     = lipgloss.Color("#2dd4bf") // Teal
	ColorCyan     = lipgloss.Color("#22d3ee") // Cyan
)

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

var (
	// ─────────────────────────────────────────────────────────────────────────
	// APP CONTAINER
	// ─────────────────────────────────────────────────────────────────────────
	AppStyle = lipgloss.NewStyle().
			Background(ColorBase).
			Foreground(ColorText)

	// ─────────────────────────────────────────────────────────────────────────
	// HEADER & BRANDING
	// ─────────────────────────────────────────────────────────────────────────
	HeaderStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			Padding(1, 2).
			MarginBottom(1)

	LogoStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorSecondary)

	LogoAccentStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary)

	VersionStyle = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Italic(true)

	// ─────────────────────────────────────────────────────────────────────────
	// TITLES & HEADINGS
	// ─────────────────────────────────────────────────────────────────────────
	TitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorText).
			Padding(0, 1)

	TitleLargeStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorTextBright).
			Padding(0, 1)

	SubtitleStyle = lipgloss.NewStyle().
			Foreground(ColorSubtext).
			Padding(0, 1)

	SectionTitleStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(ColorPrimary).
				MarginBottom(1)

	// ─────────────────────────────────────────────────────────────────────────
	// NAVIGATION TABS - Refined pill-style
	// ─────────────────────────────────────────────────────────────────────────
	TabContainerStyle = lipgloss.NewStyle().
				Background(ColorSurface).
				Padding(0, 1).
				MarginBottom(1)

	TabStyle = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(0, 3)

	ActiveTabStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorBase).
			Background(ColorPrimary).
			Padding(0, 3)

	TabHoverStyle = lipgloss.NewStyle().
			Foreground(ColorPrimaryBright).
			Padding(0, 3)

	// ─────────────────────────────────────────────────────────────────────────
	// CARDS & CONTAINERS
	// ─────────────────────────────────────────────────────────────────────────
	CardStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorOverlayDim).
			Padding(1, 2).
			MarginRight(1).
			MarginBottom(1)

	CardHighlightStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorPrimary).
				Padding(1, 2).
				MarginRight(1).
				MarginBottom(1)

	CardTitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorText).
			MarginBottom(1)

	CardValueStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorTextBright)

	CardLabelStyle = lipgloss.NewStyle().
			Foreground(ColorMuted)

	// ─────────────────────────────────────────────────────────────────────────
	// INPUT FIELDS - Modern floating label style
	// ─────────────────────────────────────────────────────────────────────────
	InputStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorOverlay).
			Foreground(ColorText).
			Padding(0, 1).
			Width(40)

	InputFocusedStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorPrimary).
				Foreground(ColorText).
				Padding(0, 1).
				Width(40)

	InputErrorStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorDanger).
			Foreground(ColorText).
			Padding(0, 1).
			Width(40)

	InputLabelStyle = lipgloss.NewStyle().
			Foreground(ColorSubtext).
			MarginBottom(0)

	InputLabelFocusedStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary).
				MarginBottom(0)

	// ─────────────────────────────────────────────────────────────────────────
	// BUTTONS - Gradient-inspired solid colors
	// ─────────────────────────────────────────────────────────────────────────
	ButtonStyle = lipgloss.NewStyle().
			Foreground(ColorBase).
			Background(ColorPrimary).
			Bold(true).
			Padding(0, 3).
			MarginRight(1)

	ButtonFocusedStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSecondary).
				Bold(true).
				Padding(0, 3).
				MarginRight(1)

	ButtonSecondaryStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Background(ColorSurfaceAlt).
				Padding(0, 3).
				MarginRight(1)

	ButtonDangerStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorDanger).
				Bold(true).
				Padding(0, 3).
				MarginRight(1)

	ButtonSuccessStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSuccess).
				Bold(true).
				Padding(0, 3).
				MarginRight(1)

	ButtonGhostStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary).
				Background(ColorBase).
				Padding(0, 3).
				MarginRight(1)

	// ─────────────────────────────────────────────────────────────────────────
	// TABLE STYLES - Clean data presentation
	// ─────────────────────────────────────────────────────────────────────────
	TableHeaderStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(ColorSubtext).
				Background(ColorSurface).
				Padding(0, 1)

	TableRowStyle = lipgloss.NewStyle().
			Foreground(ColorText).
			Padding(0, 1)

	TableRowAltStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Background(ColorSurface).
				Padding(0, 1)

	TableRowSelectedStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorPrimary).
				Bold(true).
				Padding(0, 1)

	TableRowHoverStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Background(ColorSurfaceAlt).
				Padding(0, 1)

	// ─────────────────────────────────────────────────────────────────────────
	// LIST ITEMS
	// ─────────────────────────────────────────────────────────────────────────
	ListItemStyle = lipgloss.NewStyle().
			Foreground(ColorText).
			Padding(0, 2)

	ListItemSelectedStyle = lipgloss.NewStyle().
				Foreground(ColorPrimaryBright).
				Bold(true).
				Padding(0, 2)

	ListItemDimStyle = lipgloss.NewStyle().
				Foreground(ColorMuted).
				Padding(0, 2)

	// ─────────────────────────────────────────────────────────────────────────
	// STATUS INDICATORS
	// ─────────────────────────────────────────────────────────────────────────
	SuccessStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess)

	SuccessBoldStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess).
				Bold(true)

	WarningStyle = lipgloss.NewStyle().
			Foreground(ColorWarning)

	WarningBoldStyle = lipgloss.NewStyle().
				Foreground(ColorWarning).
				Bold(true)

	DangerStyle = lipgloss.NewStyle().
			Foreground(ColorDanger)

	DangerBoldStyle = lipgloss.NewStyle().
			Foreground(ColorDanger).
			Bold(true)

	InfoStyle = lipgloss.NewStyle().
			Foreground(ColorInfo)

	InfoBoldStyle = lipgloss.NewStyle().
			Foreground(ColorInfo).
			Bold(true)

	// ─────────────────────────────────────────────────────────────────────────
	// MONEY VALUES - Financial display
	// ─────────────────────────────────────────────────────────────────────────
	MoneyPositiveStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess).
				Bold(true)

	MoneyNegativeStyle = lipgloss.NewStyle().
				Foreground(ColorDanger).
				Bold(true)

	MoneyNeutralStyle = lipgloss.NewStyle().
				Foreground(ColorText)

	MoneyLargeStyle = lipgloss.NewStyle().
			Foreground(ColorTextBright).
			Bold(true)

	// ─────────────────────────────────────────────────────────────────────────
	// PROGRESS BAR
	// ─────────────────────────────────────────────────────────────────────────
	ProgressBarStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary)

	ProgressBarSuccessStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess)

	ProgressBarWarningStyle = lipgloss.NewStyle().
				Foreground(ColorWarning)

	ProgressBarOverBudgetStyle = lipgloss.NewStyle().
					Foreground(ColorDanger)

	ProgressBarBgStyle = lipgloss.NewStyle().
				Foreground(ColorOverlayDim)

	// ─────────────────────────────────────────────────────────────────────────
	// HELP TEXT
	// ─────────────────────────────────────────────────────────────────────────
	HelpStyle = lipgloss.NewStyle().
			Foreground(ColorMuted).
			Padding(0, 2)

	HelpKeyStyle = lipgloss.NewStyle().
			Foreground(ColorPrimary).
			Bold(true)

	HelpDescStyle = lipgloss.NewStyle().
			Foreground(ColorMuted)

	// ─────────────────────────────────────────────────────────────────────────
	// ERROR/MESSAGE STYLES
	// ─────────────────────────────────────────────────────────────────────────
	ErrorStyle = lipgloss.NewStyle().
			Foreground(ColorDanger).
			Bold(true).
			Padding(0, 1)

	ErrorBoxStyle = lipgloss.NewStyle().
			Foreground(ColorDanger).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorDanger).
			Padding(0, 2)

	MessageStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Padding(0, 1)

	MessageBoxStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorSuccess).
			Padding(0, 2)

	// ─────────────────────────────────────────────────────────────────────────
	// MODAL/DIALOG
	// ─────────────────────────────────────────────────────────────────────────
	ModalStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorPrimary).
			Background(ColorSurface).
			Padding(2, 4)

	ModalDangerStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorDanger).
				Background(ColorSurface).
				Padding(2, 4)

	ModalTitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			MarginBottom(1)

	ModalTitleDangerStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(ColorDanger).
				MarginBottom(1)

	// ─────────────────────────────────────────────────────────────────────────
	// SIDEBAR
	// ─────────────────────────────────────────────────────────────────────────
	SidebarStyle = lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), false, true, false, false).
			BorderForeground(ColorOverlayDim).
			Background(ColorSurface).
			Padding(1, 2).
			Width(25)

	SidebarItemStyle = lipgloss.NewStyle().
				Foreground(ColorSubtext).
				Padding(0, 1)

	SidebarItemSelectedStyle = lipgloss.NewStyle().
					Foreground(ColorPrimary).
					Bold(true).
					Padding(0, 1)

	SidebarItemActiveStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorPrimary).
				Bold(true).
				Padding(0, 1)

	// ─────────────────────────────────────────────────────────────────────────
	// BADGES - Status chips
	// ─────────────────────────────────────────────────────────────────────────
	BadgeStyle = lipgloss.NewStyle().
			Foreground(ColorBase).
			Background(ColorPrimary).
			Bold(true).
			Padding(0, 1)

	BadgeSuccessStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorSuccess).
				Bold(true).
				Padding(0, 1)

	BadgeWarningStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorWarning).
				Bold(true).
				Padding(0, 1)

	BadgeDangerStyle = lipgloss.NewStyle().
				Foreground(ColorBase).
				Background(ColorDanger).
				Bold(true).
				Padding(0, 1)

	BadgeInfoStyle = lipgloss.NewStyle().
			Foreground(ColorBase).
			Background(ColorInfo).
			Bold(true).
			Padding(0, 1)

	BadgeSecondaryStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Background(ColorSurfaceAlt).
				Padding(0, 1)

	// ─────────────────────────────────────────────────────────────────────────
	// DIVIDER
	// ─────────────────────────────────────────────────────────────────────────
	DividerStyle = lipgloss.NewStyle().
			Foreground(ColorOverlayDim)

	DividerBrightStyle = lipgloss.NewStyle().
				Foreground(ColorOverlay)

	// ─────────────────────────────────────────────────────────────────────────
	// LOADING/SPINNER
	// ─────────────────────────────────────────────────────────────────────────
	LoadingStyle = lipgloss.NewStyle().
			Foreground(ColorPrimary).
			Bold(true)

	SpinnerStyle = lipgloss.NewStyle().
			Foreground(ColorSecondary)
)

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// RenderDivider creates a horizontal line divider
func RenderDivider(width int) string {
	line := strings.Repeat("─", width)
	return DividerStyle.Render(line)
}

// RenderDoubleDivider creates a double-line divider
func RenderDoubleDivider(width int) string {
	line := strings.Repeat("═", width)
	return DividerStyle.Render(line)
}

// RenderDottedDivider creates a dotted divider
func RenderDottedDivider(width int) string {
	line := strings.Repeat("┄", width)
	return DividerStyle.Render(line)
}

// RenderProgressBar creates a visual progress bar with improved aesthetics
func RenderProgressBar(current, total float64, width int) string {
	if total == 0 {
		return ProgressBarBgStyle.Render(strings.Repeat("░", width))
	}

	percentage := current / total
	if percentage > 1 {
		percentage = 1
	}

	filled := int(float64(width) * percentage)
	empty := width - filled

	// Choose style based on percentage
	var style lipgloss.Style
	if current > total {
		style = ProgressBarOverBudgetStyle
	} else if percentage >= 0.9 {
		style = ProgressBarWarningStyle
	} else if percentage >= 0.5 {
		style = ProgressBarStyle
	} else {
		style = ProgressBarSuccessStyle
	}

	bar := ""
	for i := 0; i < filled; i++ {
		bar += "█"
	}

	emptyBar := ""
	for i := 0; i < empty; i++ {
		emptyBar += "░"
	}

	return style.Render(bar) + ProgressBarBgStyle.Render(emptyBar)
}

// RenderSlimProgressBar creates a thin progress bar
func RenderSlimProgressBar(current, total float64, width int) string {
	if total == 0 {
		return ProgressBarBgStyle.Render(strings.Repeat("─", width))
	}

	percentage := current / total
	if percentage > 1 {
		percentage = 1
	}

	filled := int(float64(width) * percentage)
	empty := width - filled

	var style lipgloss.Style
	if current > total {
		style = ProgressBarOverBudgetStyle
	} else if percentage >= 0.9 {
		style = ProgressBarWarningStyle
	} else {
		style = ProgressBarStyle
	}

	bar := strings.Repeat("━", filled)
	emptyBar := strings.Repeat("─", empty)

	return style.Render(bar) + ProgressBarBgStyle.Render(emptyBar)
}

// FormatMoney formats and styles a money value
func FormatMoney(amount float64) string {
	formatted := formatCurrency(amount)
	if amount > 0 {
		return MoneyPositiveStyle.Render(formatted)
	} else if amount < 0 {
		return MoneyNegativeStyle.Render(formatted)
	}
	return MoneyNeutralStyle.Render(formatted)
}

// FormatMoneyPlain formats currency without color styling
func FormatMoneyPlain(amount float64) string {
	return formatCurrency(amount)
}

// FormatMoneyLarge formats a large money display
func FormatMoneyLarge(amount float64) string {
	formatted := formatCurrency(amount)
	if amount >= 0 {
		return MoneyPositiveStyle.Render(formatted)
	}
	return MoneyNegativeStyle.Render(formatted)
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
	cents := int64((amount-float64(whole))*100 + 0.5) // Round cents

	// Handle overflow
	if cents >= 100 {
		whole++
		cents -= 100
	}

	// Add commas for thousands
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

// RenderKeyHint formats a keyboard shortcut hint
func RenderKeyHint(key, description string) string {
	return HelpKeyStyle.Render(key) + HelpDescStyle.Render(": "+description)
}

// RenderStatusDot returns a colored status indicator dot
func RenderStatusDot(status string) string {
	switch status {
	case "success", "ok", "good":
		return SuccessStyle.Render("●")
	case "warning", "near":
		return WarningStyle.Render("●")
	case "danger", "error", "over":
		return DangerStyle.Render("●")
	case "info":
		return InfoStyle.Render("●")
	default:
		return lipgloss.NewStyle().Foreground(ColorMuted).Render("○")
	}
}

// RenderStatusBadge returns a styled status badge
func RenderStatusBadge(status, text string) string {
	switch status {
	case "success":
		return BadgeSuccessStyle.Render(text)
	case "warning":
		return BadgeWarningStyle.Render(text)
	case "danger":
		return BadgeDangerStyle.Render(text)
	case "info":
		return BadgeInfoStyle.Render(text)
	default:
		return BadgeSecondaryStyle.Render(text)
	}
}

// Box characters for custom borders
var (
	BoxTopLeft     = "╭"
	BoxTopRight    = "╮"
	BoxBottomLeft  = "╰"
	BoxBottomRight = "╯"
	BoxHorizontal  = "─"
	BoxVertical    = "│"
	BoxTLeft       = "├"
	BoxTRight      = "┤"
	BoxTTop        = "┬"
	BoxTBottom     = "┴"
	BoxCross       = "┼"
)

// RenderBox creates a custom box around content
func RenderBox(content string, width int, title string) string {
	lines := strings.Split(content, "\n")

	// Top border with optional title
	topBorder := BoxTopLeft
	if title != "" {
		titleStyled := lipgloss.NewStyle().Bold(true).Foreground(ColorPrimary).Render(" " + title + " ")
		titleLen := lipgloss.Width(titleStyled)
		topBorder += strings.Repeat(BoxHorizontal, 2)
		topBorder += titleStyled
		remaining := width - 4 - titleLen
		if remaining > 0 {
			topBorder += strings.Repeat(BoxHorizontal, remaining)
		}
	} else {
		topBorder += strings.Repeat(BoxHorizontal, width-2)
	}
	topBorder += BoxTopRight

	// Content lines
	var boxedLines []string
	boxedLines = append(boxedLines, DividerStyle.Render(topBorder))

	for _, line := range lines {
		lineWidth := lipgloss.Width(line)
		padding := width - 4 - lineWidth
		if padding < 0 {
			padding = 0
		}
		boxedLine := DividerStyle.Render(BoxVertical) + " " + line + strings.Repeat(" ", padding) + " " + DividerStyle.Render(BoxVertical)
		boxedLines = append(boxedLines, boxedLine)
	}

	// Bottom border
	bottomBorder := BoxBottomLeft + strings.Repeat(BoxHorizontal, width-2) + BoxBottomRight
	boxedLines = append(boxedLines, DividerStyle.Render(bottomBorder))

	return strings.Join(boxedLines, "\n")
}

// RenderAccentLine creates a colored accent line (like gradient bar effect)
func RenderAccentLine(width int, color lipgloss.Color) string {
	return lipgloss.NewStyle().Foreground(color).Render(strings.Repeat("▀", width))
}

// GetPercentageColor returns appropriate color based on percentage and type
func GetPercentageColor(percentage float64, isExpense bool) lipgloss.Color {
	if isExpense {
		if percentage > 100 {
			return ColorDanger
		} else if percentage >= 90 {
			return ColorWarning
		}
		return ColorSuccess
	}
	// For income
	if percentage >= 100 {
		return ColorSuccess
	} else if percentage >= 50 {
		return ColorInfo
	}
	return ColorWarning
}

// Emoji/Icon helpers for consistent iconography
const (
	IconMoney       = "💰"
	IconIncome      = "💵"
	IconChart       = "📊"
	IconCalendar    = "📅"
	IconSettings    = "⚙️"
	IconUser        = "👤"
	IconFolder      = "📁"
	IconCheck       = "✓"
	IconCross       = "✗"
	IconWarning     = "⚠"
	IconInfo        = "ℹ"
	IconArrowUp     = "↑"
	IconArrowDown   = "↓"
	IconArrowLeft   = "←"
	IconArrowRight  = "→"
	IconBullet      = "•"
	IconStar        = "★"
	IconDiamond     = "◆"
	IconSquare      = "■"
	IconCircle      = "●"
	IconCircleEmpty = "○"
)

// RenderIcon returns a styled icon
func RenderIcon(icon string, color lipgloss.Color) string {
	return lipgloss.NewStyle().Foreground(color).Render(icon)
}

// RenderPercentage formats a percentage with appropriate styling
func RenderPercentage(value float64, isExpense bool) string {
	color := GetPercentageColor(value, isExpense)
	return lipgloss.NewStyle().Foreground(color).Render(fmt.Sprintf("%.1f%%", value))
}

package ui

import (
	"github.com/appz/budget-tui/internal/api"
	"github.com/appz/budget-tui/internal/config"
	"github.com/appz/budget-tui/internal/models"
	tea "github.com/charmbracelet/bubbletea"
)

// AppState represents the current state of the app
type AppState int

const (
	StateLogin AppState = iota
	StateMain
)

// App is the main application model
type App struct {
	config *config.Config
	client *api.Client
	state  AppState
	user   *models.User

	// Sub-models
	login LoginModel
	main  MainModel

	width  int
	height int
}

// NewApp creates a new application
func NewApp(cfg *config.Config) *App {
	client := api.NewClient(cfg)

	return &App{
		config: cfg,
		client: client,
		state:  StateLogin,
		login:  NewLoginModel(client, cfg),
	}
}

func (a *App) Init() tea.Cmd {
	return a.login.Init()
}

func (a *App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		a.width = msg.Width
		a.height = msg.Height

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return a, tea.Quit
		}

	case LoginSuccessMsg:
		a.user = msg.User
		a.state = StateMain
		a.main = NewMainModel(a.client, a.user, a.config, a.width, a.height)
		return a, a.main.Init()

	case LogoutMsg:
		a.client.ClearToken()
		a.user = nil
		a.state = StateLogin
		a.login = NewLoginModel(a.client, a.config)
		return a, a.login.Init()
	}

	// Route to current view
	var cmd tea.Cmd
	switch a.state {
	case StateLogin:
		var model tea.Model
		model, cmd = a.login.Update(msg)
		a.login = model.(LoginModel)

	case StateMain:
		var model tea.Model
		model, cmd = a.main.Update(msg)
		a.main = model.(MainModel)
	}

	return a, cmd
}

func (a *App) View() string {
	switch a.state {
	case StateLogin:
		return a.login.View()
	case StateMain:
		return a.main.View()
	default:
		return "Loading..."
	}
}

// LogoutMsg signals a logout
type LogoutMsg struct{}

func Logout() tea.Msg {
	return LogoutMsg{}
}

package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/appz/budget-tui/internal/config"
	"github.com/appz/budget-tui/internal/models"
)

// Client is the API client
type Client struct {
	baseURL    string
	apiKey     string
	clientInfo string
	token      string
	httpClient *http.Client
}

// NewClient creates a new API client
func NewClient(cfg *config.Config) *Client {
	return &Client{
		baseURL:    cfg.APIBaseURL,
		apiKey:     cfg.APIKey,
		clientInfo: cfg.ClientInfo,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SetToken sets the authentication token
func (c *Client) SetToken(token string) {
	c.token = token
}

// GetToken returns the current token
func (c *Client) GetToken() string {
	return c.token
}

// ClearToken clears the authentication token
func (c *Client) ClearToken() {
	c.token = ""
}

// SetBaseURL updates the API base URL
func (c *Client) SetBaseURL(url string) {
	c.baseURL = url
}

// SetAPIKey updates the API key
func (c *Client) SetAPIKey(key string) {
	c.apiKey = key
}

// IsAuthenticated returns true if authenticated
func (c *Client) IsAuthenticated() bool {
	return c.token != ""
}

func (c *Client) doRequest(method, path string, body interface{}, result interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request: %w", err)
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest(method, c.baseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}
	req.Header.Set("X-Client-Info", c.clientInfo)
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errResp struct {
			Detail string `json:"detail"`
		}
		if json.Unmarshal(respBody, &errResp) == nil && errResp.Detail != "" {
			return fmt.Errorf("%s", errResp.Detail)
		}
		return fmt.Errorf("API error: %d - %s", resp.StatusCode, string(respBody))
	}

	if result != nil && len(respBody) > 0 {
		if err := json.Unmarshal(respBody, result); err != nil {
			return fmt.Errorf("failed to parse response: %w", err)
		}
	}

	return nil
}

// Auth methods

// Login authenticates a user
func (c *Client) Login(email, password string) (*models.TokenResponse, error) {
	var result models.TokenResponse
	err := c.doRequest("POST", "/api/v1/auth/login", &models.UserLogin{
		Email:    email,
		Password: password,
	}, &result)
	if err != nil {
		return nil, err
	}
	c.token = result.AccessToken
	return &result, nil
}

// GetMe returns the current user
func (c *Client) GetMe() (*models.User, error) {
	var result models.User
	err := c.doRequest("GET", "/api/v1/auth/me", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// ChangePassword changes the user's password
func (c *Client) ChangePassword(currentPassword, newPassword string) error {
	return c.doRequest("POST", "/api/v1/auth/change-password", &models.ChangePasswordRequest{
		CurrentPassword: currentPassword,
		NewPassword:     newPassword,
	}, nil)
}

// Month methods

// GetMonths returns all months
func (c *Client) GetMonths() ([]models.Month, error) {
	var result []models.Month
	err := c.doRequest("GET", "/api/v1/months", nil, &result)
	return result, err
}

// GetCurrentMonth returns the current month
func (c *Client) GetCurrentMonth() (*models.Month, error) {
	var result models.Month
	err := c.doRequest("GET", "/api/v1/months/current", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateMonth creates a new month
func (c *Client) CreateMonth(year, month int) (*models.Month, error) {
	var result models.Month
	err := c.doRequest("POST", "/api/v1/months", &models.MonthCreate{
		Year:  year,
		Month: month,
	}, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteMonth deletes a month
func (c *Client) DeleteMonth(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/months/%d", id), nil, nil)
}

// Expense methods

// GetExpenses returns expenses with optional filters
func (c *Client) GetExpenses(monthID *int, period, category *string) ([]models.Expense, error) {
	path := "/api/v1/expenses"
	params := url.Values{}
	if monthID != nil {
		params.Set("month_id", strconv.Itoa(*monthID))
	}
	if period != nil && *period != "" {
		params.Set("period", *period)
	}
	if category != nil && *category != "" {
		params.Set("category", *category)
	}
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var result []models.Expense
	err := c.doRequest("GET", path, nil, &result)
	return result, err
}

// CreateExpense creates a new expense
func (c *Client) CreateExpense(expense *models.ExpenseCreate) (*models.Expense, error) {
	var result models.Expense
	err := c.doRequest("POST", "/api/v1/expenses", expense, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateExpense updates an expense
func (c *Client) UpdateExpense(id int, expense *models.ExpenseUpdate) (*models.Expense, error) {
	var result models.Expense
	err := c.doRequest("PUT", fmt.Sprintf("/api/v1/expenses/%d", id), expense, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteExpense deletes an expense
func (c *Client) DeleteExpense(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/expenses/%d", id), nil, nil)
}

// CloneToNextMonth clones expenses to the next month
func (c *Client) CloneToNextMonth(monthID int) (*models.CloneResponse, error) {
	var result models.CloneResponse
	err := c.doRequest("POST", fmt.Sprintf("/api/v1/expenses/clone-to-next-month/%d", monthID), nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Income methods

// GetIncomes returns incomes with optional filters
func (c *Client) GetIncomes(monthID *int, period *string) ([]models.Income, error) {
	path := "/api/v1/incomes"
	params := url.Values{}
	if monthID != nil {
		params.Set("month_id", strconv.Itoa(*monthID))
	}
	if period != nil && *period != "" {
		params.Set("period", *period)
	}
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var result []models.Income
	err := c.doRequest("GET", path, nil, &result)
	return result, err
}

// CreateIncome creates a new income
func (c *Client) CreateIncome(income *models.IncomeCreate) (*models.Income, error) {
	var result models.Income
	err := c.doRequest("POST", "/api/v1/incomes", income, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateIncome updates an income
func (c *Client) UpdateIncome(id int, income *models.IncomeUpdate) (*models.Income, error) {
	var result models.Income
	err := c.doRequest("PUT", fmt.Sprintf("/api/v1/incomes/%d", id), income, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteIncome deletes an income
func (c *Client) DeleteIncome(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/incomes/%d", id), nil, nil)
}

// Category methods

// GetCategories returns all categories
func (c *Client) GetCategories() ([]models.Category, error) {
	var result []models.Category
	err := c.doRequest("GET", "/api/v1/categories", nil, &result)
	return result, err
}

// GetCategorySummary returns category summary
func (c *Client) GetCategorySummary(monthID *int) ([]models.CategorySummary, error) {
	path := "/api/v1/categories/summary"
	if monthID != nil {
		path += "?month_id=" + strconv.Itoa(*monthID)
	}
	var result []models.CategorySummary
	err := c.doRequest("GET", path, nil, &result)
	return result, err
}

// CreateCategory creates a new category
func (c *Client) CreateCategory(category *models.CategoryCreate) (*models.Category, error) {
	var result models.Category
	err := c.doRequest("POST", "/api/v1/categories", category, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateCategory updates a category
func (c *Client) UpdateCategory(id int, category *models.CategoryUpdate) (*models.Category, error) {
	var result models.Category
	err := c.doRequest("PUT", fmt.Sprintf("/api/v1/categories/%d", id), category, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteCategory deletes a category
func (c *Client) DeleteCategory(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/categories/%d", id), nil, nil)
}

// Period methods

// GetPeriods returns all periods
func (c *Client) GetPeriods() ([]models.Period, error) {
	var result []models.Period
	err := c.doRequest("GET", "/api/v1/periods", nil, &result)
	return result, err
}

// CreatePeriod creates a new period
func (c *Client) CreatePeriod(period *models.PeriodCreate) (*models.Period, error) {
	var result models.Period
	err := c.doRequest("POST", "/api/v1/periods", period, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdatePeriod updates a period
func (c *Client) UpdatePeriod(id int, period *models.PeriodUpdate) (*models.Period, error) {
	var result models.Period
	err := c.doRequest("PUT", fmt.Sprintf("/api/v1/periods/%d", id), period, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeletePeriod deletes a period
func (c *Client) DeletePeriod(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/periods/%d", id), nil, nil)
}

// Income Type methods

// GetIncomeTypes returns all income types
func (c *Client) GetIncomeTypes() ([]models.IncomeType, error) {
	var result []models.IncomeType
	err := c.doRequest("GET", "/api/v1/income-types", nil, &result)
	return result, err
}

// GetIncomeTypeSummary returns income type summary
func (c *Client) GetIncomeTypeSummary(monthID *int, period *string) ([]models.IncomeTypeSummary, error) {
	path := "/api/v1/income-types/summary"
	params := url.Values{}
	if monthID != nil {
		params.Set("month_id", strconv.Itoa(*monthID))
	}
	if period != nil && *period != "" {
		params.Set("period", *period)
	}
	if len(params) > 0 {
		path += "?" + params.Encode()
	}
	var result []models.IncomeTypeSummary
	err := c.doRequest("GET", path, nil, &result)
	return result, err
}

// CreateIncomeType creates a new income type
func (c *Client) CreateIncomeType(incomeType *models.IncomeTypeCreate) (*models.IncomeType, error) {
	var result models.IncomeType
	err := c.doRequest("POST", "/api/v1/income-types", incomeType, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateIncomeType updates an income type
func (c *Client) UpdateIncomeType(id int, incomeType *models.IncomeTypeUpdate) (*models.IncomeType, error) {
	var result models.IncomeType
	err := c.doRequest("PUT", fmt.Sprintf("/api/v1/income-types/%d", id), incomeType, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteIncomeType deletes an income type
func (c *Client) DeleteIncomeType(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/income-types/%d", id), nil, nil)
}

// Summary methods

// GetSummaryTotals returns summary totals
func (c *Client) GetSummaryTotals(monthID *int, period *string) (*models.SummaryTotals, error) {
	path := "/api/v1/summary/totals"
	params := url.Values{}
	if monthID != nil {
		params.Set("month_id", strconv.Itoa(*monthID))
	}
	if period != nil && *period != "" {
		params.Set("period", *period)
	}
	if len(params) > 0 {
		path += "?" + params.Encode()
	}
	var result models.SummaryTotals
	err := c.doRequest("GET", path, nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// User methods (admin only)

// GetUsers returns all users
func (c *Client) GetUsers() ([]models.User, error) {
	var result []models.User
	err := c.doRequest("GET", "/api/v1/auth/users", nil, &result)
	return result, err
}

// DeleteUser deletes a user
func (c *Client) DeleteUser(id int) error {
	return c.doRequest("DELETE", fmt.Sprintf("/api/v1/auth/users/%d", id), nil, nil)
}

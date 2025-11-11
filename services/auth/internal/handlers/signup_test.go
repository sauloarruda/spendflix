package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"services/auth/internal/models"
	"services/auth/internal/testhelpers"

	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockSignupService is a mock implementation of SignupServiceInterface
type MockSignupService struct {
	mock.Mock
}

func (m *MockSignupService) Signup(ctx context.Context, name, email string) (*models.User, error) {
	args := m.Called(ctx, name, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func TestSignupHandler_Handle_Success(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	reqBody := `{"name": "John Doe", "email": "john@example.com"}`
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    reqBody,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	expectedUser := &models.User{
		ID:    1,
		Name:  "John Doe",
		Email: "john@example.com",
	}

	mockService.On("Signup", ctx, "John Doe", "john@example.com").Return(expectedUser, nil)

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Headers["Content-Type"])

	var response models.SignupResponse
	err = json.Unmarshal([]byte(resp.Body), &response)
	require.NoError(t, err)
	assert.Equal(t, expectedUser.ID, response.ID)
	assert.Equal(t, expectedUser.Name, response.Name)
	assert.Equal(t, expectedUser.Email, response.Email)

	mockService.AssertExpectations(t)
}

func TestSignupHandler_Handle_InvalidJSON(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    `{"invalid": json}`,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var errorResp map[string]string
	err = json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "Invalid request body", errorResp["error"])

	mockService.AssertNotCalled(t, "Signup")
}

func TestSignupHandler_Handle_MissingName(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    `{"email": "john@example.com"}`,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var errorResp map[string]string
	err = json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "Name and email are required", errorResp["error"])

	mockService.AssertNotCalled(t, "Signup")
}

func TestSignupHandler_Handle_MissingEmail(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    `{"name": "John Doe"}`,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var errorResp map[string]string
	err = json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "Name and email are required", errorResp["error"])

	mockService.AssertNotCalled(t, "Signup")
}

func TestSignupHandler_Handle_DuplicateEmail(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    `{"name": "John Doe", "email": "existing@example.com"}`,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	mockService.On("Signup", ctx, "John Doe", "existing@example.com").
		Return(nil, errors.New("user with this email already exists"))

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 409, resp.StatusCode)

	var errorResp map[string]string
	err = json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "user with this email already exists", errorResp["error"])

	mockService.AssertExpectations(t)
}

func TestSignupHandler_Handle_ServiceError(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    `{"name": "John Doe", "email": "john@example.com"}`,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	mockService.On("Signup", ctx, "John Doe", "john@example.com").
		Return(nil, errors.New("internal service error"))

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)

	var errorResp map[string]string
	err = json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "internal service error", errorResp["error"])

	mockService.AssertExpectations(t)
}

func TestSignupHandler_Handle_EmptyBody(t *testing.T) {
	mockService := new(MockSignupService)
	handler := NewSignupHandlerWithService(mockService)

	ctx := context.Background()
	req := events.APIGatewayV2HTTPRequest{
		RawPath: "/auth/sign-up",
		Body:    "",
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: "POST",
			},
		},
	}

	resp, err := handler.Handle(ctx, req)

	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	mockService.AssertNotCalled(t, "Signup")
}

func TestErrorResponse(t *testing.T) {
	resp := errorResponse(404, "Not found")

	assert.Equal(t, 404, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Headers["Content-Type"])

	var errorResp map[string]string
	err := json.Unmarshal([]byte(resp.Body), &errorResp)
	require.NoError(t, err)
	assert.Equal(t, "Not found", errorResp["error"])
}

// Helper function to create handler with mock service for testing
func NewSignupHandlerWithService(service testhelpers.SignupServiceInterface) *SignupHandler {
	return NewSignupHandlerWithInterface(service)
}


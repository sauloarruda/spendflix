package handlers

import (
	"context"
	"encoding/json"
	"services/auth/internal/models"
	"services/auth/internal/services"
	"services/auth/internal/testhelpers"

	"github.com/aws/aws-lambda-go/events"
)

// SignupServiceInterface defines the interface for signup service (aliased for convenience)
type SignupServiceInterface = testhelpers.SignupServiceInterface

type SignupHandler struct {
	signupService SignupServiceInterface
}

func NewSignupHandler(signupService *services.SignupService) *SignupHandler {
	return NewSignupHandlerWithInterface(signupService)
}

// NewSignupHandlerWithInterface creates a handler with an interface-based service
// This allows for easier testing with mocks
func NewSignupHandlerWithInterface(signupService SignupServiceInterface) *SignupHandler {
	return &SignupHandler{
		signupService: signupService,
	}
}

func (h *SignupHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Parse request body
	var signupReq models.SignupRequest
	if err := json.Unmarshal([]byte(req.Body), &signupReq); err != nil {
		return errorResponse(400, "Invalid request body"), nil
	}

	// Validate fields
	if signupReq.Name == "" || signupReq.Email == "" {
		return errorResponse(400, "Name and email are required"), nil
	}

	// Call service
	user, err := h.signupService.Signup(ctx, signupReq.Name, signupReq.Email)
	if err != nil {
		// Check if it's a duplicate email error
		if err.Error() == "user with this email already exists" {
			return errorResponse(409, err.Error()), nil
		}
		return errorResponse(500, err.Error()), nil
	}

	// Prepare response
	response := models.SignupResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}

	body, err := json.Marshal(response)
	if err != nil {
		return errorResponse(500, "Failed to marshal response"), nil
	}

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 201,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func errorResponse(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{"error": message})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}
}

package handlers

import (
	"context"
	"encoding/json"
	"github.com/aws/aws-lambda-go/events"
)

type SignupHandler struct{}

func NewSignupHandler() *SignupHandler {
	return &SignupHandler{}
}

func (h *SignupHandler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Example response as requested
	response := map[string]interface{}{
		"user": map[string]interface{}{
			"id":    1,
			"name":  "Example User",
			"email": "example@spendflix.com",
		},
		"token": "example-token-12345",
	}

	body, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayV2HTTPResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Failed to marshal response"}`,
		}, nil
	}

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 201,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}


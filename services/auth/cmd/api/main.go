package main

import (
	"context"
	"os"
	"services/auth/internal/handlers"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var signupHandler *handlers.SignupHandler

func init() {
	signupHandler = handlers.NewSignupHandler()
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Simple routing based on path
	switch req.RawPath {
	case "/auth/sign-up":
		if req.RequestContext.HTTP.Method == "POST" {
			return signupHandler.Handle(ctx, req)
		}
		return events.APIGatewayV2HTTPResponse{
			StatusCode: 405,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Method not allowed"}`,
		}, nil
	default:
		return events.APIGatewayV2HTTPResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Not found"}`,
		}, nil
	}
}

func main() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		// Running as Lambda
		lambda.Start(handler)
	} else {
		// Running locally (for testing)
		lambda.Start(handler)
	}
}


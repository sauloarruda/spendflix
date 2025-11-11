package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"services/auth/internal/config"
	"services/auth/internal/handlers"
	"services/auth/internal/repositories"
	"services/auth/internal/services"
	"syscall"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	signupHandler *handlers.SignupHandler
	dbPool        *pgxpool.Pool
)

func init() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	dbPool = db

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)

	// Initialize services
	signupService := services.NewSignupService(userRepo, cfg.EncryptionSecret)

	// Initialize handlers
	signupHandler = handlers.NewSignupHandler(signupService)
}

func cleanup() {
	if dbPool != nil {
		log.Println("Closing database connection pool...")
		dbPool.Close()
	}
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

// Lambda handler wrapper that ensures cleanup on context cancellation
func lambdaHandler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// In Lambda, the pool is kept alive for container reuse
	// But we handle context cancellation properly
	select {
	case <-ctx.Done():
		return events.APIGatewayV2HTTPResponse{
			StatusCode: 503,
			Body:       `{"error": "Request cancelled"}`,
		}, ctx.Err()
	default:
		return handler(ctx, req)
	}
}

func main() {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") != "" {
		// Running as Lambda
		// Note: In Lambda, the connection pool is kept alive for container reuse
		// The pool will be closed when the container is terminated by AWS
		lambda.Start(lambdaHandler)
	} else {
		// Running locally (for testing)
		// Setup signal handling for graceful shutdown
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

		go func() {
			<-sigChan
			log.Println("Shutting down...")
			cleanup()
			os.Exit(0)
		}()

		// Ensure cleanup on exit
		defer cleanup()

		startLocalServer()
	}
}

func startLocalServer() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	http.HandleFunc("/auth/sign-up", func(w http.ResponseWriter, r *http.Request) {
		// Read request body
		body := ""
		if r.Body != nil {
			bodyBytes, err := io.ReadAll(r.Body)
			if err == nil {
				body = string(bodyBytes)
			}
		}

		// Create APIGatewayV2HTTPRequest
		req := events.APIGatewayV2HTTPRequest{
			RawPath:        r.URL.Path,
			RawQueryString: r.URL.RawQuery,
			Headers:        make(map[string]string),
			Body:           body,
			RequestContext: events.APIGatewayV2HTTPRequestContext{
				HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
					Method: r.Method,
					Path:   r.URL.Path,
				},
			},
		}

		// Copy headers
		for k, v := range r.Header {
			if len(v) > 0 {
				req.Headers[k] = v[0]
			}
		}

		// Call handler
		ctx := context.Background()
		resp, err := handler(ctx, req)
		if err != nil {
			log.Printf("Handler error: %v", err)
			w.WriteHeader(500)
			w.Write([]byte(`{"error": "Internal server error"}`))
			return
		}

		// Write response
		for k, v := range resp.Headers {
			w.Header().Set(k, v)
		}
		w.WriteHeader(resp.StatusCode)
		w.Write([]byte(resp.Body))
	})

	log.Printf("Server starting on port %s", port)
	log.Printf("Test endpoint: POST http://localhost:%s/auth/sign-up", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

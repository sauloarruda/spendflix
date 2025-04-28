// scripts/setup_dynamodb_local/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	containerName = "dynamodb-local"
	imageName     = "amazon/dynamodb-local"
	tableName     = "onboarding"
	endpointURL   = "http://localhost:8000"
)

func main() {
	// 1) Verifica Docker
	// if _, err := exec.LookPath("docker"); err != nil {
	// 	log.Fatalf("Docker not found: %v", err)
	// }

	// 2) Inicia container se não estiver rodando
	// if !isContainerRunning(containerName) {
	// 	fmt.Println("Startind DynamoDB Local in Docker...")
	// 	cmd := exec.Command("docker",
	// 		"run", "--rm", "-d",
	// 		"-p", "8000:8000",
	// 		"--name", containerName,
	// 		imageName,
	// 	)
	// 	if out, err := cmd.CombinedOutput(); err != nil {
	// 		log.Fatalf("Failture starting container: %v\nOutput: %s", err, string(out))
	// 	}
	// 	// dá um tempinho pro container subir
	// 	time.Sleep(3 * time.Second)
	// } else {
	// 	fmt.Println("Container DynamoDB Local is already running.")
	// }

	// 3) Configura AWS SDK para apontar ao endpoint local
	ctx := context.Background()
	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, opts ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: endpointURL}, nil
			},
		)),
	)
	if err != nil {
		log.Fatalf("Error loading AWS config: %v", err)
	}
	client := dynamodb.NewFromConfig(awsCfg)

	// 4) Cria a tabela se não existir
	if !tableExists(ctx, client, tableName) {
		fmt.Printf("Creating table %q...\n", tableName)
		_, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
			TableName: aws.String(tableName),
			AttributeDefinitions: []types.AttributeDefinition{
				{AttributeName: aws.String("email"), AttributeType: types.ScalarAttributeTypeS},
			},
			KeySchema: []types.KeySchemaElement{
				{AttributeName: aws.String("email"), KeyType: types.KeyTypeHash},
			},
			BillingMode: types.BillingModePayPerRequest,
		})
		if err != nil {
			log.Fatalf("Error creating tabela: %v", err)
		}
		fmt.Println("Table created. Waiting status ACTIVE...")
		waitForTableActive(ctx, client, tableName)

		// // 5) Habilita TTL após a tabela estar ativa
		// fmt.Println("Habilitando TTL na tabela...")
		// _, err = client.UpdateTimeToLive(ctx, &dynamodb.UpdateTimeToLiveInput{
		// 	TableName: aws.String(tableName),
		// 	TimeToLiveSpecification: &types.TimeToLiveSpecification{
		// 		AttributeName: aws.String("ttl"),
		// 		Enabled:       aws.Bool(true),
		// 	},
		// })
		// if err != nil {
		// 	log.Fatalf("Erro enabling TTL: %v", err)
		// }
		// fmt.Println("TTL enabled.")
	} else {
		fmt.Printf("Table %q already exists.\n", tableName)
	}

	fmt.Println("DynamoDB Local config finished.")
}

func isContainerRunning(name string) bool {
	cmd := exec.Command("docker", "ps",
		"--filter", "name="+name,
		"--filter", "status=running",
		"--format", "{{.Names}}",
	)
	out, _ := cmd.Output()
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == name {
			return true
		}
	}
	return false
}

func tableExists(ctx context.Context, client *dynamodb.Client, name string) bool {
	_, err := client.DescribeTable(ctx, &dynamodb.DescribeTableInput{
		TableName: aws.String(name),
	})
	return err == nil
}

func waitForTableActive(ctx context.Context, client *dynamodb.Client, name string) {
	for {
		out, err := client.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(name),
		})
		if err == nil && out.Table != nil && out.Table.TableStatus == types.TableStatusActive {
			fmt.Println("Table is ACTIVE.")
			return
		}
		time.Sleep(2 * time.Second)
	}
}
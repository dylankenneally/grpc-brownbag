// Command diner is a Go client for the C# kitchen: it reads the menu (unary) and watches an order cook (server streaming).
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"time"

	lunchv1 "brownbag/gen/lunch/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const prefix = "🟢 Go"

func main() {
	server := flag.String("server", envOr("LUNCH_SERVER_ADDRESS", "localhost:5051"), "kitchen address (host:port)")
	dish := flag.String("dish", "legacy-lasagne", "menu item id to order")
	flag.Parse()

	// insecure = plaintext HTTP/2; fine for a localhost demo, never for production
	connection, err := grpc.NewClient(*server, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("[diner] can't create a client for %s: %v", *server, err)
	}
	defer connection.Close()

	client := lunchv1.NewLunchServiceClient(connection)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := showMenu(ctx, client); err != nil {
		log.Fatalf("[diner] GetMenu failed: %v", err)
	}

	if err := watchOrder(ctx, client, *dish); err != nil {
		log.Fatalf("[diner] WatchOrder failed: %v", err)
	}
}

// showMenu prints the first few dishes.
func showMenu(ctx context.Context, client lunchv1.LunchServiceClient) error {
	menu, err := client.GetMenu(ctx, &lunchv1.GetMenuRequest{})
	if err != nil {
		return err
	}

	fmt.Printf("%s 📜 the C# kitchen has %d dishes, starting with:\n", prefix, len(menu.GetItems()))
	for _, item := range menu.GetItems()[:3] {
		fmt.Printf("   %-34s $%d.%02d\n", item.GetName(), item.GetPriceCents()/100, item.GetPriceCents()%100)
	}

	return nil
}

// watchOrder streams kitchen updates until the dish is ready.
func watchOrder(ctx context.Context, client lunchv1.LunchServiceClient, dish string) error {
	stream, err := client.WatchOrder(ctx, &lunchv1.WatchOrderRequest{ItemId: dish})
	if err != nil {
		return err
	}

	for {
		update, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			return nil
		}

		if err != nil {
			return err
		}

		fmt.Printf("%s %s %s\n", prefix, update.GetStage(), update.GetNote())
	}
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

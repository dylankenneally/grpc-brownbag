// Command foodtruck is a Go implementation of GreeterService: the same contract as the C# kitchen, written in another language.
//
// It listens on plaintext localhost:5052 with server reflection. There is NO authentication and NO TLS; it's a localhost demo.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"strings"

	greeterv1 "brownbag/gen/greeter/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

// greeter implements the generated GreeterServiceServer interface.
type greeter struct {
	// embedding the generated base keeps the server compiling when new methods are added to the .proto
	greeterv1.UnimplementedGreeterServiceServer
}

// SayHello greets the caller from the food truck.
func (greeter) SayHello(_ context.Context, request *greeterv1.SayHelloRequest) (*greeterv1.SayHelloResponse, error) {
	name := strings.TrimSpace(request.GetName())
	if name == "" {
		return nil, status.Error(codes.InvalidArgument, "Even anonymous diners need a name for the coffee cup.")
	}

	log.Printf("👋 %s said hello", name)
	message := fmt.Sprintf("Hello %s, welcome to the Go food truck. We only take cash, and errors are values.", name)
	return &greeterv1.SayHelloResponse{Message: message}, nil
}

func main() {
	port := flag.Int("port", 5052, "port to listen on")
	flag.Parse()
	log.SetFlags(0)

	listener, err := net.Listen("tcp", fmt.Sprintf("localhost:%d", *port))
	if err != nil {
		log.Fatalf("[foodtruck] can't listen on port %d: %v", *port, err)
	}

	server := grpc.NewServer()
	greeterv1.RegisterGreeterServiceServer(server, greeter{})
	reflection.Register(server)

	log.Printf("🚚 Go food truck open: gRPC on http://localhost:%d", *port)
	if err := server.Serve(listener); err != nil {
		log.Fatalf("[foodtruck] stopped serving: %v", err)
	}
}

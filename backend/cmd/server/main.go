package main

import (
	"synapse-server/internal/api/handlers"
	"synapse-server/internal/api/routes"
	"synapse-server/internal/config"
	"github.com/gin-gonic/gin"
)

func main() {
	
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	db, err := config.ConnectDB()
	if err != nil {
		panic("Failed to connect to database")
	}

	h := handlers.NewHandler(db)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK", "message": "Server is running"})
	})

	//setting up routes
	idxRoutes := routes.IndexRoutes{}
	idxRoutes.SetupRoutes(r, h)

	r.Run(":8080")
}
package main

import (
	"synapse-server/internal/api/handlers"
	"synapse-server/internal/api/routes"
	"synapse-server/internal/config"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	
	r := gin.Default()

	// Set max multipart form memory limit (default is 32MB)
	r.MaxMultipartMemory = 100 << 20 // 100MB

	// Add CORS middleware
	// r.Use(func(c *gin.Context) {
	// 	c.Header("Access-Control-Allow-Origin", "*")
	// 	c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	// 	c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
	// 	if c.Request.Method == "OPTIONS" {
	// 		c.AbortWithStatus(204)
	// 		return
	// 	}
		
	// 	c.Next()
	// })

	corsConfig := cors.Config{
			AllowOrigins:     []string{"*"},
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: false, // Must be false when using "*"
			MaxAge:           12 * time.Hour,
		}

	r.Use(cors.New(corsConfig))

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
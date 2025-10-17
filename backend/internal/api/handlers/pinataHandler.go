package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"synapse-server/internal/services"

	"github.com/gin-gonic/gin"
)

func(h *Handler) UploadToPinata(c *gin.Context){
	// single file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "file is required"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(500, gin.H{"error": "opening file"})
		return
	}
	defer f.Close()

	// create a PinataService instance (stateless)
	svc := services.NewPinataService()

	hash, err := svc.UploadFile(filepath.Base(file.Filename), f)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"result": hash})
}

func(h *Handler) FetchFromPinata(c *gin.Context){
	// fetch by ipfs hash param
	hash := c.Query("hash")
	if hash == "" {
		c.JSON(400, gin.H{"error": "hash is required"})
		return
	}

	// If local file (from fallback), serve it
	if len(hash) > 6 && hash[:6] == "local:" {
		localPath := hash[6:]
		if _, err := os.Stat(localPath); err != nil {
			c.JSON(404, gin.H{"error": "local file not found"})
			return
		}
		c.File(localPath)
		return
	}

	// Otherwise redirect to a public gateway
	gateway := fmt.Sprintf("https://gateway.pinata.cloud/ipfs/%s", hash)
	// optional: fetch and proxy
	c.JSON(200, gin.H{"link":gateway})
}
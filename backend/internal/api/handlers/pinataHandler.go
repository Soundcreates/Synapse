package handlers

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"synapse-server/internal/services"

	"github.com/gin-gonic/gin"
)

func(h *Handler) UploadToPinata(c *gin.Context){
	log.Println("Starting file upload to Pinata...")
	
	// single file
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("Error getting form file: %v", err)
		c.JSON(400, gin.H{"error": "file is required", "details": err.Error()})
		return
	}

	log.Printf("File received: %s, Size: %d bytes", file.Filename, file.Size)

	// Check file size (optional - set reasonable limits)
	const maxFileSize = 100 * 1024 * 1024 // 100MB
	if file.Size > maxFileSize {
		log.Printf("File too large: %d bytes", file.Size)
		c.JSON(400, gin.H{"error": "file too large", "maxSize": "100MB"})
		return
	}

	f, err := file.Open()
	if err != nil {
		log.Printf("Error opening file: %v", err)
		c.JSON(500, gin.H{"error": "error opening file", "details": err.Error()})
		return
	}
	defer f.Close()

	// create a PinataService instance (stateless)
	svc := services.NewPinataService()

	log.Println("Uploading to Pinata...")
	hash, err := svc.UploadFile(filepath.Base(file.Filename), f)
	if err != nil {
		log.Printf("Error uploading to Pinata: %v", err)
		c.JSON(500, gin.H{"error": "upload failed", "details": err.Error()})
		return
	}

	log.Printf("Upload successful. Hash: %s", hash)
	c.JSON(200, gin.H{"result": hash, "filename": file.Filename, "size": file.Size})
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
package handlers

import (
	"github.com/gin-gonic/gin"
)

func (h *Handler) GetUsers(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Get all users",
		"data":    []string{},
	})
}
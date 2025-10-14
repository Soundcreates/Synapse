package routes

import (
	"synapse-server/internal/api/handlers"

	"github.com/gin-gonic/gin"
)

type UserRoutes struct {

}

func (u *UserRoutes) SetupUserRoutes(r *gin.RouterGroup, h *handlers.Handler) {
	r.GET("/", h.GetUsers)
	r.GET("/:id", u.GetUserByID)
	r.PUT("/:id", u.UpdateUser)
	r.DELETE("/:id", u.DeleteUser)
}

func (u *UserRoutes) GetUserByID(c *gin.Context) {
	userID := c.Param("id")
	c.JSON(200, gin.H{
		"message": "Get user by ID",
		"userID":  userID,
	})
}

func (u *UserRoutes) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	c.JSON(200, gin.H{
		"message": "User updated",
		"userID":  userID,
	})
}

func (u *UserRoutes) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	c.JSON(200, gin.H{
		"message": "User deleted",
		"userID":  userID,
	})
}


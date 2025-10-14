package routes

import (
	"synapse-server/internal/api/handlers"

	"github.com/gin-gonic/gin"
)

type  AuthRoutes struct {
	
}

func (a *AuthRoutes) SetupAuthRoutes(r *gin.RouterGroup, h *handlers.Handler) {
	r.POST("/login", h.Login)
	r.POST("/register", h.Register)
}
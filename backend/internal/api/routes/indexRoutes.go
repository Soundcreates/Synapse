package routes

import (
	"fmt"
	"synapse-server/internal/api/handlers"

	"github.com/gin-gonic/gin"
)

type IndexRoutes struct {
	
	
	
}

func (i *IndexRoutes) SetupRoutes(r *gin.Engine, h *handlers.Handler) {
	api := r.Group("/api")
	//auth routes
	auth:= api.Group("/auth")
	authRoutes := AuthRoutes{}
	authRoutes.SetupAuthRoutes(auth, h)
	fmt.Println("Auth routes set up")

	//user routes
	user := api.Group("/user")
	userRoutes := UserRoutes{}
	userRoutes.SetupUserRoutes(user, h)
	fmt.Println("User routes set up")
	
	// pinata routes
	pintata := api.Group("/pinata")
	pinataRoutes := PinataRoutes{}
	pinataRoutes.SetupPinataRoutes(pintata, h)

	


}
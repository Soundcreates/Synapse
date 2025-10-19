package routes

import (
	"synapse-server/internal/api/handlers"

	"github.com/gin-gonic/gin"
)

type PinataRoutes struct {

}

func (p *PinataRoutes) SetupPinataRoutes(r *gin.RouterGroup, h *handlers.Handler){
	r.POST("/upload", h.UploadToPinata)
	r.GET("/fetchHash", h.FetchFromPinata)
	
}
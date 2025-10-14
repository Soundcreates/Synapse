package config

import (
	"errors"
	"fmt"
	"log"
	"synapse-server/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func connectDB() (*gorm.DB,error) {
	cfg ,err := config.Load()
	if err !=nil {
		log.Fatal("Error using config vars")
	}
	
	db_host := cfg.DB_HOST
	db_username := cfg.DB_USER
	db_name := cfg.DB_NAME
	db_password := cfg.DB_PASSWORD
	db_port := cfg.DB_PORT

	DbNotConnected := errors.New("Db not connected")

	dsn := 	fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
db_host, db_username, db_name, db_password, db_port)

	db , err :=gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Error Connecting to db")
		return nil, DbNotConnected
	}

	return db,nil

	

}
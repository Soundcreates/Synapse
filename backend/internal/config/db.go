package config

import (
	"errors"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB,error) {
	cfg ,err := Load()
	if err !=nil {
		log.Fatal("Error using config vars:", err)
	}
	
	db_host := cfg.DB_HOST
	db_username := cfg.DB_USER
	db_name := cfg.DB_NAME
	db_password := cfg.DB_PASSWORD
	db_port := cfg.DB_PORT

	// Debug: Print connection details (without password)
	log.Printf("Connecting to database: host=%s user=%s dbname=%s port=%s ", 
		db_host, db_username, db_name, db_port)

	DbNotConnected := errors.New("database not connected")

	dsn := 	fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		db_host, db_username, db_password, db_name, db_port)

	db , err :=gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Printf("Error Connecting to db: %v", err)
		log.Printf("DSN (without password): host=%s user=%s dbname=%s port=%s", 
			db_host, db_username, db_name, db_port)
		return nil, DbNotConnected
	}
	
	log.Println("Connected to database successfully")
	return db,nil
}
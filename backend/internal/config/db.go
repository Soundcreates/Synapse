package config

import (
	"errors"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB,error) {

	ErrDbNotLoaded := errors.New("Database failed to load")

	cfg ,err := Load()
	if err !=nil {
		log.Fatal("Error using config vars:", err)
	}
	
	
	db_host := "127.0.0.1" // Use IPv4 explicitly instead of localhost
	db_username := cfg.DB_USER
	db_name := cfg.DB_NAME
	db_password := cfg.DB_PASSWORD
	db_port := cfg.DB_PORT

	fmt.Printf("Connecting to database with user: %s, host: %s, port: %s, dbname: %s\n", 
		db_username, db_host, db_port, db_name)

	// Try different connection string formats
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		db_host, db_username, db_password, db_name, db_port)

	fmt.Printf("Connection string: %s\n", dsn)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err !=nil {
		fmt.Printf("Database connection error: %v\n", err)
		fmt.Printf("Error: %s\n", ErrDbNotLoaded)

		return nil, err  // Return the actual error instead of ErrDbNotLoaded
	}

	fmt.Println("Db has been loaded succesfully");
	return db,nil

}
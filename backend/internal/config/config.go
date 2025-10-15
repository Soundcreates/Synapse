package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DB_HOST     string `json:"db_host"`
	DB_NAME     string `json:"db_name"`
	DB_USER     string `json:"db_user"`
	DB_PASSWORD string `json:"db_password"`
	DB_PORT     string `json:"db_port"`
	JWTSecret   string `json:"jwt_secret"`
	Port        string `json:"port"`
}

func Load() (*Config,error) {
	EnvNotLoaded := errors.New("Env vars not loaded")
	err := godotenv.Load(".env")
	if err !=nil {
		log.Fatal("Error loading the env vars")
		return nil, EnvNotLoaded
	}

	var cfg Config

	cfg.DB_HOST = os.Getenv("DB_HOST")
	cfg.DB_NAME = os.Getenv("DB_NAME")
	cfg.DB_USER = os.Getenv("DB_USER")
	cfg.DB_PASSWORD = os.Getenv("DB_PASSWORD")
	cfg.DB_PORT = os.Getenv("DB_PORT")
	cfg.JWTSecret = os.Getenv("JWT_SECRET")
	cfg.Port = os.Getenv("PORT")

	log.Println("Env vars loaded successfully")
	return &cfg, nil
}
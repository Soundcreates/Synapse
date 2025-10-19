package main

import(
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"os"
	"io"
	"multipart"
)

type UploadResponse struct {
	Data struct {
		Id        string `json:"id"`
		Name      string `json:"name"`
		Cid       string `json:"cid"`
		Size      int    `json:"size"`
		CreatedAt string `json:"created_at"`
		MimeType  string `json:"mime_type"`
		Network   string `json:"network"`
	}
}

func uploadFile(filePath string) (UploadResponse, error){
	stats, err := os.Stat(filePath)
	if err !=nil {
		return UploadResponse{},errors.New("File does not exist")
	}

	if stats.IsDir() {
		return UploadResponse{}, errors.New("Provided path is a directory, not a file")
	}

	body := bytes.Buffer{}
	writer := multipart.NewWriter(&body)



	file,err := os.Open(filePath)
	if err!=nil {
		return UploadResponse{} , err
	}

	defer file.Close()
	
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err !=nil {
		return UploadResponse{}, err
	}

	_, err = io.Copy(part, file)
	if err !=nil {
		return UploadResponse{}, err
	}

	err = writer.WriteField("network", "public")
	if err !=nil {
		return UploadResponse{}, err
	}

	

}
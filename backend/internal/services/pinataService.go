package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type PinataService struct{
	ApiKey string
	ApiSecret string
	Client *http.Client
}

func NewPinataService() *PinataService{
	key := os.Getenv("PINATA_API_KEY")
	secret := os.Getenv("PINATA_API_SECRET")
	return &PinataService{
		ApiKey: key,
		ApiSecret: secret,
		Client: &http.Client{Timeout: 60 * time.Second},
	}
}

// UploadFile uploads the provided reader as a file to Pinata (pinFileToIPFS).
// If PINATA_API_KEY / PINATA_API_SECRET are not set, it will fall back to saving the file
// locally under ./uploads and return the local path.
func (p *PinataService) UploadFile(filename string, fileReader io.Reader) (string, error) {
	if p.ApiKey == "" || p.ApiSecret == "" {
		// Fallback: save locally
		uploadsDir := "./uploads"
		if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
			return "", fmt.Errorf("creating uploads dir: %w", err)
		}
		dstPath := filepath.Join(uploadsDir, fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(filename)))
		dst, err := os.Create(dstPath)
		if err != nil {
			return "", fmt.Errorf("creating local file: %w", err)
		}
		defer dst.Close()
		if _, err := io.Copy(dst, fileReader); err != nil {
			return "", fmt.Errorf("writing local file: %w", err)
		}
		return "local:" + dstPath, nil
	}

	// Prepare multipart form
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	part, err := mw.CreateFormFile("file", filepath.Base(filename))
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(part, fileReader); err != nil {
		return "", fmt.Errorf("copy file to form: %w", err)
	}
	// optional: metadata form fields can be added here
	if err := mw.Close(); err != nil {
		return "", fmt.Errorf("close multipart: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS", &body)
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("pinata_api_key", p.ApiKey)
	req.Header.Set("pinata_secret_api_key", p.ApiSecret)

	resp, err := p.Client.Do(req)
	if err != nil {
		return "", fmt.Errorf("pinata request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("pinata error: %d %s", resp.StatusCode, string(respBody))
	}

	// response contains { "IpfsHash": "Qm...", "PinSize":..., "Timestamp":"..." }
	var parsed struct{
		IpfsHash string `json:"IpfsHash"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("unmarshal pinata response: %w", err)
	}

	return parsed.IpfsHash, nil
}

package models

type Role string

const (
	Contributor Role = "contributor"
	Consumer Role =  "consumer"
)

type User struct {
	ID int `json:"id" gorm: "primaryKey;autoIncrement"`
	walletAddress string `json:"wallet_address"`
	DataSets []DataSet `json:"data_sets" gorm:"foreignKey:UserID"`
	Role Role `json:"role"` 
	Purchases int `json:purchases`
}

type DataSet struct {
	ID int `json:"id" gorm: "primaryKey;autoIncrement"`
	UserID int `json:"user_id"`
	ipfsHash string `json:"ipfs_hash"`
	Description string `json:"description"`
	Price float64 `json:"price"`
}


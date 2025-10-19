export interface DataSet {
  id?: number;
  name: string;
  description?: string;
  ipfs_hash: string;
  file_size: number;
  file_type: string;
  owner_address: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateDataSetInput {
  name: string;
  description?: string;
  ipfs_hash: string;
  file_size: number;
  file_type: string;
  owner_address: string;
}

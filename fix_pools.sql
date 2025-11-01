-- Fix script for resetting problematic blockchain pool IDs
-- This script resets blockchain_pool_id to NULL for datasets that may have invalid or inactive pool references
-- Run this script to prepare datasets for pool recreation

-- First, let's see what we're working with
SELECT
    id,
    name,
    blockchain_pool_id,
    owner_address,
    price,
    created_at
FROM datasets
WHERE blockchain_pool_id IS NOT NULL
ORDER BY id;

-- Reset blockchain_pool_id to NULL for all datasets
-- This will allow them to be recreated with fresh, active pools
UPDATE datasets
SET
    blockchain_pool_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE blockchain_pool_id IS NOT NULL;

-- Verify the update
SELECT
    COUNT(*) as total_datasets,
    COUNT(blockchain_pool_id) as datasets_with_pool_id,
    COUNT(*) - COUNT(blockchain_pool_id) as datasets_without_pool_id
FROM datasets;

-- Show datasets that need pool creation
SELECT
    id,
    name,
    owner_address,
    price,
    'Needs pool creation' as status
FROM datasets
WHERE blockchain_pool_id IS NULL
ORDER BY created_at DESC;

-- Optional: Show datasets by owner for coordination
SELECT
    owner_address,
    COUNT(*) as dataset_count,
    STRING_AGG(name, ', ') as dataset_names
FROM datasets
WHERE blockchain_pool_id IS NULL
GROUP BY owner_address
ORDER BY dataset_count DESC;

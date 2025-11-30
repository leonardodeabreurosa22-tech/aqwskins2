-- Remove level requirements from all lootboxes
-- This allows all users to open any lootbox regardless of their level

UPDATE lootboxes 
SET min_level = 0 
WHERE min_level > 0;

-- Verify the changes
SELECT id, name, price, min_level, status 
FROM lootboxes 
ORDER BY price ASC;

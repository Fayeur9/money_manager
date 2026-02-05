-- Migration: Add bgt_parent_id to mm_budgets
-- This migration decouples budget hierarchy from category hierarchy
-- Run this migration on an existing database

USE money_manager;

-- 1. Add the bgt_parent_id column
ALTER TABLE mm_budgets
ADD COLUMN bgt_parent_id CHAR(36) DEFAULT NULL AFTER bgt_cat_id;

-- 2. Add foreign key constraint with cascade delete
ALTER TABLE mm_budgets
ADD CONSTRAINT fk_bgt_parent
FOREIGN KEY (bgt_parent_id) REFERENCES mm_budgets(bgt_id) ON DELETE CASCADE;

-- 3. Add index for performance
CREATE INDEX idx_bgt_parent_id ON mm_budgets(bgt_parent_id);

-- 4. Remove old unique constraint (user + category)
ALTER TABLE mm_budgets
DROP INDEX unique_bgt_usr_cat;

-- 5. Add new unique constraint (parent + category - same category can't appear twice under same parent)
ALTER TABLE mm_budgets
ADD CONSTRAINT unique_bgt_parent_cat UNIQUE (bgt_parent_id, bgt_cat_id);

-- Note: Existing budgets will have bgt_parent_id = NULL (they become parent budgets)

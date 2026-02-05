-- =============================================================================
-- Migration 001: Catégories hiérarchiques
-- Ajoute le support parent/enfant aux catégories
-- =============================================================================

USE money_manager;

-- Ajouter la colonne cat_parent_id si elle n'existe pas
SET @dbname = 'money_manager';
SET @tablename = 'mm_categories';
SET @columnname = 'cat_parent_id';

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT "La colonne cat_parent_id existe déjà"',
    'ALTER TABLE mm_categories ADD COLUMN cat_parent_id CHAR(36) DEFAULT NULL AFTER cat_usr_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter la foreign key si elle n'existe pas
SET @fkname = 'mm_categories_ibfk_2';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND CONSTRAINT_NAME = @fkname) > 0,
    'SELECT "La foreign key existe déjà"',
    'ALTER TABLE mm_categories ADD CONSTRAINT mm_categories_ibfk_2 FOREIGN KEY (cat_parent_id) REFERENCES mm_categories(cat_id) ON DELETE SET NULL'
));
PREPARE addFkIfNotExists FROM @preparedStatement;
EXECUTE addFkIfNotExists;
DEALLOCATE PREPARE addFkIfNotExists;

-- Ajouter l'index si il n'existe pas
SET @indexname = 'idx_cat_parent_id';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = @indexname) > 0,
    'SELECT "L''index idx_cat_parent_id existe déjà"',
    'ALTER TABLE mm_categories ADD INDEX idx_cat_parent_id (cat_parent_id)'
));
PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;

SELECT 'Migration 001 terminée avec succès' AS status;

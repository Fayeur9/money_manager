-- =============================================================================
-- Schema for Money Manager Application
-- Database: MySQL
-- Using UUID for all identifiers
-- Naming convention: mm_ prefix for tables, entity prefix for columns
-- =============================================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS money_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE money_manager;

-- =============================================================================
-- Table: mm_users (Users)
-- Stores user authentication and profile information
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_users (
    usr_id CHAR(36) PRIMARY KEY,
    usr_email VARCHAR(255) NOT NULL UNIQUE,
    usr_password_hash VARCHAR(255) NOT NULL,
    usr_first_name VARCHAR(100) NOT NULL,
    usr_last_name VARCHAR(100) NOT NULL,
    usr_avatar_url VARCHAR(255) DEFAULT NULL,
    usr_avatar_color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_usr_email (usr_email)
);

-- =============================================================================
-- Table: mm_accounts (Bank Accounts)
-- Represents user's different accounts (checking, savings, etc.)
-- Balance is stored directly for performance reasons
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_accounts (
    acc_id CHAR(36) PRIMARY KEY,
    acc_usr_id CHAR(36) NOT NULL,
    acc_name VARCHAR(100) NOT NULL,
    acc_type ENUM('checking', 'savings', 'cash', 'investment', 'other') DEFAULT 'checking',
    acc_balance DECIMAL(15, 2) DEFAULT 0.00,
    acc_currency VARCHAR(3) DEFAULT 'EUR',
    acc_icon VARCHAR(100) DEFAULT '/default/icons/wallet.png',
    acc_color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (acc_usr_id) REFERENCES mm_users(usr_id) ON DELETE CASCADE,
    INDEX idx_acc_usr_id (acc_usr_id)
);

-- =============================================================================
-- Table: mm_categories (Transaction Categories)
-- Classifies transactions (food, transport, salary, etc.)
-- Supports hierarchical categories via cat_parent_id (self-referencing)
-- icon: predefined icon name, emoji, or custom URL
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_categories (
    cat_id CHAR(36) PRIMARY KEY,
    cat_usr_id CHAR(36),
    cat_parent_id CHAR(36) DEFAULT NULL,
    cat_name VARCHAR(100) NOT NULL,
    cat_type ENUM('income', 'expense') NOT NULL,
    cat_icon VARCHAR(100) DEFAULT '/default/icons/dots.png',
    cat_color VARCHAR(7) DEFAULT '#6b7280',
    cat_is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cat_usr_id) REFERENCES mm_users(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (cat_parent_id) REFERENCES mm_categories(cat_id) ON DELETE SET NULL,
    INDEX idx_cat_usr_id (cat_usr_id),
    INDEX idx_cat_type (cat_type),
    INDEX idx_cat_parent_id (cat_parent_id)
);

-- =============================================================================
-- Table: mm_recurring (Recurring Transactions)
-- Templates for repeating income/expenses (salary, rent, subscriptions)
-- Also handles installment payments (rec_occurrences_limit)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_recurring (
    rec_id CHAR(36) PRIMARY KEY,
    rec_usr_id CHAR(36) NOT NULL,
    rec_acc_id CHAR(36) NOT NULL,
    rec_cat_id CHAR(36),
    rec_type ENUM('income', 'expense') NOT NULL,
    rec_amount DECIMAL(15, 2) NOT NULL,
    rec_description VARCHAR(255),
    rec_frequency ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'annual') NOT NULL,
    rec_start_date DATE NOT NULL,
    rec_end_date DATE DEFAULT NULL,
    rec_occurrences_limit INT DEFAULT NULL,
    rec_occurrences_count INT DEFAULT 0,
    rec_next_occurrence DATE NOT NULL,
    rec_is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rec_usr_id) REFERENCES mm_users(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (rec_acc_id) REFERENCES mm_accounts(acc_id) ON DELETE CASCADE,
    FOREIGN KEY (rec_cat_id) REFERENCES mm_categories(cat_id) ON DELETE SET NULL,
    INDEX idx_rec_usr_id (rec_usr_id),
    INDEX idx_rec_next_occurrence (rec_next_occurrence),
    INDEX idx_rec_is_active (rec_is_active)
);

-- =============================================================================
-- Table: mm_transactions (Transactions)
-- Records all financial operations (expenses, income, transfers)
-- trx_target_acc_id: used only for transfers between accounts
-- trx_rec_id: link to source recurring transaction (if applicable)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_transactions (
    trx_id CHAR(36) PRIMARY KEY,
    trx_acc_id CHAR(36) NOT NULL,
    trx_target_acc_id CHAR(36) DEFAULT NULL,
    trx_cat_id CHAR(36),
    trx_rec_id CHAR(36) DEFAULT NULL,
    trx_type ENUM('income', 'expense', 'transfer') NOT NULL,
    trx_amount DECIMAL(15, 2) NOT NULL,
    trx_description VARCHAR(255),
    trx_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (trx_acc_id) REFERENCES mm_accounts(acc_id) ON DELETE CASCADE,
    FOREIGN KEY (trx_target_acc_id) REFERENCES mm_accounts(acc_id) ON DELETE SET NULL,
    FOREIGN KEY (trx_cat_id) REFERENCES mm_categories(cat_id) ON DELETE SET NULL,
    FOREIGN KEY (trx_rec_id) REFERENCES mm_recurring(rec_id) ON DELETE SET NULL,
    INDEX idx_trx_acc_id (trx_acc_id),
    INDEX idx_trx_target_acc_id (trx_target_acc_id),
    INDEX idx_trx_date (trx_date),
    INDEX idx_trx_type (trx_type),
    INDEX idx_trx_rec_id (trx_rec_id)
);

-- =============================================================================
-- Table: mm_budgets (Monthly Budgets per Category)
-- Defines monthly spending limits per category
-- bgt_parent_id: parent budget for hierarchy (independent from category hierarchy)
-- bgt_display_order: display order in dashboard (NULL = not prioritized)
-- Note: Same category can appear in multiple parent budgets (not exclusive)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_budgets (
    bgt_id CHAR(36) PRIMARY KEY,
    bgt_usr_id CHAR(36) NOT NULL,
    bgt_cat_id CHAR(36) NOT NULL,
    bgt_parent_id CHAR(36) DEFAULT NULL,
    bgt_amount DECIMAL(15, 2) NOT NULL,
    bgt_display_order INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (bgt_usr_id) REFERENCES mm_users(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (bgt_cat_id) REFERENCES mm_categories(cat_id) ON DELETE CASCADE,
    FOREIGN KEY (bgt_parent_id) REFERENCES mm_budgets(bgt_id) ON DELETE CASCADE,
    UNIQUE KEY unique_bgt_parent_cat (bgt_parent_id, bgt_cat_id),
    INDEX idx_bgt_usr_id (bgt_usr_id),
    INDEX idx_bgt_parent_id (bgt_parent_id),
    INDEX idx_bgt_display_order (bgt_display_order)
);

-- =============================================================================
-- Table: mm_advances (Advances awaiting reimbursement)
-- Tracks money lent to others or borrowed from others
-- adv_direction: 'given' (I lent money, waiting to receive) or 'received' (I borrowed, need to repay)
-- adv_status: pending (waiting), partial (partially reimbursed), paid (fully reimbursed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mm_advances (
    adv_id CHAR(36) PRIMARY KEY,
    adv_usr_id CHAR(36) NOT NULL,
    adv_acc_id CHAR(36) NOT NULL,
    adv_amount DECIMAL(15, 2) NOT NULL,
    adv_description VARCHAR(255),
    adv_person VARCHAR(100) NOT NULL,
    adv_date DATE NOT NULL,
    adv_due_date DATE DEFAULT NULL,
    adv_direction ENUM('given', 'received') DEFAULT 'given',
    adv_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    adv_amount_received DECIMAL(15, 2) DEFAULT 0.00,
    adv_trx_id CHAR(36) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (adv_usr_id) REFERENCES mm_users(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (adv_acc_id) REFERENCES mm_accounts(acc_id) ON DELETE CASCADE,
    FOREIGN KEY (adv_trx_id) REFERENCES mm_transactions(trx_id) ON DELETE SET NULL,
    INDEX idx_adv_usr_id (adv_usr_id),
    INDEX idx_adv_direction (adv_direction),
    INDEX idx_adv_status (adv_status),
    INDEX idx_adv_person (adv_person),
    INDEX idx_adv_date (adv_date)
);

-- =============================================================================
-- Procédure: create_default_categories_for_user
-- Crée les catégories par défaut avec sous-catégories pour un nouvel utilisateur
-- Appelée automatiquement lors de l'inscription d'un utilisateur
-- =============================================================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS create_default_categories_for_user(IN p_user_id CHAR(36))
BEGIN
    -- Variables pour stocker les IDs des catégories parentes
    DECLARE v_cat_alimentation CHAR(36);
    DECLARE v_cat_transport CHAR(36);
    DECLARE v_cat_logement CHAR(36);
    DECLARE v_cat_sante CHAR(36);
    DECLARE v_cat_loisirs CHAR(36);
    DECLARE v_cat_achats CHAR(36);
    DECLARE v_cat_abonnements CHAR(36);
    DECLARE v_cat_education CHAR(36);
    DECLARE v_cat_voyages CHAR(36);
    DECLARE v_cat_travail_independant CHAR(36);
    DECLARE v_cat_investissements CHAR(36);

    -- =========================================================================
    -- CATÉGORIES DE DÉPENSES (avec sous-catégories)
    -- =========================================================================

    -- Alimentation
    SET v_cat_alimentation = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_alimentation, p_user_id, 'Alimentation', 'expense', '/default/icons/cart.png', '#ef4444', TRUE);
    -- Sous-catégories Alimentation
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_alimentation, 'Courses', 'expense', '/default/icons/cart.png', '#ef4444', TRUE),
        (UUID(), p_user_id, v_cat_alimentation, 'Restaurants', 'expense', '/default/icons/restaurant.png', '#ef4444', TRUE),
        (UUID(), p_user_id, v_cat_alimentation, 'Fast-food', 'expense', '/default/icons/fastfood.png', '#ef4444', TRUE),
        (UUID(), p_user_id, v_cat_alimentation, 'Livraison', 'expense', '/default/icons/delivery.png', '#ef4444', TRUE);

    -- Transport
    SET v_cat_transport = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_transport, p_user_id, 'Transport', 'expense', '/default/icons/car.png', '#f59e0b', TRUE);
    -- Sous-catégories Transport
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_transport, 'Carburant', 'expense', '/default/icons/fuel.png', '#f59e0b', TRUE),
        (UUID(), p_user_id, v_cat_transport, 'Transports en commun', 'expense', '/default/icons/bus.png', '#f59e0b', TRUE),
        (UUID(), p_user_id, v_cat_transport, 'Taxi/VTC', 'expense', '/default/icons/taxi.png', '#f59e0b', TRUE),
        (UUID(), p_user_id, v_cat_transport, 'Entretien véhicule', 'expense', '/default/icons/wrench.png', '#f59e0b', TRUE);

    -- Logement
    SET v_cat_logement = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_logement, p_user_id, 'Logement', 'expense', '/default/icons/home.png', '#eab308', TRUE);
    -- Sous-catégories Logement
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_logement, 'Loyer', 'expense', '/default/icons/home.png', '#eab308', TRUE),
        (UUID(), p_user_id, v_cat_logement, 'Charges', 'expense', '/default/icons/bolt.png', '#eab308', TRUE),
        (UUID(), p_user_id, v_cat_logement, 'Assurance habitation', 'expense', '/default/icons/shield.png', '#eab308', TRUE),
        (UUID(), p_user_id, v_cat_logement, 'Travaux', 'expense', '/default/icons/hammer.png', '#eab308', TRUE);

    -- Santé
    SET v_cat_sante = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_sante, p_user_id, 'Santé', 'expense', '/default/icons/pill.png', '#22c55e', TRUE);
    -- Sous-catégories Santé
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_sante, 'Médecin', 'expense', '/default/icons/stethoscope.png', '#22c55e', TRUE),
        (UUID(), p_user_id, v_cat_sante, 'Pharmacie', 'expense', '/default/icons/pill.png', '#22c55e', TRUE),
        (UUID(), p_user_id, v_cat_sante, 'Mutuelle', 'expense', '/default/icons/shield.png', '#22c55e', TRUE);

    -- Loisirs
    SET v_cat_loisirs = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_loisirs, p_user_id, 'Loisirs', 'expense', '/default/icons/gamepad.png', '#14b8a6', TRUE);
    -- Sous-catégories Loisirs
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_loisirs, 'Sorties', 'expense', '/default/icons/cocktail.png', '#14b8a6', TRUE),
        (UUID(), p_user_id, v_cat_loisirs, 'Sport', 'expense', '/default/icons/dumbbell.png', '#14b8a6', TRUE),
        (UUID(), p_user_id, v_cat_loisirs, 'Jeux vidéo', 'expense', '/default/icons/gamepad.png', '#14b8a6', TRUE),
        (UUID(), p_user_id, v_cat_loisirs, 'Culture', 'expense', '/default/icons/theater.png', '#14b8a6', TRUE);

    -- Achats
    SET v_cat_achats = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_achats, p_user_id, 'Achats', 'expense', '/default/icons/bag.png', '#06b6d4', TRUE);
    -- Sous-catégories Achats
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_achats, 'Vêtements', 'expense', '/default/icons/shirt.png', '#06b6d4', TRUE),
        (UUID(), p_user_id, v_cat_achats, 'High-tech', 'expense', '/default/icons/laptop.png', '#06b6d4', TRUE),
        (UUID(), p_user_id, v_cat_achats, 'Mobilier', 'expense', '/default/icons/couch.png', '#06b6d4', TRUE);

    -- Abonnements
    SET v_cat_abonnements = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_abonnements, p_user_id, 'Abonnements', 'expense', '/default/icons/repeat.png', '#3b82f6', TRUE);
    -- Sous-catégories Abonnements
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_abonnements, 'Streaming', 'expense', '/default/icons/tv.png', '#3b82f6', TRUE),
        (UUID(), p_user_id, v_cat_abonnements, 'Téléphone', 'expense', '/default/icons/phone.png', '#3b82f6', TRUE),
        (UUID(), p_user_id, v_cat_abonnements, 'Internet', 'expense', '/default/icons/wifi.png', '#3b82f6', TRUE);

    -- Éducation
    SET v_cat_education = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_education, p_user_id, 'Éducation', 'expense', '/default/icons/book.png', '#6366f1', TRUE);
    -- Sous-catégories Éducation
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_education, 'Formations', 'expense', '/default/icons/graduation.png', '#6366f1', TRUE),
        (UUID(), p_user_id, v_cat_education, 'Livres', 'expense', '/default/icons/book.png', '#6366f1', TRUE),
        (UUID(), p_user_id, v_cat_education, 'Fournitures', 'expense', '/default/icons/pencil.png', '#6366f1', TRUE);

    -- Cadeaux (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Cadeaux', 'expense', '/default/icons/gift.png', '#8b5cf6', TRUE);

    -- Voyages
    SET v_cat_voyages = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_voyages, p_user_id, 'Voyages', 'expense', '/default/icons/plane.png', '#a855f7', TRUE);
    -- Sous-catégories Voyages
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_voyages, 'Hébergement', 'expense', '/default/icons/bed.png', '#a855f7', TRUE),
        (UUID(), p_user_id, v_cat_voyages, 'Billets', 'expense', '/default/icons/ticket.png', '#a855f7', TRUE),
        (UUID(), p_user_id, v_cat_voyages, 'Activités', 'expense', '/default/icons/compass.png', '#a855f7', TRUE);

    -- Autres dépenses (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Autres dépenses', 'expense', '/default/icons/money.png', '#ec4899', TRUE);

    -- Avances (prêts à des tiers - sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Avances', 'expense', '/default/icons/handshake.png', '#f97316', TRUE);

    -- Remboursement d'emprunt (quand je rembourse quelqu'un - sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Remboursement d''emprunt', 'expense', '/default/icons/money-send.png', '#dc2626', TRUE);

    -- =========================================================================
    -- CATÉGORIES DE REVENUS
    -- =========================================================================

    -- Salaire (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Salaire', 'income', '/default/icons/salary.png', '#22c55e', TRUE);

    -- Travail indépendant
    SET v_cat_travail_independant = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_travail_independant, p_user_id, 'Travail indépendant', 'income', '/default/icons/briefcase.png', '#10b981', TRUE);
    -- Sous-catégories Travail indépendant
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_travail_independant, 'Missions', 'income', '/default/icons/briefcase.png', '#10b981', TRUE),
        (UUID(), p_user_id, v_cat_travail_independant, 'Consulting', 'income', '/default/icons/handshake.png', '#10b981', TRUE);

    -- Investissements
    SET v_cat_investissements = UUID();
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (v_cat_investissements, p_user_id, 'Investissements', 'income', '/default/icons/chart.png', '#14b8a6', TRUE);
    -- Sous-catégories Investissements
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
        (UUID(), p_user_id, v_cat_investissements, 'Dividendes', 'income', '/default/icons/money.png', '#14b8a6', TRUE),
        (UUID(), p_user_id, v_cat_investissements, 'Plus-values', 'income', '/default/icons/chart.png', '#14b8a6', TRUE);

    -- Remboursements (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Remboursements', 'income', '/default/icons/refresh.png', '#06b6d4', TRUE);

    -- Emprunts (quand quelqu'un me prête de l'argent - sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Emprunts', 'income', '/default/icons/wallet.png', '#f97316', TRUE);

    -- Cadeaux reçus (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Cadeaux reçus', 'income', '/default/icons/gift.png', '#0ea5e9', TRUE);

    -- Autres revenus (sans sous-catégories)
    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
    VALUES (UUID(), p_user_id, 'Autres revenus', 'income', '/default/icons/plus.png', '#3b82f6', TRUE);

END //

DELIMITER ;

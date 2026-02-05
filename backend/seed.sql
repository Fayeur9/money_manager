-- =============================================================================
-- Donnees de test pour l'application Gestion de Comptes
-- Annee 2025 complete avec donnees realistes
-- Utilisation d'UUID pour tous les identifiants
-- =============================================================================

USE money_manager;

-- Configuration de la collation pour éviter les erreurs de comparaison
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- VERIFICATION : Arrete le script si des utilisateurs existent deja
-- =============================================================================
DROP PROCEDURE IF EXISTS check_empty_users;

DELIMITER //

CREATE PROCEDURE check_empty_users()
BEGIN
    DECLARE user_count INT;
    SELECT COUNT(*) INTO user_count FROM mm_users;

    IF user_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERREUR: La table users n\'est pas vide. Purgez la BDD avant d\'executer ce script.';
    END IF;
END //

DELIMITER ;

-- Execute la verification
CALL check_empty_users();

-- Supprime la procedure temporaire
DROP PROCEDURE IF EXISTS check_empty_users;

-- =============================================================================
-- GENERATION DES UUIDs
-- =============================================================================
-- UUID fixe pour l'utilisateur test (permet de garder le meme dossier d'icones)
SET @user_id = '36743d1f-004c-11f1-8299-58cdc92244cd';
SET @compte_courant_id = UUID();
SET @livret_a_id = UUID();
SET @cash_id = UUID();

-- =============================================================================
-- UTILISATEUR TEST
-- =============================================================================
-- Mot de passe: test
INSERT INTO mm_users (usr_id, usr_email, usr_password_hash, usr_first_name, usr_last_name)
VALUES (@user_id, 'test', '$2b$12$iE4OL/T7G9AIqOKDVABJ3OLg2UJXbvqWhkAdJze9pL.MCJOurmCce', 'Baptiste', 'Freminet');

-- =============================================================================
-- COMPTES BANCAIRES
-- Note: Le trigger cree automatiquement 2 comptes, on les supprime pour creer les notres
-- =============================================================================
DELETE FROM mm_accounts WHERE acc_usr_id = @user_id;

INSERT INTO mm_accounts (acc_id, acc_usr_id, acc_name, acc_type, acc_balance, acc_currency, acc_icon, acc_color)
VALUES
    (@compte_courant_id, @user_id, 'Compte Courant', 'checking', 1245.67, 'EUR', '/default/icons/bank.png', '#3b82f6'),
    (@livret_a_id, @user_id, 'Livret A', 'savings', 3500.00, 'EUR', '/default/icons/piggy.png', '#22c55e'),
    (@cash_id, @user_id, 'Espèces', 'cash', 45.00, 'EUR', '/default/icons/wallet.png', '#f59e0b');

-- =============================================================================
-- CREATION DES CATEGORIES PAR DEFAUT VIA LA PROCEDURE
-- =============================================================================
CALL create_default_categories_for_user(@user_id);

-- =============================================================================
-- RECUPERATION DES IDs DES CATEGORIES CREEES PAR LA PROCEDURE
-- =============================================================================
-- Catégories parentes (dépenses)
SET @cat_alimentation_custom = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Alimentation' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_transport_custom = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Transport' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_logement_custom = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Logement' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_sante = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Santé' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_loisirs_custom = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Loisirs' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_achats = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Achats' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_abonnements = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Abonnements' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_education = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Éducation' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_cadeaux = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Cadeaux' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_voyages = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Voyages' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_autres_dep = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Autres dépenses' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);

-- Catégories parentes (revenus)
SET @cat_salaire = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Salaire' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_travail_indep = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Travail indépendant' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_investissements = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Investissements' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_remboursement = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Remboursements' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_cadeaux_recus = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Cadeaux reçus' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);
SET @cat_autres_rev = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Autres revenus' AND cat_usr_id = @user_id AND cat_parent_id IS NULL);

-- Sous-catégories (dépenses) - créées par la procédure
SET @cat_courses = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Courses' AND cat_usr_id = @user_id);
SET @cat_restaurants_custom = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Restaurants' AND cat_usr_id = @user_id);
SET @cat_fastfood = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Fast-food' AND cat_usr_id = @user_id);
SET @cat_livraison = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Livraison' AND cat_usr_id = @user_id);
SET @cat_carburant = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Carburant' AND cat_usr_id = @user_id);
SET @cat_transports_commun = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Transports en commun' AND cat_usr_id = @user_id);
SET @cat_vtc = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Taxi/VTC' AND cat_usr_id = @user_id);
SET @cat_entretien_vehicule = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Entretien véhicule' AND cat_usr_id = @user_id);
SET @cat_loyer = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Loyer' AND cat_usr_id = @user_id);
SET @cat_charges = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Charges' AND cat_usr_id = @user_id);
SET @cat_assurance_hab = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Assurance habitation' AND cat_usr_id = @user_id);
SET @cat_medecin = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Médecin' AND cat_usr_id = @user_id);
SET @cat_pharmacie = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Pharmacie' AND cat_usr_id = @user_id);
SET @cat_sorties = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Sorties' AND cat_usr_id = @user_id);
SET @cat_sport = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Sport' AND cat_usr_id = @user_id);
SET @cat_jeux = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Jeux vidéo' AND cat_usr_id = @user_id);
SET @cat_culture = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Culture' AND cat_usr_id = @user_id);
SET @cat_streaming = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Streaming' AND cat_usr_id = @user_id);
SET @cat_telephone = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Téléphone' AND cat_usr_id = @user_id);
SET @cat_internet = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Internet' AND cat_usr_id = @user_id);

-- =============================================================================
-- CATEGORIES PERSONNALISEES SUPPLEMENTAIRES DE L'UTILISATEUR TEST
-- (catégories spécifiques non créées par la procédure)
-- =============================================================================

-- Abonnements Numériques (catégorie parente personnalisée)
INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
(UUID(), @user_id, NULL, 'Abonnements Numériques', 'expense', '/default/icons/repeat.png', '#6366f1', FALSE);
SET @cat_abos_num = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Abonnements Numériques' AND cat_usr_id = @user_id);

-- Sous-catégories Abonnements Numériques (spécifiques à l'utilisateur)
INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
(UUID(), @user_id, @cat_abos_num, 'Discord', 'expense', '/uploads/icons/36743d1f-004c-11f1-8299-58cdc92244cd/discord.png', '#5865F2', FALSE),
(UUID(), @user_id, @cat_abos_num, 'Spotify', 'expense', '/uploads/icons/36743d1f-004c-11f1-8299-58cdc92244cd/spotify.png', '#1DB954', FALSE),
(UUID(), @user_id, @cat_abos_num, 'Netflix', 'expense', '/default/icons/repeat.png', '#E50914', FALSE),
(UUID(), @user_id, @cat_abos_num, 'YouTube Premium', 'expense', '/default/icons/repeat.png', '#FF0000', FALSE);

-- Sous-catégories Transport supplémentaires
INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
(UUID(), @user_id, @cat_transport_custom, 'Assurance auto', 'expense', '/uploads/icons/36743d1f-004c-11f1-8299-58cdc92244cd/voiture.png', '#0ea5e9', FALSE),
(UUID(), @user_id, @cat_transport_custom, 'Train', 'expense', '/default/icons/car.png', '#06b6d4', FALSE);

-- Revenus en ligne (catégorie parente personnalisée)
INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
(UUID(), @user_id, NULL, 'Revenus en ligne', 'income', '/default/icons/chart.png', '#22c55e', FALSE);
SET @cat_revenus_online = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Revenus en ligne' AND cat_usr_id = @user_id);

-- Sous-catégories Revenus en ligne
INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default) VALUES
(UUID(), @user_id, @cat_revenus_online, 'Twitch', 'income', '/uploads/icons/36743d1f-004c-11f1-8299-58cdc92244cd/twitch.png', '#9146FF', FALSE),
(UUID(), @user_id, @cat_revenus_online, 'YouTube', 'income', '/default/icons/chart.png', '#FF0000', FALSE);

-- Mise à jour icône Jeux vidéo avec icône personnalisée
UPDATE mm_categories SET cat_icon = '/uploads/icons/36743d1f-004c-11f1-8299-58cdc92244cd/game.png' WHERE cat_name = 'Jeux vidéo' AND cat_usr_id = @user_id;

-- -----------------------------------------------------------------------------
-- Récupération des IDs des catégories personnalisées supplémentaires
-- -----------------------------------------------------------------------------
SET @cat_discord = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Discord' AND cat_usr_id = @user_id);
SET @cat_spotify = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Spotify' AND cat_usr_id = @user_id);
SET @cat_netflix = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Netflix' AND cat_usr_id = @user_id);
SET @cat_youtube_premium = (SELECT cat_id FROM mm_categories WHERE cat_name = 'YouTube Premium' AND cat_usr_id = @user_id);
SET @cat_assurance_auto = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Assurance auto' AND cat_usr_id = @user_id);
SET @cat_train = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Train' AND cat_usr_id = @user_id);
SET @cat_twitch = (SELECT cat_id FROM mm_categories WHERE cat_name = 'Twitch' AND cat_usr_id = @user_id);
SET @cat_youtube = (SELECT cat_id FROM mm_categories WHERE cat_name = 'YouTube' AND cat_usr_id = @user_id AND cat_parent_id IS NOT NULL);

-- Alias pour compatibilité avec le reste du seed (renommages)
SET @cat_commandes = @cat_livraison;
SET @cat_entretien_auto = @cat_entretien_vehicule;
SET @cat_shopping = @cat_achats;
SET @cat_freelance = @cat_travail_indep;
SET @cat_alimentation = @cat_alimentation_custom;
SET @cat_logement = @cat_logement_custom;
SET @cat_loisirs = @cat_loisirs_custom;

-- =============================================================================
-- TRANSACTIONS RECURRENTES
-- next_occurrence est calculé dynamiquement pour être le jour X du mois prochain
-- =============================================================================

-- Salaire SMIC net 2025 (environ 1426 EUR) - le 28
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_salaire, 'income', 1105.00, 'Salaire - Entreprise XYZ', 'monthly', '2025-01-28',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-28'), TRUE);

-- APL - le 5
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', 'monthly', '2025-01-05',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-05'), TRUE);

-- Loyer - le 5 (sous-catégorie de Logement)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_loyer, 'expense', 442.00, 'Loyer appartement', 'monthly', '2025-01-05',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-05'), TRUE);

-- Charges - le 5 (sous-catégorie de Logement)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', 'monthly', '2025-01-05',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-05'), TRUE);

-- Assurance habitation - le 1 (sous-catégorie de Logement)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_assurance_hab, 'expense', 15.00, 'Assurance habitation', 'monthly', '2025-01-01',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'), TRUE);

-- Assurance auto - le 15 (sous-catégorie de Transport)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_assurance_auto, 'expense', 83.84, 'Assurance auto', 'monthly', '2025-01-15',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-15'), TRUE);

-- Discord Nitro - le 10 (sous-catégorie de Abonnements Numériques)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_discord, 'expense', 9.99, 'Discord Nitro', 'monthly', '2025-01-10',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-10'), TRUE);

-- Spotify Premium - le 8 (sous-catégorie de Abonnements Numériques)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_spotify, 'expense', 12.18, 'Spotify Premium', 'monthly', '2025-01-08',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-08'), TRUE);

-- Netflix - le 15 (sous-catégorie de Abonnements Numériques)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_netflix, 'expense', 13.49, 'Netflix Standard', 'monthly', '2025-01-15',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-15'), TRUE);

-- Sport - salle de sport - le 1 (sous-catégorie de Loisirs)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_sport, 'expense', 29.90, 'Abonnement Basic-Fit', 'monthly', '2025-01-01',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'), TRUE);

-- Revenus Twitch - le 20 (sous-catégorie de Revenus en ligne)
INSERT INTO mm_recurring (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description, rec_frequency, rec_start_date, rec_next_occurrence, rec_is_active)
VALUES (UUID(), @user_id, @compte_courant_id, @cat_twitch, 'income', 35.00, 'Revenus Twitch', 'monthly', '2025-01-20',
    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-20'), TRUE);

-- =============================================================================
-- BUDGETS MENSUELS (avec hiérarchie bgt_parent_id indépendante des catégories)
-- =============================================================================

-- Budget parent Alimentation
SET @bgt_alimentation = UUID();
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(@bgt_alimentation, @user_id, @cat_alimentation_custom, NULL, 450.00);
-- Sous-budgets Alimentation
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_courses, @bgt_alimentation, 200.00),
(UUID(), @user_id, @cat_restaurants_custom, @bgt_alimentation, 100.00),
(UUID(), @user_id, @cat_fastfood, @bgt_alimentation, 80.00),
(UUID(), @user_id, @cat_commandes, @bgt_alimentation, 70.00);

-- Budget parent Logement
SET @bgt_logement = UUID();
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(@bgt_logement, @user_id, @cat_logement_custom, NULL, 650.00);
-- Sous-budgets Logement
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_loyer, @bgt_logement, 450.00),
(UUID(), @user_id, @cat_charges, @bgt_logement, 140.00),
(UUID(), @user_id, @cat_assurance_hab, @bgt_logement, 25.00);

-- Budget parent Transport
SET @bgt_transport = UUID();
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(@bgt_transport, @user_id, @cat_transport_custom, NULL, 350.00);
-- Sous-budgets Transport
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_transports_commun, @bgt_transport, 100.00),
(UUID(), @user_id, @cat_vtc, @bgt_transport, 50.00),
(UUID(), @user_id, @cat_train, @bgt_transport, 80.00),
(UUID(), @user_id, @cat_carburant, @bgt_transport, 100.00),
(UUID(), @user_id, @cat_assurance_auto, @bgt_transport, 85.00),
(UUID(), @user_id, @cat_entretien_auto, @bgt_transport, 50.00);

-- Budget parent Loisirs
SET @bgt_loisirs = UUID();
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(@bgt_loisirs, @user_id, @cat_loisirs_custom, NULL, 200.00);
-- Sous-budgets Loisirs
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_jeux, @bgt_loisirs, 50.00),
(UUID(), @user_id, @cat_sorties, @bgt_loisirs, 80.00),
(UUID(), @user_id, @cat_sport, @bgt_loisirs, 40.00);

-- Budget parent Abonnements Numériques
SET @bgt_abos = UUID();
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(@bgt_abos, @user_id, @cat_abos_num, NULL, 50.00);
-- Sous-budgets Abonnements Numériques
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_discord, @bgt_abos, 10.00),
(UUID(), @user_id, @cat_spotify, @bgt_abos, 11.00),
(UUID(), @user_id, @cat_netflix, @bgt_abos, 14.00),
(UUID(), @user_id, @cat_youtube_premium, @bgt_abos, 13.00);

-- Budget Shopping (sans enfants - catégorie par défaut)
INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount) VALUES
(UUID(), @user_id, @cat_shopping, NULL, 100.00);

-- =============================================================================
-- TRANSACTIONS 2024 - NOVEMBRE ET DECEMBRE (donnees historiques pour comparaison)
-- =============================================================================

-- Salaires 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1400.00, 'Salaire - Entreprise XYZ', '2024-11-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1400.00, 'Salaire - Entreprise XYZ', '2024-12-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 200.00, 'Prime Noel', '2024-12-20');

-- APL 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 180.00, 'APL - CAF', '2024-11-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 180.00, 'APL - CAF', '2024-12-05');

-- Loyer 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_loyer, 'expense', 550.00, 'Loyer appartement', '2024-11-05'),
(UUID(), @compte_courant_id, @cat_loyer, 'expense', 550.00, 'Loyer appartement', '2024-12-05');

-- Charges 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_charges, 'expense', 130.00, 'Charges locatives', '2024-11-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 130.00, 'Charges locatives', '2024-12-05');

-- Abonnements 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2024-11-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2024-12-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2024-11-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2024-12-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2024-11-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2024-12-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2024-11-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2024-12-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2024-11-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2024-12-01');

-- Alimentation 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Novembre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 65.80, 'Courses Carrefour', '2024-11-02'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 24.50, 'Marche', '2024-11-06'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 58.30, 'Courses Lidl', '2024-11-09'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 15.20, 'Boulangerie', '2024-11-13'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 72.40, 'Courses Carrefour', '2024-11-16'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 28.90, 'Marche', '2024-11-20'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 85.60, 'Courses Carrefour - Thanksgiving', '2024-11-27'),
-- Decembre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 68.20, 'Courses Carrefour', '2024-12-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 31.40, 'Marche', '2024-12-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 62.80, 'Courses Lidl', '2024-12-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 19.50, 'Boulangerie', '2024-12-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 78.90, 'Courses Carrefour', '2024-12-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 125.30, 'Courses Noel - Carrefour', '2024-12-22'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 68.40, 'Courses Nouvel An', '2024-12-29');

-- Restaurants 2024 (utilisation des sous-catégories)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 14.50, 'Kebab midi', '2024-11-08'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 32.00, 'Restaurant italien', '2024-11-16'),
(UUID(), @compte_courant_id, @cat_commandes, 'expense', 18.90, 'Sushi emporter', '2024-11-23'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 15.80, 'McDonald\'s', '2024-12-06'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 45.00, 'Restaurant Noel famille', '2024-12-24'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 52.00, 'Reveillon Nouvel An', '2024-12-31');

-- Transport 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 84.10, 'Pass Navigo Novembre', '2024-11-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 84.10, 'Pass Navigo Decembre', '2024-12-02'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 22.00, 'Uber soiree', '2024-11-15'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 85.00, 'Train Noel famille', '2024-12-23');

-- Loisirs 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2024-11-10'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 28.00, 'Bowling soiree', '2024-11-22'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2024-12-08'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 75.00, 'Concert Noel', '2024-12-14');

-- Shopping 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 145.00, 'Black Friday vetements', '2024-11-29'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 65.00, 'Cyber Monday tech', '2024-12-02'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 42.00, 'Pull hiver', '2024-12-10');

-- Cadeaux 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 120.00, 'Cadeaux Noel famille', '2024-12-18'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 45.00, 'Cadeaux Noel amis', '2024-12-20');

-- Sante 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sante, 'expense', 25.00, 'Medecin generaliste', '2024-11-18'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 12.80, 'Pharmacie rhume', '2024-11-19'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 18.50, 'Pharmacie', '2024-12-12');

-- Autres depenses 2024
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2024-11-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2024-12-22');

-- =============================================================================
-- TRANSACTIONS 2025 - REVENUS MENSUELS
-- =============================================================================

-- Salaires (28 de chaque mois)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-01-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-02-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-03-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-04-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-05-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-06-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-07-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-08-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-09-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-10-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-11-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1426.00, 'Salaire - Entreprise XYZ', '2025-12-28');

-- APL (5 de chaque mois)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-01-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-02-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-03-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-04-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-05-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-06-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-07-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-08-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-09-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-10-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-11-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 183.00, 'APL - CAF', '2025-12-05');

-- =============================================================================
-- TRANSACTIONS 2025 - DEPENSES FIXES MENSUELLES
-- =============================================================================

-- Loyer (5 de chaque mois)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-01-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-02-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-03-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-04-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-05-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-06-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-07-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-08-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-09-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-10-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-11-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 567.00, 'Loyer appartement', '2025-12-05');

-- Charges (5 de chaque mois)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-01-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-02-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-03-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-04-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-05-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-06-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-07-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-08-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-09-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-10-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-11-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 138.00, 'Charges locatives', '2025-12-05');

-- Abonnements mensuels
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Telephone
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-01-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-02-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-03-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-04-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-05-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-06-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-07-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-08-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-09-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-10-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-11-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2025-12-10'),
-- Internet
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-01-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-02-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-03-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-04-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-05-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-06-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-07-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-08-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-09-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-10-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-11-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2025-12-15'),
-- Netflix
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-01-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-02-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-03-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-04-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-05-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-06-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-07-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-08-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-09-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-10-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-11-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2025-12-20'),
-- Spotify
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-01-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-02-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-03-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-04-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-05-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-06-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-07-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-08-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-09-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-10-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-11-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2025-12-22'),
-- Salle de sport
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-01-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-02-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-03-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-04-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-05-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-06-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-07-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-08-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-09-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-10-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-11-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2025-12-01');

-- =============================================================================
-- TRANSACTIONS 2025 - ALIMENTATION (courses hebdomadaires + extras)
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Janvier
(UUID(), @compte_courant_id, @cat_courses, 'expense', 67.45, 'Courses Carrefour', '2025-01-04'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 23.80, 'Marche', '2025-01-07'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 72.30, 'Courses Lidl', '2025-01-11'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 15.60, 'Boulangerie', '2025-01-14'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 58.90, 'Courses Carrefour', '2025-01-18'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 31.20, 'Marche', '2025-01-21'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 85.40, 'Courses Carrefour', '2025-01-25'),
-- Fevrier
(UUID(), @compte_courant_id, @cat_courses, 'expense', 62.15, 'Courses Lidl', '2025-02-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 28.50, 'Marche', '2025-02-04'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 71.80, 'Courses Carrefour', '2025-02-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 19.30, 'Boulangerie', '2025-02-11'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 55.60, 'Courses Lidl', '2025-02-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 42.90, 'Courses Carrefour', '2025-02-22'),
-- Mars
(UUID(), @compte_courant_id, @cat_courses, 'expense', 78.20, 'Courses Carrefour', '2025-03-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 25.40, 'Marche', '2025-03-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 63.50, 'Courses Lidl', '2025-03-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 17.80, 'Boulangerie', '2025-03-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 69.90, 'Courses Carrefour', '2025-03-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 34.60, 'Marche', '2025-03-19'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 52.30, 'Courses Lidl', '2025-03-26'),
-- Avril
(UUID(), @compte_courant_id, @cat_courses, 'expense', 74.80, 'Courses Carrefour', '2025-04-02'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 29.90, 'Marche', '2025-04-06'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 58.40, 'Courses Lidl', '2025-04-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 21.50, 'Boulangerie', '2025-04-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 82.70, 'Courses Carrefour', '2025-04-19'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 45.30, 'Courses Lidl', '2025-04-26'),
-- Mai
(UUID(), @compte_courant_id, @cat_courses, 'expense', 68.90, 'Courses Carrefour', '2025-05-03'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 32.40, 'Marche', '2025-05-07'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 55.80, 'Courses Lidl', '2025-05-10'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 18.90, 'Boulangerie', '2025-05-14'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 79.50, 'Courses Carrefour', '2025-05-17'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 27.60, 'Marche', '2025-05-21'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 61.20, 'Courses Lidl', '2025-05-28'),
-- Juin
(UUID(), @compte_courant_id, @cat_courses, 'expense', 72.40, 'Courses Carrefour', '2025-06-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 35.80, 'Marche', '2025-06-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 48.90, 'Courses Lidl', '2025-06-11'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 22.30, 'Boulangerie', '2025-06-14'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 67.80, 'Courses Carrefour', '2025-06-18'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 53.40, 'Courses Lidl', '2025-06-25'),
-- Juillet
(UUID(), @compte_courant_id, @cat_courses, 'expense', 81.20, 'Courses Carrefour', '2025-07-02'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 28.70, 'Marche', '2025-07-06'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 59.30, 'Courses Lidl', '2025-07-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 16.50, 'Boulangerie', '2025-07-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 73.90, 'Courses Carrefour', '2025-07-19'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 42.10, 'Courses Lidl', '2025-07-26'),
-- Aout
(UUID(), @compte_courant_id, @cat_courses, 'expense', 65.80, 'Courses Carrefour', '2025-08-02'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 38.90, 'Marche', '2025-08-06'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 54.20, 'Courses Lidl', '2025-08-13'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 19.80, 'Boulangerie', '2025-08-16'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 88.50, 'Courses Carrefour', '2025-08-20'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 47.30, 'Courses Lidl', '2025-08-27'),
-- Septembre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 76.40, 'Courses Carrefour', '2025-09-03'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 31.60, 'Marche', '2025-09-07'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 62.80, 'Courses Lidl', '2025-09-10'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 24.50, 'Boulangerie', '2025-09-14'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 69.20, 'Courses Carrefour', '2025-09-17'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 56.90, 'Courses Lidl', '2025-09-24'),
-- Octobre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 83.10, 'Courses Carrefour', '2025-10-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 27.40, 'Marche', '2025-10-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 58.70, 'Courses Lidl', '2025-10-11'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 20.90, 'Boulangerie', '2025-10-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 71.50, 'Courses Carrefour', '2025-10-18'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 49.80, 'Courses Lidl', '2025-10-25'),
-- Novembre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 79.60, 'Courses Carrefour', '2025-11-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 33.20, 'Marche', '2025-11-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 64.40, 'Courses Lidl', '2025-11-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 18.70, 'Boulangerie', '2025-11-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 75.80, 'Courses Carrefour', '2025-11-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 51.30, 'Courses Lidl', '2025-11-22'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 92.40, 'Courses Carrefour - Fetes', '2025-11-29'),
-- Decembre
(UUID(), @compte_courant_id, @cat_courses, 'expense', 85.70, 'Courses Carrefour', '2025-12-03'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 36.80, 'Marche', '2025-12-07'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 68.90, 'Courses Lidl', '2025-12-10'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 25.40, 'Boulangerie', '2025-12-14'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 124.50, 'Courses Noel - Carrefour', '2025-12-20'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 78.30, 'Courses Nouvel An', '2025-12-28');

-- =============================================================================
-- TRANSACTIONS 2025 - RESTAURANTS (utilisation des sous-catégories)
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 12.50, 'Dejeuner kebab', '2025-01-08'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 28.90, 'Diner pizzeria avec ami', '2025-01-17'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 15.80, 'McDonald\'s', '2025-01-25'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 35.50, 'Restaurant italien', '2025-02-14'),
(UUID(), @compte_courant_id, @cat_commandes, 'expense', 18.20, 'Sushi a emporter', '2025-02-22'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 14.90, 'Burger King', '2025-03-08'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 42.00, 'Restaurant anniversaire ami', '2025-03-15'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 11.50, 'Sandwich midi', '2025-03-28'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 22.80, 'Creperie', '2025-04-05'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 16.40, 'KFC', '2025-04-19'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 38.50, 'Restaurant asiatique', '2025-05-03'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 13.90, 'Tacos', '2025-05-17'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 27.60, 'Pizzeria', '2025-05-24'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 19.80, 'Sushi', '2025-06-07'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 45.00, 'Restaurant terrasse ete', '2025-06-21'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 14.50, 'Sandwich midi', '2025-07-03'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 32.40, 'Restaurant vacances', '2025-07-15'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 28.70, 'Fruits de mer', '2025-08-08'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 17.30, 'Kebab', '2025-08-22'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 23.90, 'Restaurant indien', '2025-09-06'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 15.60, 'McDonald\'s', '2025-09-20'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 41.20, 'Restaurant japonais', '2025-10-04'),
(UUID(), @compte_courant_id, @cat_fastfood, 'expense', 12.80, 'Subway', '2025-10-18'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 36.50, 'Brasserie', '2025-11-08'),
(UUID(), @compte_courant_id, @cat_commandes, 'expense', 18.90, 'Pizza a emporter', '2025-11-22'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 55.00, 'Restaurant Noel famille', '2025-12-25'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 48.00, 'Reveillon Nouvel An', '2025-12-31');

-- =============================================================================
-- TRANSACTIONS 2025 - TRANSPORT
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Pass Navigo mensuel
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Janvier', '2025-01-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Fevrier', '2025-02-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Mars', '2025-03-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Avril', '2025-04-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Mai', '2025-05-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Juin', '2025-06-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Juillet', '2025-07-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Aout', '2025-08-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Septembre', '2025-09-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Octobre', '2025-10-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Novembre', '2025-11-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 86.40, 'Pass Navigo Decembre', '2025-12-02'),
-- Extras transport
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 25.00, 'Uber soiree', '2025-01-18'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 18.50, 'Uber', '2025-03-22'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 45.00, 'Train weekend', '2025-04-12'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 22.00, 'Uber', '2025-05-31'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 89.00, 'Train vacances', '2025-07-10'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 32.50, 'Uber aeroport', '2025-08-01'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 15.80, 'Uber', '2025-09-14'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 67.00, 'Train Toussaint', '2025-10-31'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 28.00, 'Uber', '2025-11-23'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 95.00, 'Train Noel famille', '2025-12-23');

-- =============================================================================
-- TRANSACTIONS 2025 - LOISIRS
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2025-01-12'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 35.00, 'Bowling + drinks', '2025-01-26'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 14.00, 'Cinema', '2025-02-09'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 25.00, 'Escape game', '2025-02-23'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 18.50, 'Concert local', '2025-03-08'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2025-03-22'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 45.00, 'Parc attraction', '2025-04-20'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 28.00, 'Karting', '2025-05-11'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2025-05-25'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 55.00, 'Festival musique', '2025-06-15'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 32.00, 'Piscine + snack', '2025-07-06'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 22.00, 'Mini-golf', '2025-07-20'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 65.00, 'Concert ete', '2025-08-10'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 14.00, 'Cinema', '2025-08-24'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 38.00, 'Laser game', '2025-09-07'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2025-09-21'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 42.00, 'Halloween party', '2025-10-31'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 12.50, 'Cinema', '2025-11-09'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 85.00, 'Concert Noel', '2025-12-14');

-- =============================================================================
-- TRANSACTIONS 2025 - SHOPPING
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 45.00, 'T-shirts H&M', '2025-01-15'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 89.00, 'Chaussures Decathlon', '2025-02-08'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 32.00, 'Livres Fnac', '2025-03-12'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 65.00, 'Jean Zara', '2025-04-05'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 28.00, 'Accessoires', '2025-05-18'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 55.00, 'Vetements ete', '2025-06-10'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 120.00, 'Soldes ete', '2025-07-02'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 38.00, 'Maillot de bain', '2025-07-25'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 75.00, 'Rentree vetements', '2025-09-02'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 42.00, 'Pull automne', '2025-10-12'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 180.00, 'Black Friday', '2025-11-28'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 95.00, 'Manteau hiver', '2025-12-06');

-- =============================================================================
-- TRANSACTIONS 2025 - SANTE
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sante, 'expense', 25.00, 'Medecin generaliste', '2025-01-20'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 8.50, 'Pharmacie', '2025-01-21'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 45.00, 'Dentiste', '2025-03-18'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 12.00, 'Pharmacie', '2025-04-15'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 25.00, 'Medecin generaliste', '2025-06-22'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 15.80, 'Pharmacie', '2025-06-23'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 85.00, 'Ophtalmo + lunettes', '2025-09-10'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 25.00, 'Medecin generaliste', '2025-11-05'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 22.00, 'Pharmacie grippe', '2025-11-06');

-- =============================================================================
-- TRANSACTIONS 2025 - CADEAUX
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 45.00, 'Cadeau anniversaire maman', '2025-02-18'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 35.00, 'Cadeau anniversaire ami', '2025-03-15'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 28.00, 'Cadeau fete des meres', '2025-05-25'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 25.00, 'Cadeau fete des peres', '2025-06-15'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 40.00, 'Cadeau anniversaire frere', '2025-08-20'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 150.00, 'Cadeaux Noel famille', '2025-12-15'),
(UUID(), @compte_courant_id, @cat_cadeaux, 'expense', 60.00, 'Cadeaux Noel amis', '2025-12-18');

-- =============================================================================
-- TRANSACTIONS 2025 - FACTURES EXCEPTIONNELLES
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_charges, 'expense', 85.00, 'Regularisation electricite', '2025-02-15'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 45.00, 'Assurance habitation annuelle', '2025-03-01'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 120.00, 'Regularisation charges', '2025-07-15'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 95.00, 'Regularisation gaz', '2025-10-20');

-- =============================================================================
-- TRANSACTIONS 2025 - AUTRES DEPENSES
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-01-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-03-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-05-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-07-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-09-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 15.00, 'Coiffeur', '2025-11-25'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 8.00, 'Pressing', '2025-04-10'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 12.00, 'Pressing costume', '2025-06-05'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 35.00, 'Reparation telephone', '2025-08-12');

-- =============================================================================
-- TRANSACTIONS 2025 - REVENUS EXCEPTIONNELS
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 50.00, 'Vente Leboncoin', '2025-02-10'),
(UUID(), @compte_courant_id, @cat_remboursement, 'income', 45.00, 'Remboursement Secu', '2025-03-25'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 75.00, 'Vente Vinted', '2025-05-08'),
(UUID(), @compte_courant_id, @cat_remboursement, 'income', 25.00, 'Remboursement ami', '2025-06-28'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 100.00, 'Cadeau anniversaire', '2025-09-15'),
(UUID(), @compte_courant_id, @cat_remboursement, 'income', 85.00, 'Remboursement mutuelle', '2025-09-20'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 150.00, 'Prime exceptionnelle', '2025-12-20');

-- =============================================================================
-- TRANSFERTS EPARGNE (Compte Courant -> Livret A)
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2025-01-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2025-02-28'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 50.00, 'Epargne mensuelle', '2025-03-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2025-04-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2025-05-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 150.00, 'Epargne mensuelle', '2025-06-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 50.00, 'Epargne mensuelle', '2025-07-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 50.00, 'Epargne mensuelle', '2025-08-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2025-09-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 75.00, 'Epargne mensuelle', '2025-10-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 50.00, 'Epargne mensuelle', '2025-11-30');

-- =============================================================================
-- LIVRET A - INTERETS ET RETRAITS
-- =============================================================================

-- Interets trimestriels (taux 3% annuel)
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @livret_a_id, @cat_autres_rev, 'income', 24.50, 'Interets trimestriels', '2025-03-31'),
(UUID(), @livret_a_id, @cat_autres_rev, 'income', 26.80, 'Interets trimestriels', '2025-06-30'),
(UUID(), @livret_a_id, @cat_autres_rev, 'income', 27.20, 'Interets trimestriels', '2025-09-30'),
(UUID(), @livret_a_id, @cat_autres_rev, 'income', 28.50, 'Interets trimestriels', '2025-12-31');

-- Retraits occasionnels du Livret A vers Compte Courant
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @livret_a_id, @compte_courant_id, 'transfer', 200.00, 'Retrait vacances', '2025-07-05'),
(UUID(), @livret_a_id, @compte_courant_id, 'transfer', 150.00, 'Retrait Black Friday', '2025-11-25');

-- =============================================================================
-- RETRAITS DAB (Compte Courant -> Cash)
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cash_id, 'transfer', 60.00, 'Retrait DAB', '2025-01-10'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 40.00, 'Retrait DAB', '2025-02-08'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 50.00, 'Retrait DAB', '2025-03-12'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 60.00, 'Retrait DAB', '2025-04-15'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 40.00, 'Retrait DAB', '2025-05-10'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 80.00, 'Retrait DAB vacances', '2025-06-28'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 100.00, 'Retrait DAB vacances', '2025-07-12'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 60.00, 'Retrait DAB', '2025-08-08'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 50.00, 'Retrait DAB', '2025-09-14'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 40.00, 'Retrait DAB', '2025-10-10'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 60.00, 'Retrait DAB', '2025-11-12'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 100.00, 'Retrait DAB fetes', '2025-12-18');

-- =============================================================================
-- DEPENSES CASH (petits achats, marches, pourboires)
-- =============================================================================
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Janvier
(UUID(), @cash_id, @cat_courses, 'expense', 8.50, 'Croissants boulangerie', '2025-01-12'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire restaurant', '2025-01-17'),
(UUID(), @cash_id, @cat_courses, 'expense', 12.00, 'Marche fruits', '2025-01-19'),
-- Fevrier
(UUID(), @cash_id, @cat_courses, 'expense', 6.80, 'Pain boulangerie', '2025-02-10'),
(UUID(), @cash_id, @cat_sorties, 'expense', 10.00, 'Fete foraine', '2025-02-15'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 8.00, 'Pourboire livreur', '2025-02-22'),
-- Mars
(UUID(), @cash_id, @cat_courses, 'expense', 15.00, 'Marche legumes', '2025-03-08'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire', '2025-03-15'),
(UUID(), @cash_id, @cat_courses, 'expense', 9.50, 'Boulangerie', '2025-03-22'),
-- Avril
(UUID(), @cash_id, @cat_courses, 'expense', 11.00, 'Marche', '2025-04-12'),
(UUID(), @cash_id, @cat_sorties, 'expense', 8.00, 'Vide-grenier', '2025-04-20'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 6.00, 'Pourboire', '2025-04-25'),
-- Mai
(UUID(), @cash_id, @cat_courses, 'expense', 14.00, 'Marche', '2025-05-10'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire', '2025-05-17'),
-- Juin
(UUID(), @cash_id, @cat_courses, 'expense', 18.00, 'Marche ete', '2025-06-15'),
(UUID(), @cash_id, @cat_sorties, 'expense', 12.00, 'Glaces plage', '2025-06-22'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 10.00, 'Pourboire vacances', '2025-06-30'),
-- Juillet
(UUID(), @cash_id, @cat_courses, 'expense', 25.00, 'Marche vacances', '2025-07-08'),
(UUID(), @cash_id, @cat_sorties, 'expense', 15.00, 'Activites plage', '2025-07-15'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 20.00, 'Souvenirs vacances', '2025-07-20'),
(UUID(), @cash_id, @cat_courses, 'expense', 18.00, 'Glaces et snacks', '2025-07-25'),
-- Aout
(UUID(), @cash_id, @cat_courses, 'expense', 22.00, 'Marche', '2025-08-05'),
(UUID(), @cash_id, @cat_sorties, 'expense', 8.00, 'Manege', '2025-08-15'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 6.00, 'Pourboire', '2025-08-22'),
-- Septembre
(UUID(), @cash_id, @cat_courses, 'expense', 12.00, 'Marche rentree', '2025-09-07'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire', '2025-09-20'),
-- Octobre
(UUID(), @cash_id, @cat_courses, 'expense', 10.00, 'Marche', '2025-10-12'),
(UUID(), @cash_id, @cat_sorties, 'expense', 15.00, 'Halloween bonbons', '2025-10-30'),
-- Novembre
(UUID(), @cash_id, @cat_courses, 'expense', 14.00, 'Marche', '2025-11-08'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 8.00, 'Pourboire', '2025-11-20'),
-- Decembre
(UUID(), @cash_id, @cat_courses, 'expense', 20.00, 'Marche Noel', '2025-12-14'),
(UUID(), @cash_id, @cat_cadeaux, 'expense', 25.00, 'Etrennes gardien', '2025-12-20'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 15.00, 'Pourboires fetes', '2025-12-25');

-- Revenus cash occasionnels
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @cash_id, @cat_autres_rev, 'income', 20.00, 'Cadeau mamie', '2025-03-15'),
(UUID(), @cash_id, @cat_autres_rev, 'income', 50.00, 'Cadeau anniversaire oncle', '2025-09-15'),
(UUID(), @cash_id, @cat_autres_rev, 'income', 30.00, 'Etrennes Noel', '2025-12-25');

-- =============================================================================
-- TRANSACTIONS 2026 - JANVIER, FEVRIER, MARS
-- =============================================================================

-- Salaires 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1450.00, 'Salaire - Entreprise XYZ', '2026-01-28'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1450.00, 'Salaire - Entreprise XYZ', '2026-02-27'),
(UUID(), @compte_courant_id, @cat_salaire, 'income', 1450.00, 'Salaire - Entreprise XYZ', '2026-03-27');

-- APL 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 185.00, 'APL - CAF', '2026-01-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 185.00, 'APL - CAF', '2026-02-05'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 185.00, 'APL - CAF', '2026-03-05');

-- Loyer 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_logement, 'expense', 575.00, 'Loyer appartement', '2026-01-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 575.00, 'Loyer appartement', '2026-02-05'),
(UUID(), @compte_courant_id, @cat_logement, 'expense', 575.00, 'Loyer appartement', '2026-03-05');

-- Charges 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_charges, 'expense', 142.00, 'Charges locatives', '2026-01-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 142.00, 'Charges locatives', '2026-02-05'),
(UUID(), @compte_courant_id, @cat_charges, 'expense', 142.00, 'Charges locatives', '2026-03-05');

-- Abonnements 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2026-01-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2026-02-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 19.99, 'Forfait mobile Free', '2026-03-10'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2026-01-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2026-02-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.99, 'Box Internet Orange', '2026-03-15'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2026-01-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2026-02-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 13.49, 'Netflix', '2026-03-20'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2026-01-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2026-02-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 10.99, 'Spotify Premium', '2026-03-22'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2026-01-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2026-02-01'),
(UUID(), @compte_courant_id, @cat_abonnements, 'expense', 29.00, 'Basic Fit', '2026-03-01');

-- Alimentation 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
-- Janvier
(UUID(), @compte_courant_id, @cat_courses, 'expense', 72.30, 'Courses Carrefour', '2026-01-04'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 28.50, 'Marche', '2026-01-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 65.80, 'Courses Lidl', '2026-01-11'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 18.20, 'Boulangerie', '2026-01-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 78.90, 'Courses Carrefour', '2026-01-18'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 32.40, 'Marche', '2026-01-22'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 59.70, 'Courses Lidl', '2026-01-25'),
-- Fevrier
(UUID(), @compte_courant_id, @cat_courses, 'expense', 68.40, 'Courses Carrefour', '2026-02-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 25.80, 'Marche', '2026-02-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 74.50, 'Courses Lidl', '2026-02-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 16.90, 'Boulangerie', '2026-02-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 82.30, 'Courses Carrefour', '2026-02-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 29.60, 'Marche', '2026-02-19'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 55.40, 'Courses Lidl', '2026-02-22'),
-- Mars
(UUID(), @compte_courant_id, @cat_courses, 'expense', 76.20, 'Courses Carrefour', '2026-03-01'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 31.50, 'Marche', '2026-03-05'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 69.80, 'Courses Lidl', '2026-03-08'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 19.40, 'Boulangerie', '2026-03-12'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 85.60, 'Courses Carrefour', '2026-03-15'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 27.90, 'Marche', '2026-03-19'),
(UUID(), @compte_courant_id, @cat_courses, 'expense', 62.30, 'Courses Lidl', '2026-03-22');

-- Restaurants 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 14.50, 'Kebab midi', '2026-01-09'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 32.80, 'Restaurant italien', '2026-01-18'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 16.90, 'McDonald\'s', '2026-01-25'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 45.00, 'Restaurant Saint-Valentin', '2026-02-14'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 19.50, 'Sushi emporter', '2026-02-21'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 13.80, 'Sandwich midi', '2026-03-06'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 38.50, 'Creperie', '2026-03-15'),
(UUID(), @compte_courant_id, @cat_restaurants_custom, 'expense', 22.40, 'Pizzeria', '2026-03-22');

-- Transport 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 88.20, 'Pass Navigo Janvier', '2026-01-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 88.20, 'Pass Navigo Fevrier', '2026-02-02'),
(UUID(), @compte_courant_id, @cat_transports_commun, 'expense', 88.20, 'Pass Navigo Mars', '2026-03-02'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 22.50, 'Uber soiree', '2026-01-17'),
(UUID(), @compte_courant_id, @cat_vtc, 'expense', 18.00, 'Uber', '2026-02-28'),
(UUID(), @compte_courant_id, @cat_train, 'expense', 35.00, 'Train weekend', '2026-03-14');

-- Loisirs 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 14.00, 'Cinema', '2026-01-11'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 38.00, 'Bowling soiree', '2026-01-24'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 14.00, 'Cinema', '2026-02-08'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 28.00, 'Escape game', '2026-02-22'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 14.00, 'Cinema', '2026-03-07'),
(UUID(), @compte_courant_id, @cat_sorties, 'expense', 25.00, 'Karting', '2026-03-21');

-- Shopping 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 65.00, 'Soldes hiver - vetements', '2026-01-12'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 42.00, 'Livres Fnac', '2026-02-10'),
(UUID(), @compte_courant_id, @cat_shopping, 'expense', 89.00, 'Chaussures printemps', '2026-03-08');

-- Sante 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_sante, 'expense', 25.00, 'Medecin generaliste', '2026-01-20'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 12.50, 'Pharmacie', '2026-01-21'),
(UUID(), @compte_courant_id, @cat_sante, 'expense', 48.00, 'Dentiste controle', '2026-03-10');

-- Autres depenses 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 16.00, 'Coiffeur', '2026-01-28'),
(UUID(), @compte_courant_id, @cat_autres_dep, 'expense', 16.00, 'Coiffeur', '2026-03-25');

-- Revenus exceptionnels 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 85.00, 'Vente Vinted', '2026-01-15'),
(UUID(), @compte_courant_id, @cat_remboursement, 'income', 25.00, 'Remboursement Secu', '2026-02-18'),
(UUID(), @compte_courant_id, @cat_autres_rev, 'income', 60.00, 'Vente Leboncoin', '2026-03-12');

-- Transferts epargne 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2026-01-30'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 75.00, 'Epargne mensuelle', '2026-02-27'),
(UUID(), @compte_courant_id, @livret_a_id, 'transfer', 100.00, 'Epargne mensuelle', '2026-03-28');

-- Retraits DAB 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @compte_courant_id, @cash_id, 'transfer', 50.00, 'Retrait DAB', '2026-01-08'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 40.00, 'Retrait DAB', '2026-02-06'),
(UUID(), @compte_courant_id, @cash_id, 'transfer', 60.00, 'Retrait DAB', '2026-03-10');

-- Depenses Cash 2026
INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_type, trx_amount, trx_description, trx_date) VALUES
(UUID(), @cash_id, @cat_courses, 'expense', 9.00, 'Boulangerie', '2026-01-10'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire', '2026-01-18'),
(UUID(), @cash_id, @cat_courses, 'expense', 14.00, 'Marche', '2026-01-25'),
(UUID(), @cash_id, @cat_courses, 'expense', 8.50, 'Croissants', '2026-02-08'),
(UUID(), @cash_id, @cat_sorties, 'expense', 12.00, 'Crepes Chandeleur', '2026-02-02'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 6.00, 'Pourboire', '2026-02-20'),
(UUID(), @cash_id, @cat_courses, 'expense', 16.00, 'Marche printemps', '2026-03-12'),
(UUID(), @cash_id, @cat_autres_dep, 'expense', 5.00, 'Pourboire', '2026-03-20'),
(UUID(), @cash_id, @cat_courses, 'expense', 11.00, 'Boulangerie', '2026-03-25');

-- =============================================================================
-- Affichage du resume
-- =============================================================================
SELECT 'Donnees de test inserees avec succes!' AS message;
SELECT COUNT(*) AS total_transactions FROM mm_transactions;
SELECT
    trx_type,
    COUNT(*) AS nombre,
    SUM(trx_amount) AS total
FROM mm_transactions
GROUP BY trx_type;

-- =============================================================================
-- AVANCES (argent que j'ai prêté - direction='given')
-- =============================================================================

INSERT INTO mm_advances (adv_id, adv_usr_id, adv_acc_id, adv_amount, adv_description, adv_person, adv_date, adv_due_date, adv_direction, adv_status, adv_amount_received) VALUES
-- Avances en attente (pending)
(UUID(), @user_id, @compte_courant_id, 45.00, 'Restaurant anniversaire', 'Pierre', '2025-01-15', '2025-02-15', 'given', 'pending', 0.00),
(UUID(), @user_id, @compte_courant_id, 120.00, 'Billets concert', 'Marie', '2025-01-20', NULL, 'given', 'pending', 0.00),
(UUID(), @user_id, @cash_id, 25.00, 'Courses dépannage', 'Thomas', '2025-01-25', '2025-02-01', 'given', 'pending', 0.00),

-- Avances partiellement remboursées (partial)
(UUID(), @user_id, @compte_courant_id, 80.00, 'Cadeau commun collègue', 'Sophie', '2024-12-10', '2025-01-10', 'given', 'partial', 40.00),
(UUID(), @user_id, @compte_courant_id, 150.00, 'Location voiture weekend', 'Lucas', '2024-12-20', '2025-01-20', 'given', 'partial', 100.00),

-- Avances remboursées (paid)
(UUID(), @user_id, @compte_courant_id, 35.00, 'Pizza soirée jeux', 'Pierre', '2024-11-15', NULL, 'given', 'paid', 35.00),
(UUID(), @user_id, @cash_id, 15.00, 'Café et croissants', 'Marie', '2024-12-01', NULL, 'given', 'paid', 15.00),
(UUID(), @user_id, @compte_courant_id, 60.00, 'Essence covoiturage', 'Thomas', '2024-12-05', '2024-12-15', 'given', 'paid', 60.00);

-- =============================================================================
-- EMPRUNTS (argent qu'on m'a prêté - direction='received')
-- =============================================================================

INSERT INTO mm_advances (adv_id, adv_usr_id, adv_acc_id, adv_amount, adv_description, adv_person, adv_date, adv_due_date, adv_direction, adv_status, adv_amount_received) VALUES
-- Emprunts en attente (pending)
(UUID(), @user_id, @compte_courant_id, 200.00, 'Dépannage fin de mois', 'Papa', '2025-01-05', '2025-02-05', 'received', 'pending', 0.00),
(UUID(), @user_id, @compte_courant_id, 50.00, 'Courses en attendant salaire', 'Maman', '2025-01-28', NULL, 'received', 'pending', 0.00),

-- Emprunts partiellement remboursés (partial)
(UUID(), @user_id, @compte_courant_id, 300.00, 'Avance sur réparation voiture', 'Oncle Jean', '2024-11-20', '2025-01-20', 'received', 'partial', 150.00),
(UUID(), @user_id, @cash_id, 100.00, 'Prêt soirée poker', 'Antoine', '2024-12-15', '2025-01-15', 'received', 'partial', 60.00),

-- Emprunts remboursés (paid)
(UUID(), @user_id, @compte_courant_id, 75.00, 'Dépannage essence', 'Papa', '2024-10-10', NULL, 'received', 'paid', 75.00),
(UUID(), @user_id, @compte_courant_id, 40.00, 'Prêt pour cadeau', 'Sœur', '2024-11-25', '2024-12-25', 'received', 'paid', 40.00);

-- Vérification des avances et emprunts insérés
SELECT 'Avances et emprunts insérés:' AS info;
SELECT
    adv_direction,
    adv_status,
    COUNT(*) AS nombre,
    SUM(adv_amount) AS total,
    SUM(adv_amount_received) AS rembourse,
    SUM(adv_amount - adv_amount_received) AS restant
FROM mm_advances
WHERE adv_usr_id = @user_id
GROUP BY adv_direction, adv_status
ORDER BY adv_direction, adv_status;

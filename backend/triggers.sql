-- =============================================================================
-- TRIGGERS
-- Fichier séparé car DELIMITER ne fonctionne pas avec mysql < file.sql
-- Exécuté avec: mysql --delimiter="//" < triggers.sql
-- =============================================================================

-- Supprime le trigger s'il existe
DROP TRIGGER IF EXISTS after_user_insert //

-- =============================================================================
-- Trigger : after_user_insert
-- Crée automatiquement deux comptes par défaut à la création d'un utilisateur :
-- - Un compte courant (checking)
-- - Un compte espèces (cash)
-- =============================================================================
CREATE TRIGGER after_user_insert
AFTER INSERT ON mm_users
FOR EACH ROW
BEGIN
    INSERT INTO mm_accounts (acc_id, acc_usr_id, acc_name, acc_type, acc_balance, acc_currency, acc_icon, acc_color)
    VALUES (UUID(), NEW.usr_id, 'Compte courant', 'checking', 0.00, 'EUR', '/default/icons/bank.png', '#3b82f6');

    INSERT INTO mm_accounts (acc_id, acc_usr_id, acc_name, acc_type, acc_balance, acc_currency, acc_icon, acc_color)
    VALUES (UUID(), NEW.usr_id, 'Espèces', 'cash', 0.00, 'EUR', '/default/icons/wallet.png', '#22c55e');
END //

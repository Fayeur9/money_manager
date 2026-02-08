-- =============================================================================
-- Exemples de requetes SQL pour l'application Money Manager
-- Convention: prefixe mm_ pour les tables, prefixe entite pour les colonnes
-- =============================================================================

-- Trouver un utilisateur par son email (pour l'authentification)
SELECT `usr_id`, `usr_email`, `usr_password_hash`, `usr_first_name`, `usr_last_name`
FROM `mm_users`
WHERE `usr_email` = 'test';

-- Creer un nouvel utilisateur (inscription)
INSERT INTO `mm_users` (`usr_id`, `usr_email`, `usr_password_hash`, `usr_first_name`, `usr_last_name`)
VALUES (UUID(), 'nouveau@email.com', '$2b$12$hashedpassword', 'Prenom', 'Nom');

-- Trouver tous les comptes d'un utilisateur donne
SELECT `acc_id`, `acc_name`, `acc_type`, `acc_balance`, `acc_currency`, `acc_icon`, `acc_color`, `created_at`
FROM `mm_accounts`
WHERE `acc_usr_id` = 'uuid-utilisateur'
ORDER BY `created_at` DESC;

-- Creer un nouveau compte bancaire
INSERT INTO `mm_accounts` (`acc_id`, `acc_usr_id`, `acc_name`, `acc_type`, `acc_balance`, `acc_currency`, `acc_icon`, `acc_color`)
VALUES (UUID(), 'uuid-utilisateur', 'Compte Epargne', 'savings', 0.00, 'EUR', '/default/icons/piggy.png', '#22c55e');

-- Mettre a jour le solde d'un compte apres une transaction
UPDATE `mm_accounts`
SET `acc_balance` = `acc_balance` - 50.00
WHERE `acc_id` = 'uuid-compte';

-- Supprimer un compte (suppression en cascade des transactions)
DELETE FROM `mm_accounts` WHERE `acc_id` = 'uuid-compte';

-- Calculer le solde total de tous les comptes d'un utilisateur
SELECT SUM(`acc_balance`) AS `solde_total`
FROM `mm_accounts`
WHERE `acc_usr_id` = 'uuid-utilisateur';

-- Trouver toutes les transactions d'un compte avec les details de categorie
SELECT `t`.`trx_id`, `t`.`trx_type`, `t`.`trx_amount`, `t`.`trx_description`, `t`.`trx_date`,
       `c`.`cat_name` AS `nom_categorie`, `c`.`cat_icon` AS `icone_categorie`, `c`.`cat_color` AS `couleur_categorie`
FROM `mm_transactions` `t`
LEFT JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
WHERE `t`.`trx_acc_id` = 'uuid-compte'
ORDER BY `t`.`trx_date` DESC, `t`.`created_at` DESC
LIMIT 50;

-- Trouver toutes les transactions d'un utilisateur (tous comptes confondus)
SELECT `t`.`trx_id`, `t`.`trx_type`, `t`.`trx_amount`, `t`.`trx_description`, `t`.`trx_date`,
       `a`.`acc_name` AS `nom_compte`,
       `c`.`cat_name` AS `nom_categorie`
FROM `mm_transactions` `t`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
LEFT JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
ORDER BY `t`.`trx_date` DESC
LIMIT 100;

-- Ajouter une nouvelle depense
INSERT INTO `mm_transactions` (`trx_id`, `trx_acc_id`, `trx_cat_id`, `trx_type`, `trx_amount`, `trx_description`, `trx_date`)
VALUES (UUID(), 'uuid-compte', 'uuid-categorie', 'expense', 45.50, 'Courses supermarche', '2025-01-27');

-- Ajouter un nouveau revenu
INSERT INTO `mm_transactions` (`trx_id`, `trx_acc_id`, `trx_cat_id`, `trx_type`, `trx_amount`, `trx_description`, `trx_date`)
VALUES (UUID(), 'uuid-compte', 'uuid-categorie', 'income', 1426.00, 'Salaire janvier', '2025-01-28');

-- Ajouter un virement entre deux comptes
INSERT INTO `mm_transactions` (`trx_id`, `trx_acc_id`, `trx_target_acc_id`, `trx_type`, `trx_amount`, `trx_description`, `trx_date`)
VALUES (UUID(), 'uuid-compte-source', 'uuid-compte-dest', 'transfer', 100.00, 'Epargne mensuelle', '2025-01-30');

-- Modifier une transaction existante
UPDATE `mm_transactions`
SET `trx_amount` = 50.00, `trx_description` = 'Courses modifiees'
WHERE `trx_id` = 'uuid-transaction';

-- Supprimer une transaction
DELETE FROM `mm_transactions` WHERE `trx_id` = 'uuid-transaction';

-- Trouver le total des depenses par categorie pour un mois donne
SELECT `c`.`cat_name` AS `categorie`, `c`.`cat_icon`, `c`.`cat_color`,
       SUM(`t`.`trx_amount`) AS `total`,
       COUNT(*) AS `nb_transactions`
FROM `mm_transactions` `t`
JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_type` = 'expense'
  AND `t`.`trx_date` BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY `c`.`cat_id`, `c`.`cat_name`, `c`.`cat_icon`, `c`.`cat_color`
ORDER BY `total` DESC;

-- Trouver le total des revenus par categorie pour un mois donne
SELECT `c`.`cat_name` AS `categorie`,
       SUM(`t`.`trx_amount`) AS `total`
FROM `mm_transactions` `t`
JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_type` = 'income'
  AND `t`.`trx_date` BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY `c`.`cat_id`, `c`.`cat_name`
ORDER BY `total` DESC;

-- Trouver l'evolution mensuelle du solde sur une annee
SELECT
    DATE_FORMAT(`t`.`trx_date`, '%Y-%m') AS `mois`,
    SUM(CASE WHEN `t`.`trx_type` = 'income' THEN `t`.`trx_amount` ELSE 0 END) AS `revenus`,
    SUM(CASE WHEN `t`.`trx_type` = 'expense' THEN `t`.`trx_amount` ELSE 0 END) AS `depenses`,
    SUM(CASE WHEN `t`.`trx_type` = 'income' THEN `t`.`trx_amount` ELSE -`t`.`trx_amount` END) AS `solde`
FROM `mm_transactions` `t`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_date` BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY DATE_FORMAT(`t`.`trx_date`, '%Y-%m')
ORDER BY `mois`;

-- Trouver les 10 plus grosses depenses
SELECT `t`.`trx_amount`, `t`.`trx_description`, `t`.`trx_date`, `c`.`cat_name` AS `categorie`
FROM `mm_transactions` `t`
LEFT JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur' AND `t`.`trx_type` = 'expense'
ORDER BY `t`.`trx_amount` DESC
LIMIT 10;

-- Trouver la moyenne mensuelle des depenses par categorie
SELECT `c`.`cat_name` AS `categorie`,
       AVG(`total_mensuel`) AS `moyenne_mensuelle`
FROM (
    SELECT `t`.`trx_cat_id`,
           DATE_FORMAT(`t`.`trx_date`, '%Y-%m') AS `mois`,
           SUM(`t`.`trx_amount`) AS `total_mensuel`
    FROM `mm_transactions` `t`
    JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
    WHERE `a`.`acc_usr_id` = 'uuid-utilisateur' AND `t`.`trx_type` = 'expense'
    GROUP BY `t`.`trx_cat_id`, DATE_FORMAT(`t`.`trx_date`, '%Y-%m')
) AS `mensuel`
JOIN `mm_categories` `c` ON `mensuel`.`trx_cat_id` = `c`.`cat_id`
GROUP BY `c`.`cat_id`, `c`.`cat_name`
ORDER BY `moyenne_mensuelle` DESC;

-- Trouver toutes les categories (par defaut + personnalisees de l'utilisateur)
SELECT `cat_id`, `cat_parent_id`, `cat_name`, `cat_type`, `cat_icon`, `cat_color`, `cat_is_default`
FROM `mm_categories`
WHERE `cat_is_default` = TRUE OR `cat_usr_id` = 'uuid-utilisateur'
ORDER BY `cat_is_default` DESC, `cat_parent_id` IS NOT NULL, `cat_name` ASC;

-- Creer une categorie personnalisee (sans parent)
INSERT INTO `mm_categories` (`cat_id`, `cat_usr_id`, `cat_parent_id`, `cat_name`, `cat_type`, `cat_icon`, `cat_color`, `cat_is_default`)
VALUES (UUID(), 'uuid-utilisateur', NULL, 'Animaux', 'expense', '/default/icons/paw.png', '#f97316', FALSE);

-- Creer une sous-categorie (avec parent)
INSERT INTO `mm_categories` (`cat_id`, `cat_usr_id`, `cat_parent_id`, `cat_name`, `cat_type`, `cat_icon`, `cat_color`, `cat_is_default`)
VALUES (UUID(), 'uuid-utilisateur', 'uuid-categorie-parent', 'Chiens', 'expense', '/default/icons/dog.png', '#f97316', FALSE);

-- Modifier une categorie personnalisee
UPDATE `mm_categories`
SET `cat_name` = 'Animaux de compagnie', `cat_icon` = '/default/icons/cat.png'
WHERE `cat_id` = 'uuid-categorie' AND `cat_usr_id` = 'uuid-utilisateur';

-- Changer le parent d'une categorie
UPDATE `mm_categories`
SET `cat_parent_id` = 'uuid-nouveau-parent'
WHERE `cat_id` = 'uuid-categorie' AND `cat_usr_id` = 'uuid-utilisateur';

-- Supprimer une categorie personnalisee (les enfants deviennent orphelins via ON DELETE SET NULL)
DELETE FROM `mm_categories` WHERE `cat_id` = 'uuid-categorie' AND `cat_usr_id` = 'uuid-utilisateur' AND `cat_is_default` = FALSE;

-- Trouver toutes les sous-categories d'une categorie (descendants recursifs)
WITH RECURSIVE `descendants` AS (
    SELECT `cat_id`, `cat_name`, `cat_parent_id`, 0 AS `level`
    FROM `mm_categories`
    WHERE `cat_id` = 'uuid-categorie-parent'

    UNION ALL

    SELECT `c`.`cat_id`, `c`.`cat_name`, `c`.`cat_parent_id`, `d`.`level` + 1
    FROM `mm_categories` `c`
    INNER JOIN `descendants` `d` ON `c`.`cat_parent_id` = `d`.`cat_id`
)
SELECT * FROM `descendants` WHERE `level` > 0 ORDER BY `level`, `cat_name`;

-- =============================================================================
-- TRANSACTIONS RECURRENTES
-- =============================================================================

-- Trouver toutes les transactions recurrentes actives d'un utilisateur
SELECT `r`.`rec_id`, `r`.`rec_type`, `r`.`rec_amount`, `r`.`rec_description`, `r`.`rec_frequency`,
       `r`.`rec_start_date`, `r`.`rec_end_date`, `r`.`rec_next_occurrence`,
       `r`.`rec_occurrences_limit`, `r`.`rec_occurrences_count`,
       `a`.`acc_name` AS `nom_compte`, `c`.`cat_name` AS `nom_categorie`
FROM `mm_recurring` `r`
JOIN `mm_accounts` `a` ON `r`.`rec_acc_id` = `a`.`acc_id`
LEFT JOIN `mm_categories` `c` ON `r`.`rec_cat_id` = `c`.`cat_id`
WHERE `r`.`rec_usr_id` = 'uuid-utilisateur' AND `r`.`rec_is_active` = TRUE
ORDER BY `r`.`rec_next_occurrence` ASC;

-- Creer une transaction recurrente (salaire mensuel)
INSERT INTO `mm_recurring`
    (`rec_id`, `rec_usr_id`, `rec_acc_id`, `rec_cat_id`, `rec_type`, `rec_amount`, `rec_description`, `rec_frequency`, `rec_start_date`, `rec_next_occurrence`)
VALUES
    (UUID(), 'uuid-utilisateur', 'uuid-compte', 'uuid-categorie', 'income', 1426.00, 'Salaire', 'monthly', '2025-01-28', '2025-02-28');

-- Creer un paiement en plusieurs fois (4x)
INSERT INTO `mm_recurring`
    (`rec_id`, `rec_usr_id`, `rec_acc_id`, `rec_cat_id`, `rec_type`, `rec_amount`, `rec_description`, `rec_frequency`, `rec_start_date`, `rec_next_occurrence`, `rec_occurrences_limit`)
VALUES
    (UUID(), 'uuid-utilisateur', 'uuid-compte', 'uuid-categorie', 'expense', 250.00, 'TV - Paiement 4x', 'monthly', '2025-01-15', '2025-02-15', 4);

-- Mettre a jour une transaction recurrente apres generation d'une occurrence
UPDATE `mm_recurring`
SET `rec_occurrences_count` = `rec_occurrences_count` + 1,
    `rec_next_occurrence` = DATE_ADD(`rec_next_occurrence`, INTERVAL 1 MONTH)
WHERE `rec_id` = 'uuid-recurring';

-- Desactiver une transaction recurrente
UPDATE `mm_recurring`
SET `rec_is_active` = FALSE
WHERE `rec_id` = 'uuid-recurring';

-- Trouver les transactions recurrentes a generer aujourd'hui
SELECT * FROM `mm_recurring`
WHERE `rec_is_active` = TRUE
  AND `rec_next_occurrence` <= CURDATE()
  AND (`rec_end_date` IS NULL OR `rec_end_date` >= CURDATE())
  AND (`rec_occurrences_limit` IS NULL OR `rec_occurrences_count` < `rec_occurrences_limit`);

-- =============================================================================
-- STATISTIQUES
-- =============================================================================

-- Obtenir le resume financier complet d'un utilisateur
SELECT
    (SELECT SUM(`acc_balance`) FROM `mm_accounts` WHERE `acc_usr_id` = 'uuid-utilisateur') AS `solde_total`,
    (SELECT SUM(`trx_amount`) FROM `mm_transactions` `t`
     JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
     WHERE `a`.`acc_usr_id` = 'uuid-utilisateur' AND `t`.`trx_type` = 'income'
       AND MONTH(`t`.`trx_date`) = MONTH(CURDATE()) AND YEAR(`t`.`trx_date`) = YEAR(CURDATE())
    ) AS `revenus_mois`,
    (SELECT SUM(`trx_amount`) FROM `mm_transactions` `t`
     JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
     WHERE `a`.`acc_usr_id` = 'uuid-utilisateur' AND `t`.`trx_type` = 'expense'
       AND MONTH(`t`.`trx_date`) = MONTH(CURDATE()) AND YEAR(`t`.`trx_date`) = YEAR(CURDATE())
    ) AS `depenses_mois`;

-- Comparer les depenses entre deux mois par categorie
SELECT
    `c`.`cat_name` AS `categorie`,
    SUM(CASE WHEN MONTH(`t`.`trx_date`) = 12 THEN `t`.`trx_amount` ELSE 0 END) AS `decembre`,
    SUM(CASE WHEN MONTH(`t`.`trx_date`) = 1 THEN `t`.`trx_amount` ELSE 0 END) AS `janvier`,
    SUM(CASE WHEN MONTH(`t`.`trx_date`) = 1 THEN `t`.`trx_amount` ELSE 0 END) -
    SUM(CASE WHEN MONTH(`t`.`trx_date`) = 12 THEN `t`.`trx_amount` ELSE 0 END) AS `difference`
FROM `mm_transactions` `t`
JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_type` = 'expense'
  AND ((MONTH(`t`.`trx_date`) = 12 AND YEAR(`t`.`trx_date`) = 2024)
       OR (MONTH(`t`.`trx_date`) = 1 AND YEAR(`t`.`trx_date`) = 2025))
GROUP BY `c`.`cat_id`, `c`.`cat_name`
ORDER BY `difference` DESC;

-- Rechercher des transactions par mot-cle
SELECT `t`.`trx_id`, `t`.`trx_amount`, `t`.`trx_description`, `t`.`trx_date`, `c`.`cat_name` AS `categorie`
FROM `mm_transactions` `t`
LEFT JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_description` LIKE '%carrefour%'
ORDER BY `t`.`trx_date` DESC;

-- =============================================================================
-- BUDGETS
-- =============================================================================

-- Trouver tous les budgets d'un utilisateur avec les details de categorie
SELECT `b`.`bgt_id`, `b`.`bgt_amount`, `b`.`bgt_display_order`,
       `c`.`cat_name` AS `nom_categorie`, `c`.`cat_icon` AS `icone_categorie`, `c`.`cat_color` AS `couleur_categorie`
FROM `mm_budgets` `b`
JOIN `mm_categories` `c` ON `b`.`bgt_cat_id` = `c`.`cat_id`
WHERE `b`.`bgt_usr_id` = 'uuid-utilisateur'
ORDER BY `b`.`bgt_display_order` ASC, `c`.`cat_name` ASC;

-- Creer un nouveau budget
INSERT INTO `mm_budgets` (`bgt_id`, `bgt_usr_id`, `bgt_cat_id`, `bgt_amount`, `bgt_display_order`)
VALUES (UUID(), 'uuid-utilisateur', 'uuid-categorie', 400.00, NULL);

-- Modifier le plafond d'un budget
UPDATE `mm_budgets`
SET `bgt_amount` = 500.00
WHERE `bgt_id` = 'uuid-budget';

-- Modifier l'ordre d'affichage d'un budget
UPDATE `mm_budgets`
SET `bgt_display_order` = 1
WHERE `bgt_id` = 'uuid-budget';

-- Supprimer un budget
DELETE FROM `mm_budgets` WHERE `bgt_id` = 'uuid-budget';

-- Trouver les depenses du mois en cours pour chaque budget d'un utilisateur
SELECT `b`.`bgt_id`, `b`.`bgt_amount` AS `plafond`,
       `c`.`cat_name` AS `categorie`, `c`.`cat_icon`, `c`.`cat_color`,
       COALESCE(SUM(`t`.`trx_amount`), 0) AS `depenses`,
       `b`.`bgt_amount` - COALESCE(SUM(`t`.`trx_amount`), 0) AS `restant`
FROM `mm_budgets` `b`
JOIN `mm_categories` `c` ON `b`.`bgt_cat_id` = `c`.`cat_id`
LEFT JOIN `mm_transactions` `t` ON `t`.`trx_cat_id` = `c`.`cat_id`
    AND `t`.`trx_type` = 'expense'
    AND MONTH(`t`.`trx_date`) = MONTH(CURDATE())
    AND YEAR(`t`.`trx_date`) = YEAR(CURDATE())
LEFT JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id` AND `a`.`acc_usr_id` = `b`.`bgt_usr_id`
WHERE `b`.`bgt_usr_id` = 'uuid-utilisateur'
GROUP BY `b`.`bgt_id`, `b`.`bgt_amount`, `c`.`cat_name`, `c`.`cat_icon`, `c`.`cat_color`
ORDER BY `b`.`bgt_display_order` ASC, `c`.`cat_name` ASC;

-- Verifier si un budget existe deja pour une categorie donnee
SELECT EXISTS(
    SELECT 1 FROM `mm_budgets`
    WHERE `bgt_usr_id` = 'uuid-utilisateur' AND `bgt_cat_id` = 'uuid-categorie'
) AS `existe`;

-- =============================================================================
-- BUDGETS HIERARCHIQUES
-- =============================================================================

-- Creer un budget parent (sans parent_id)
INSERT INTO `mm_budgets` (`bgt_id`, `bgt_usr_id`, `bgt_cat_id`, `bgt_parent_id`, `bgt_amount`)
VALUES (UUID(), 'uuid-utilisateur', 'uuid-categorie', NULL, 400.00);

-- Creer un budget enfant (avec parent_id)
INSERT INTO `mm_budgets` (`bgt_id`, `bgt_usr_id`, `bgt_cat_id`, `bgt_parent_id`, `bgt_amount`)
VALUES (UUID(), 'uuid-utilisateur', 'uuid-categorie-enfant', 'uuid-budget-parent', 150.00);

-- Verifier qu'un budget parent existe et n'est pas lui-meme un enfant
SELECT `bgt_id`, `bgt_parent_id` FROM `mm_budgets`
WHERE `bgt_id` = 'uuid-budget-parent' AND `bgt_usr_id` = 'uuid-utilisateur';

-- Verifier qu'une categorie n'est pas deja enfant de ce parent
SELECT `bgt_id` FROM `mm_budgets`
WHERE `bgt_parent_id` = 'uuid-budget-parent' AND `bgt_cat_id` = 'uuid-categorie';

-- Verifier qu'une categorie n'est pas elle-meme un budget parent avec enfants
SELECT `b`.`bgt_id` FROM `mm_budgets` `b`
WHERE `b`.`bgt_cat_id` = 'uuid-categorie' AND `b`.`bgt_usr_id` = 'uuid-utilisateur' AND `b`.`bgt_parent_id` IS NULL
AND EXISTS (SELECT 1 FROM `mm_budgets` `child` WHERE `child`.`bgt_parent_id` = `b`.`bgt_id`);

-- Trouver tous les budgets avec leur hierarchie et depenses du mois
SELECT `b`.`bgt_id` AS `id`, `b`.`bgt_cat_id` AS `category_id`, `b`.`bgt_parent_id` AS `parent_budget_id`,
       `b`.`bgt_amount` AS `budget_amount`, `b`.`bgt_display_order` AS `display_order`,
       `c`.`cat_name` AS `category_name`, `c`.`cat_icon` AS `category_icon`, `c`.`cat_color` AS `category_color`
FROM `mm_budgets` `b`
JOIN `mm_categories` `c` ON `b`.`bgt_cat_id` = `c`.`cat_id`
WHERE `b`.`bgt_usr_id` = 'uuid-utilisateur'
ORDER BY `b`.`bgt_parent_id` IS NOT NULL,
         CASE WHEN `b`.`bgt_display_order` IS NULL THEN 1 ELSE 0 END,
         `b`.`bgt_display_order` ASC, `b`.`created_at` ASC;

-- Calculer les depenses d'un budget (categorie + toutes ses sous-categories via CTE recursive)
WITH RECURSIVE `category_tree` AS (
    SELECT `cat_id` FROM `mm_categories` WHERE `cat_id` = 'uuid-categorie'
    UNION ALL
    SELECT `c`.`cat_id` FROM `mm_categories` `c`
    INNER JOIN `category_tree` `ct` ON `c`.`cat_parent_id` = `ct`.`cat_id`
)
SELECT COALESCE(SUM(`t`.`trx_amount`), 0) AS `spent`
FROM `mm_transactions` `t`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_cat_id` IN (SELECT `cat_id` FROM `category_tree`)
  AND `t`.`trx_type` = 'expense'
  AND `t`.`trx_date` BETWEEN '2025-01-01' AND '2025-01-31';

-- Trouver les categories disponibles pour ajouter comme budget enfant
-- (exclut celles deja enfants de ce parent et celles qui sont elles-memes parents)
SELECT `c`.`cat_id` AS `id`, `c`.`cat_name` AS `name`, `c`.`cat_icon` AS `icon`, `c`.`cat_color` AS `color`,
       `c`.`cat_parent_id` AS `parent_id`, `pc`.`cat_name` AS `parent_name`
FROM `mm_categories` `c`
LEFT JOIN `mm_categories` `pc` ON `c`.`cat_parent_id` = `pc`.`cat_id`
WHERE `c`.`cat_type` = 'expense'
AND (`c`.`cat_usr_id` = 'uuid-utilisateur' OR `c`.`cat_usr_id` IS NULL)
-- Exclure les categories deja enfants de ce budget parent
AND `c`.`cat_id` NOT IN (
    SELECT `bgt_cat_id` FROM `mm_budgets` WHERE `bgt_parent_id` = 'uuid-budget-parent'
)
-- Exclure les categories qui sont elles-memes des budgets parents avec enfants
AND `c`.`cat_id` NOT IN (
    SELECT `b`.`bgt_cat_id` FROM `mm_budgets` `b`
    WHERE `b`.`bgt_usr_id` = 'uuid-utilisateur' AND `b`.`bgt_parent_id` IS NULL
    AND EXISTS (SELECT 1 FROM `mm_budgets` `child` WHERE `child`.`bgt_parent_id` = `b`.`bgt_id`)
)
ORDER BY `c`.`cat_name` ASC;

-- =============================================================================
-- VERIFICATION BUDGET AVANT TRANSACTION
-- =============================================================================

-- Verifier si une depense depasserait un budget (avec recherche dans les ancetres)
WITH RECURSIVE `ancestors` AS (
    SELECT `cat_id`, `cat_parent_id`, `cat_name`, 0 AS `level`
    FROM `mm_categories` WHERE `cat_id` = 'uuid-categorie'
    UNION ALL
    SELECT `c`.`cat_id`, `c`.`cat_parent_id`, `c`.`cat_name`, `a`.`level` + 1
    FROM `mm_categories` `c`
    INNER JOIN `ancestors` `a` ON `c`.`cat_id` = `a`.`cat_parent_id`
)
SELECT `b`.`bgt_id`, `b`.`bgt_cat_id`, `b`.`bgt_amount` AS `budget_amount`,
       `a`.`cat_name` AS `category_name`, `a`.`level`
FROM `mm_budgets` `b`
JOIN `ancestors` `a` ON `b`.`bgt_cat_id` = `a`.`cat_id`
WHERE `b`.`bgt_usr_id` = 'uuid-utilisateur'
ORDER BY `a`.`level` ASC
LIMIT 1;

-- Calculer les depenses incluant les categories enfants du budget trouve
WITH RECURSIVE `category_tree` AS (
    SELECT `cat_id` FROM `mm_categories` WHERE `cat_id` = 'uuid-categorie-budget'
    UNION ALL
    SELECT `c`.`cat_id` FROM `mm_categories` `c`
    INNER JOIN `category_tree` `ct` ON `c`.`cat_parent_id` = `ct`.`cat_id`
)
SELECT COALESCE(SUM(`t`.`trx_amount`), 0) AS `spent`
FROM `mm_transactions` `t`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_cat_id` IN (SELECT `cat_id` FROM `category_tree`)
  AND `t`.`trx_type` = 'expense'
  AND `t`.`trx_date` BETWEEN '2025-01-01' AND '2025-01-31';

-- =============================================================================
-- FILTRAGE TRANSACTIONS AVEC SOUS-CATEGORIES
-- =============================================================================

-- Trouver une categorie et toutes ses sous-categories
SELECT `cat_id` FROM `mm_categories`
WHERE `cat_id` = 'uuid-categorie-parent' OR `cat_parent_id` = 'uuid-categorie-parent';

-- Trouver les transactions d'un utilisateur filtrees par categorie (incluant les enfants)
SELECT `t`.`trx_id` AS `id`, `t`.`trx_acc_id` AS `account_id`, `t`.`trx_target_acc_id` AS `target_account_id`,
       `t`.`trx_cat_id` AS `category_id`, `t`.`trx_rec_id` AS `recurring_id`, `t`.`trx_type` AS `type`,
       `t`.`trx_amount` AS `amount`, `t`.`trx_description` AS `description`, `t`.`trx_date` AS `date`,
       `t`.`created_at`, `c`.`cat_name` AS `category_name`, `c`.`cat_icon` AS `category_icon`,
       `c`.`cat_color` AS `category_color`, `a`.`acc_name` AS `account_name`,
       `ta`.`acc_name` AS `target_account_name`
FROM `mm_transactions` `t`
LEFT JOIN `mm_categories` `c` ON `t`.`trx_cat_id` = `c`.`cat_id`
JOIN `mm_accounts` `a` ON `t`.`trx_acc_id` = `a`.`acc_id`
LEFT JOIN `mm_accounts` `ta` ON `t`.`trx_target_acc_id` = `ta`.`acc_id`
WHERE `a`.`acc_usr_id` = 'uuid-utilisateur'
  AND `t`.`trx_date` >= '2025-01-01'
  AND `t`.`trx_date` <= '2025-01-31'
  AND `t`.`trx_cat_id` IN ('uuid-cat-1', 'uuid-cat-2', 'uuid-cat-3')  -- Parent + enfants
ORDER BY `t`.`trx_date` DESC, `t`.`created_at` DESC
LIMIT 50 OFFSET 0;

-- =============================================================================
-- PROFIL UTILISATEUR
-- =============================================================================

-- Mettre a jour le profil utilisateur (prenom, nom, couleur avatar)
UPDATE `mm_users`
SET `usr_first_name` = 'NouveauPrenom', `usr_last_name` = 'NouveauNom', `usr_avatar_color` = '#3b82f6'
WHERE `usr_id` = 'uuid-utilisateur';

-- Mettre a jour l'URL de l'avatar apres upload
UPDATE `mm_users`
SET `usr_avatar_url` = '/uploads/users/uuid-utilisateur_hash.png'
WHERE `usr_id` = 'uuid-utilisateur';

-- Supprimer l'avatar d'un utilisateur
UPDATE `mm_users`
SET `usr_avatar_url` = NULL
WHERE `usr_id` = 'uuid-utilisateur';

-- Recuperer le profil complet d'un utilisateur
SELECT `usr_id` AS `id`, `usr_email` AS `email`, `usr_first_name` AS `first_name`,
       `usr_last_name` AS `last_name`, `usr_avatar_url` AS `avatar_url`,
       `usr_avatar_color` AS `avatar_color`, `created_at`, `updated_at`
FROM `mm_users`
WHERE `usr_id` = 'uuid-utilisateur';

-- =============================================================================
-- TRAITEMENT DES TRANSACTIONS RECURRENTES (BATCH)
-- =============================================================================

-- Trouver les transactions recurrentes a traiter aujourd'hui
SELECT `r`.`rec_id`, `r`.`rec_acc_id`, `r`.`rec_cat_id`, `r`.`rec_type`, `r`.`rec_amount`,
       `r`.`rec_description`, `r`.`rec_frequency`, `r`.`rec_next_occurrence`, `r`.`rec_end_date`,
       `r`.`rec_occurrences_limit`, `r`.`rec_occurrences_count`
FROM `mm_recurring` `r`
WHERE `r`.`rec_usr_id` = 'uuid-utilisateur'
  AND `r`.`rec_is_active` = TRUE
  AND `r`.`rec_next_occurrence` <= CURDATE();

-- Generer une transaction a partir d'une recurrence
INSERT INTO `mm_transactions` (`trx_id`, `trx_acc_id`, `trx_cat_id`, `trx_rec_id`,
                               `trx_type`, `trx_amount`, `trx_description`, `trx_date`)
VALUES (UUID(), 'uuid-compte', 'uuid-categorie', 'uuid-recurring', 'expense', 50.00, 'Abonnement Netflix', '2025-01-15');

-- Mettre a jour la recurrence apres generation (prochaine occurrence + compteur)
UPDATE `mm_recurring`
SET `rec_next_occurrence` = DATE_ADD(`rec_next_occurrence`, INTERVAL 1 MONTH),
    `rec_occurrences_count` = `rec_occurrences_count` + 1
WHERE `rec_id` = 'uuid-recurring';

-- Desactiver une recurrence quand la limite est atteinte
UPDATE `mm_recurring`
SET `rec_is_active` = FALSE
WHERE `rec_id` = 'uuid-recurring'
  AND `rec_occurrences_limit` IS NOT NULL
  AND `rec_occurrences_count` >= `rec_occurrences_limit`;

-- =============================================================================
-- MISE A JOUR ORDRE BUDGETS (DRAG & DROP)
-- =============================================================================

-- Reinitialiser l'ordre d'affichage de tous les budgets d'un utilisateur
UPDATE `mm_budgets`
SET `bgt_display_order` = NULL
WHERE `bgt_usr_id` = 'uuid-utilisateur';

-- Definir l'ordre d'affichage pour un budget specifique
UPDATE `mm_budgets`
SET `bgt_display_order` = 1
WHERE `bgt_id` = 'uuid-budget' AND `bgt_usr_id` = 'uuid-utilisateur';

-- =============================================================================
-- AVANCES (PRETS ET EMPRUNTS)
-- =============================================================================

-- Trouver toutes les avances d'un utilisateur avec les details du compte
SELECT `a`.`adv_id` AS `id`, `a`.`adv_usr_id` AS `user_id`, `a`.`adv_acc_id` AS `account_id`,
       `a`.`adv_amount` AS `amount`, `a`.`adv_description` AS `description`,
       `a`.`adv_person` AS `person`, `a`.`adv_date` AS `date`,
       `a`.`adv_due_date` AS `due_date`, `a`.`adv_direction` AS `direction`,
       `a`.`adv_status` AS `status`, `a`.`adv_amount_received` AS `amount_received`,
       `a`.`adv_trx_id` AS `transaction_id`,
       `acc`.`acc_name` AS `account_name`, `acc`.`acc_icon` AS `account_icon`
FROM `mm_advances` `a`
JOIN `mm_accounts` `acc` ON `a`.`adv_acc_id` = `acc`.`acc_id`
WHERE `a`.`adv_usr_id` = 'uuid-utilisateur'
ORDER BY `a`.`adv_date` DESC, `a`.`created_at` DESC;

-- Trouver les avances filtrees par direction (prets donnes ou recus)
SELECT `a`.`adv_id` AS `id`, `a`.`adv_amount` AS `amount`, `a`.`adv_person` AS `person`,
       `a`.`adv_date` AS `date`, `a`.`adv_status` AS `status`,
       `a`.`adv_amount_received` AS `amount_received`
FROM `mm_advances` `a`
WHERE `a`.`adv_usr_id` = 'uuid-utilisateur'
  AND `a`.`adv_direction` = 'given'  -- 'given' = j'ai prete, 'received' = on m'a prete
ORDER BY `a`.`adv_date` DESC;

-- Creer une nouvelle avance (pret donne)
INSERT INTO `mm_advances` (`adv_id`, `adv_usr_id`, `adv_acc_id`, `adv_amount`, `adv_description`,
                            `adv_person`, `adv_date`, `adv_due_date`, `adv_direction`, `adv_trx_id`)
VALUES (UUID(), 'uuid-utilisateur', 'uuid-compte', 50.00, 'Restaurant',
        'Marie', '2025-01-15', '2025-02-15', 'given', 'uuid-transaction');

-- Mettre a jour une avance (description, personne, echeance)
UPDATE `mm_advances`
SET `adv_description` = 'Nouvelle description', `adv_due_date` = '2025-03-01'
WHERE `adv_id` = 'uuid-avance';

-- Enregistrer un remboursement partiel et mettre a jour le statut automatiquement
UPDATE `mm_advances`
SET `adv_amount_received` = `adv_amount_received` + 25.00,
    `adv_status` = CASE
        WHEN `adv_amount_received` + 25.00 >= `adv_amount` THEN 'paid'
        ELSE 'partial'
    END
WHERE `adv_id` = 'uuid-avance';

-- Supprimer une avance
DELETE FROM `mm_advances` WHERE `adv_id` = 'uuid-avance';

-- Resume des avances par personne (pour le tableau de bord)
SELECT
    `adv_person` AS `person`,
    COUNT(*) AS `count`,
    SUM(`adv_amount`) AS `total_amount`,
    SUM(`adv_amount_received`) AS `total_received`,
    SUM(`adv_amount` - `adv_amount_received`) AS `total_pending`
FROM `mm_advances`
WHERE `adv_usr_id` = 'uuid-utilisateur'
  AND `adv_status` != 'paid'
  AND `adv_direction` = 'given'
GROUP BY `adv_person`
ORDER BY `total_pending` DESC;

-- Totaux globaux des avances (statistiques)
SELECT
    COUNT(*) AS `total_advances`,
    COALESCE(SUM(`adv_amount`), 0) AS `total_amount`,
    COALESCE(SUM(`adv_amount_received`), 0) AS `total_received`,
    COALESCE(SUM(`adv_amount` - `adv_amount_received`), 0) AS `total_pending`,
    COUNT(CASE WHEN `adv_status` = 'pending' THEN 1 END) AS `count_pending`,
    COUNT(CASE WHEN `adv_status` = 'partial' THEN 1 END) AS `count_partial`,
    COUNT(CASE WHEN `adv_status` = 'paid' THEN 1 END) AS `count_paid`
FROM `mm_advances`
WHERE `adv_usr_id` = 'uuid-utilisateur';

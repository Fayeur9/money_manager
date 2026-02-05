-- Migration: Ajouter la colonne display_order à la table mm_budgets
ALTER TABLE mm_budgets ADD COLUMN bgt_display_order INT DEFAULT NULL;

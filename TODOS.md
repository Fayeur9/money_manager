# TODOs Money Manager

## 1. Profil - Gestion du mode édition ✅
- [x] Faire en sorte qu'appuyer sur Échap équivaut au bouton retour
- [x] Ajouter la logique de modification non enregistrée (confirmation avant de quitter)

## 2. Modal budgets Dashboard ✅
- [x] La modal pour la configuration des budgets à afficher sur le dashboard ne se ferme pas avec Échap

## 3. Vérification documentation ✅
- [x] Vérifier les cohérences et validités des fichiers `DESIGN.md` / `README.md` / `queries.sql` depuis les attendus du projet dans `project_final.pdf`
  - **DESIGN.md** : Ajout des champs `avatar_url` et `avatar_color` dans la description de l'entité Users
  - **DESIGN.md** : Correction des fréquences (ajout de 'daily', 'weekly', 'biweekly')
  - **schema.sql** : Conforme ✓
  - **queries.sql** : Conforme ✓
  - **README.md** : Conforme ✓

---

## 4. Traduire les noms de catégories en français ✅

**Fichiers concernés** : `backend/schema.sql`, `backend/seed.sql`

- [x] Renommer "Freelance" → "Travail indépendant" ou "Missions"
- [x] Renommer "Shopping" → "Achats"
- [x] Vérifier qu'il n'y a pas d'autres termes anglais visibles par l'utilisateur
  - Nom de compte "Cash" → "Espèces" dans seed.sql
  - Types de comptes, fréquences et autres ENUMs sont traduits dans le frontend

---

## 5. Refondre le système de catégories à la création d'utilisateur ✅

**Objectif** : À la création d'un compte, copier les catégories par défaut en tant que catégories personnelles de l'utilisateur, avec une arborescence prédéfinie.

### 5.1 Modifications du schéma (`backend/schema.sql`) ✅

- [x] Supprimer l'insertion globale des catégories par défaut (plus de `cat_usr_id = NULL`)
- [x] Les catégories seront créées par utilisateur à l'inscription

### 5.2 Créer un trigger ou une procédure stockée ✅

- [x] Créer une procédure `create_default_categories_for_user(user_id)` qui :
  - Crée les catégories parentes (Alimentation, Transport, Logement, etc.)
  - Crée les sous-catégories sous chaque parent :
    - **Alimentation** : Courses, Restaurants, Fast-food, Livraison
    - **Transport** : Carburant, Transports en commun, Taxi/VTC, Entretien véhicule
    - **Logement** : Loyer, Charges, Assurance habitation, Travaux
    - **Santé** : Médecin, Pharmacie, Mutuelle
    - **Loisirs** : Sorties, Sport, Jeux vidéo, Culture
    - **Achats** : Vêtements, High-tech, Mobilier
    - **Abonnements** : Streaming, Téléphone, Internet
    - **Éducation** : Formations, Livres, Fournitures
    - **Cadeaux** : (pas de sous-catégories)
    - **Voyages** : Hébergement, Billets, Activités
    - **Autres dépenses** : (pas de sous-catégories)
  - Crée les catégories de revenus :
    - **Salaire** : (pas de sous-catégories)
    - **Travail indépendant** : Missions, Consulting
    - **Investissements** : Dividendes, Plus-values
    - **Remboursements** : (pas de sous-catégories)
    - **Cadeaux reçus** : (pas de sous-catégories)
    - **Autres revenus** : (pas de sous-catégories)

### 5.3 Modifier le backend (`backend/app/routes/auth.py`) ✅

- [x] Appeler la procédure `create_default_categories_for_user` après la création de l'utilisateur
- [x] Ou intégrer la logique directement dans la route `/register`
  - Fonction `create_default_categories_for_user()` ajoutée et appelée dans `/register`
  - Crée 17 catégories parentes + 35 sous-catégories pour chaque nouvel utilisateur

### 5.4 Adapter les routes catégories (`backend/app/routes/categories.py`) ✅

- [x] Supprimer la notion de `cat_is_default` (toutes les catégories appartiennent à un utilisateur)
- [x] Permettre la modification de toutes les catégories (nom, icône, couleur, parent)
- [x] Ajouter une route pour "réinitialiser les catégories par défaut"
  - Route `POST /categories/reset?user_id=` ajoutée

### 5.5 Mettre à jour le seed.sql ✅

- [x] Adapter le seed pour utiliser la nouvelle logique (appeler la procédure pour l'utilisateur test)
  - Appel de `CALL create_default_categories_for_user(@user_id)` après création de l'utilisateur
  - Récupération des IDs des catégories créées par la procédure
  - Conservation des catégories personnalisées supplémentaires (Discord, Spotify, Netflix, etc.)

---

## 6. Nouvelle page : Avances en attente de remboursement

**Objectif** : Suivre les avances faites pour quelqu'un d'autre (collègues, amis, famille) et attendre leur remboursement.

### 6.1 Création de la table (`backend/schema.sql`) ✅

- [x] Créer la table `mm_advances` avec index sur `adv_usr_id`, `adv_status`, `adv_person`, `adv_date`

### 6.2 Backend - Modèle (`backend/app/models/advance.py`) ✅

- [x] Créer `AdvanceCreate` : user_id, acc_id, amount, description, person, date, due_date
- [x] Créer `AdvanceUpdate` : description, person, due_date, status, amount_received
- [x] Créer `AdvancePayment` : amount (pour enregistrer un remboursement partiel)

### 6.3 Backend - Routes (`backend/app/routes/advances.py`) ✅

- [x] `GET /advances?user_id=` : Liste des avances (filtrable par status et person)
- [x] `POST /advances` : Créer une avance
- [x] `GET /advances/{id}` : Récupérer une avance
- [x] `PUT /advances/{id}` : Modifier une avance
- [x] `POST /advances/{id}/payment` : Enregistrer un remboursement (partiel ou total)
- [x] `DELETE /advances/{id}` : Supprimer une avance
- [x] `GET /advances/summary?user_id=` : Total des avances en attente par personne

### 6.4 Frontend - Page Avances (`frontend/src/pages/Avances.jsx`) ✅

- [x] Liste des avances avec filtres (En attente / Partiellement remboursé / Remboursé)
- [x] Carte par avance avec : personne, montant, date, progression du remboursement
- [x] Modal de création d'avance
- [x] Modal d'enregistrement de remboursement
- [x] Résumé : total à recevoir, par personne

### 6.5 Frontend - Intégration ✅

- [x] Ajouter la route `/avances` dans `App.jsx`
- [x] Ajouter l'entrée dans la navigation (Sidebar)
- [x] Widget sur le Dashboard montrant le total à recevoir

### 6.6 Seed de test (`backend/seed.sql`) ✅

- [x] Ajouter quelques avances de test pour l'utilisateur test
  - 3 avances en attente (Pierre, Marie, Thomas)
  - 2 avances partiellement remboursées (Sophie, Lucas)
  - 3 avances remboursées (Pierre, Marie, Thomas)

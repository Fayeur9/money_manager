# Money Manager - Gestion de Finances Personnelles

Application web de gestion des finances personnelles permettant de suivre ses comptes bancaires, transactions, dépenses récurrentes et budgets.

**Auteur** : Baptiste FREMINET
**Date** : Février 2026
**Cours** : SQL - LiveCampus

## Fichiers du projet

Ce projet est composé des trois fichiers requis pour le projet final :

| Fichier | Description |
|---------|-------------|
| [DESIGN.md](DESIGN.md) | Document de conception décrivant l'objectif, l'étendue, les entités, les relations, les optimisations et les limitations de la base de données |
| [backend/schema.sql](backend/schema.sql) | Instructions `CREATE TABLE`, `CREATE INDEX`, etc. annotées définissant le schéma de la base de données |
| [backend/queries.sql](backend/queries.sql) | Requêtes `SELECT`, `INSERT`, `UPDATE`, `DELETE` typiquement exécutées sur la base de données |

## Prérequis

- **Node.js** >= 18
- **Python** >= 3.10
- **MySQL** >= 8.0

## Installation rapide

```bash
# 1. Cloner le repository
git clone <url-du-repo>
cd money_manager

# 2. Installer toutes les dépendances
npm install

# 3. Configurer la base de données
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos credentials MySQL

# 4. Initialiser la BDD avec les données de test
npm run db:setup

# 5. Lancer l'application
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## Compte de test

Après `npm run db:setup`, un compte de test est disponible :

- **Email** : `test`
- **Mot de passe** : `test`

Les données incluent une année complète (2025) avec des transactions réalistes.

## Commandes disponibles

### Développement

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance l'API + le frontend en parallèle |
| `npm run api` | Lance uniquement l'API (port 8000) |
| `npm run front` | Lance uniquement le frontend (port 5173) |

### Base de données

| Commande | Description |
|----------|-------------|
| `npm run db:setup` | Crée la BDD + tables + données de test |
| `npm run db:reset` | Remet un jeu de données propre |
| `npm run db:purge` | Vide toutes les tables |
| `npm run db:drop` | Supprime complètement la BDD |

## Structure du projet

```
money_manager/
├── DESIGN.md                    # Document de conception (BDD + Architecture)
├── README.md                    # Ce fichier
│
├── backend/                     # API FastAPI (Python)
│   ├── schema.sql               # Schéma de la BDD (CREATE TABLE, INDEX, etc.)
│   ├── queries.sql              # Requêtes SQL typiques
│   ├── seed.sql                 # Données de test
│   ├── triggers.sql             # Triggers MySQL
│   ├── app/
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── database.py          # Connexion MySQL
│   │   ├── models/              # Modèles Pydantic (8 fichiers)
│   │   └── routes/              # Routes API (9 endpoints)
│   └── .env.example             # Template des variables d'environnement
│
├── frontend/                    # Application React + Vite + Tailwind
│   └── src/
│       ├── api/                 # Client API centralisé
│       │   └── index.js
│       ├── components/
│       │   ├── ui/              # 20 composants UI réutilisables
│       │   │   ├── AccountCard/
│       │   │   ├── ActionButton/
│       │   │   ├── AmountDisplay/
│       │   │   ├── BudgetCard/
│       │   │   ├── BudgetProgressBar/
│       │   │   ├── CategoryBadge/
│       │   │   ├── ChartCard/
│       │   │   ├── ColorPicker/
│       │   │   ├── ConfirmModal/
│       │   │   ├── CurrencyInput/
│       │   │   ├── DatePicker/
│       │   │   ├── EmptyState/
│       │   │   ├── FormInput/
│       │   │   ├── FormModal/
│       │   │   ├── Modal/
│       │   │   ├── ProgressBar/
│       │   │   ├── RecurringCard/
│       │   │   ├── SearchInput/
│       │   │   ├── TransactionRow/
│       │   │   ├── TypeSelector/
│       │   │   └── index.js     # Barrel export
│       │   ├── forms/           # 5 formulaires CRUD
│       │   │   ├── AccountForm.jsx
│       │   │   ├── BudgetForm.jsx
│       │   │   ├── CategoryForm.jsx
│       │   │   ├── RecurringForm.jsx
│       │   │   └── TransactionForm.jsx
│       │   ├── budgets/         # Composants page Budgets
│       │   │   ├── BudgetsSidebar.jsx
│       │   │   ├── BudgetsContent.jsx
│       │   │   └── BudgetsModals.jsx
│       │   └── layout/          # Composants de mise en page
│       │       └── PageHeader.jsx
│       ├── hooks/               # Hooks personnalisés
│       │   └── useModalState.js
│       ├── utils/               # Utilitaires centralisés
│       │   ├── formatters.js    # formatCurrency, formatDate
│       │   ├── constants.js     # Enums, labels, constantes
│       │   └── *.test.js        # Tests unitaires (Vitest)
│       └── pages/               # 8 pages de l'application
│
└── scripts/                     # Scripts utilitaires
    └── db.js                    # Gestion de la BDD (init, seed, reset, etc.)
```

## Technologies

| Couche | Technologies |
|--------|--------------|
| Base de données | MySQL 8.0 |
| Backend | FastAPI, PyMySQL, Pydantic |
| Frontend | React 19, Vite, Tailwind CSS, MUI, React Select |
| Tests | Vitest |

## Architecture Frontend

L'application suit une architecture modulaire avec séparation des responsabilités :

### Composants UI (`components/ui/`)

20 composants réutilisables avec PropTypes :

| Composant | Description |
|-----------|-------------|
| `AccountCard` | Carte affichant un compte avec solde et actions |
| `ActionButton` | Bouton icône avec variantes (default, danger, success, warning, ghost) |
| `AmountDisplay` | Montant formaté avec couleur selon type (+/-) |
| `BudgetCard` | Item de la sidebar budgets avec progression |
| `BudgetProgressBar` | Barre de progression avec pourcentage et alertes |
| `CategoryBadge` | Icône + nom + couleur de catégorie |
| `ChartCard` | Conteneur pour graphiques avec titre |
| `ColorPicker` | Sélecteur de couleur avec palette prédéfinie |
| `ConfirmModal` | Modal de confirmation pour actions destructives |
| `CurrencyInput` | Input montant avec symbole € |
| `DatePicker` | Input date stylisé |
| `EmptyState` | Message "Aucun élément" avec icône |
| `FormInput` | Input de formulaire standardisé |
| `FormModal` | Wrapper Modal + Form |
| `Modal` | Modal générique |
| `ProgressBar` | Barre de progression simple |
| `RecurringCard` | Carte transaction récurrente |
| `SearchInput` | Input recherche avec icône |
| `TransactionRow` | Ligne de transaction |
| `TypeSelector` | Sélecteur de type (dépense/revenu) |

### Formulaires (`components/forms/`)

5 formulaires CRUD complets avec validation :

- `TransactionForm` - Création/édition de transactions
- `BudgetForm` - Gestion des budgets avec hiérarchie
- `AccountForm` - Création/édition de comptes
- `CategoryForm` - Gestion des catégories hiérarchiques
- `RecurringForm` - Transactions récurrentes avec fréquences

### Hooks personnalisés (`hooks/`)

- `useModalState` - Gestion état modal `{ isOpen, data, open(), close() }`

### Utilitaires (`utils/`)

- `formatters.js` - Fonctions `formatCurrency()`, `formatDate()`
- `constants.js` - Enums et constantes centralisées (TRANSACTION_TYPES, ACCOUNT_TYPES, FREQUENCIES, labels...)

### Optimisations

- **useMemo** pour les calculs coûteux (hiérarchies, filtres, tris)
- **useCallback** pour les handlers évitant les re-renders
- **Barrel exports** pour des imports simplifiés

## Tests

```bash
# Lancer les tests unitaires
cd frontend && npm test

# Avec couverture
cd frontend && npm run test:coverage
```

24 tests unitaires couvrent les utilitaires (`formatters.js`, `constants.js`).

## Licence

Projet académique - LiveCampus 2026

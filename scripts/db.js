const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Charge les variables d'environnement depuis backend/.env
const envPath = path.join(__dirname, "..", "backend", ".env");
const envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      envConfig[key.trim()] = valueParts.join("=").trim();
    }
  });
}

const DB_HOST = envConfig.DB_HOST || "localhost";
const DB_PORT = envConfig.DB_PORT || "3306";
const DB_USER = envConfig.DB_USER || "root";
const DB_PASSWORD = envConfig.DB_PASSWORD || "";
const DB_NAME = envConfig.DB_NAME || "gestion_compte";

const backendDir = path.join(__dirname, "..", "backend");

// Construit la commande MySQL avec les credentials
function mysqlCmd(database = "") {
  const dbArg = database ? ` ${database}` : "";
  const passArg = DB_PASSWORD ? ` -p${DB_PASSWORD}` : "";
  return `mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}${passArg}${dbArg}`;
}

// Commandes disponibles
const commands = {
  // Initialise la BDD (crée les tables + triggers)
  init: () => {
    console.log("Initialisation de la base de données...");
    try {
      // 1. Crée les tables (schema.sql)
      execSync(`${mysqlCmd()} < "${path.join(backendDir, "schema.sql")}"`, {
        stdio: "inherit",
      });

      // 2. Crée les triggers (triggers.sql avec délimiteur //)
      console.log("Création des triggers...");
      execSync(`${mysqlCmd(DB_NAME)} --delimiter="//" < "${path.join(backendDir, "triggers.sql")}"`, {
        stdio: "inherit",
      });

      console.log("Base de données initialisée avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'initialisation.");
      process.exit(1);
    }
  },

  // Insère les données de test
  seed: () => {
    console.log("Insertion des données de test...");
    try {
      execSync(`${mysqlCmd(DB_NAME)} < "${path.join(backendDir, "seed.sql")}"`, {
        stdio: "inherit",
      });
      console.log("Données de test insérées avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'insertion des données.");
      console.error("Vérifiez que la table users est vide (utilisez db:reset pour purger).");
      process.exit(1);
    }
  },

  // Initialise + seed
  setup: () => {
    commands.init();
    commands.seed();
  },

  // Purge toutes les données (garde la structure)
  purge: () => {
    console.log("Purge des données...");
    const purgeSQL = `
      SET FOREIGN_KEY_CHECKS = 0;
      TRUNCATE TABLE mm_advances;
      TRUNCATE TABLE mm_transactions;
      TRUNCATE TABLE mm_recurring;
      TRUNCATE TABLE mm_budgets;
      TRUNCATE TABLE mm_accounts;
      TRUNCATE TABLE mm_categories;
      TRUNCATE TABLE mm_users;
      SET FOREIGN_KEY_CHECKS = 1;
    `;
    try {
      execSync(`${mysqlCmd(DB_NAME)} -e "${purgeSQL}"`, { stdio: "inherit" });
      console.log("Données purgées avec succès.");
    } catch (error) {
      console.error("Erreur lors de la purge.");
      process.exit(1);
    }
  },

  // Purge + seed (remet un jeu de données propre)
  reset: () => {
    commands.purge();
    commands.seed();
  },

  // Supprime complètement la BDD
  drop: () => {
    console.log("Suppression de la base de données...");
    try {
      execSync(`${mysqlCmd()} -e "DROP DATABASE IF EXISTS ${DB_NAME};"`, {
        stdio: "inherit",
      });
      console.log("Base de données supprimée.");
    } catch (error) {
      console.error("Erreur lors de la suppression.");
      process.exit(1);
    }
  },

  // Supprime uniquement les données de test (utilisateur test@test)
  "clean-test": () => {
    console.log("Suppression des données de test...");
    const cleanSQL = `DELETE FROM mm_users WHERE usr_email = 'test';`;
    try {
      execSync(`${mysqlCmd(DB_NAME)} -e "${cleanSQL}"`, { stdio: "inherit" });
      console.log("Données de test supprimées (utilisateur test@test et toutes ses données associées).");
    } catch (error) {
      console.error("Erreur lors de la suppression des données de test.");
      process.exit(1);
    }
  },

  // Supprime les données de test puis les réinsère
  "reset-test": () => {
    commands["clean-test"]();
    commands.seed();
  },
};

// Exécution
const action = process.argv[2];

if (!action || !commands[action]) {
  console.log("Usage: node scripts/db.js <command>");
  console.log("");
  console.log("Commandes disponibles:");
  console.log("  init       - Crée la BDD et les tables (schema.sql)");
  console.log("  seed       - Insère les données de test (seed.sql)");
  console.log("  setup      - init + seed");
  console.log("  purge      - Vide toutes les tables (garde la structure)");
  console.log("  reset      - purge + seed (jeu de données propre)");
  console.log("  drop       - Supprime complètement la BDD");
  console.log("  clean-test - Supprime uniquement l'utilisateur de test");
  console.log("  reset-test - clean-test + seed (recrée les données de test)");
  process.exit(1);
}

commands[action]();

Voici un **cahier des charges complet** pour ton projet de **Gestion d’employés et de saisie d’heures** (université, 6 départements), avec technologies : **Vue 3 (Front)** + **Node.js/Express (Back)** + **MongoDB (BDD)**.

---

# 🧾 **Cahier des charges technique et fonctionnel**

## 1. 📘 Contexte du projet

L’université souhaite disposer d’une application web de **gestion d’employés et de saisie d’heures**.
L’objectif est de simplifier :

* la **gestion du personnel** (RH/ADMIN, formateurs,formateurs_pricipaux, étudiants) ;
* la **saisie et le suivi des heures de cours** ;
* l’**affectation des étudiants** aux cours et départements.

Le projet doit être accessible en ligne via un navigateur et compatible sur ordinateur, tablette et mobile.

---

## 2. 🎯 Objectifs du projet

* Permettre à la **Direction / RH** de gérer les utilisateurs et les départements.
* Permettre aux **formateurs principaux** de gérer les cours et les étudiants de leur département.
* Permettre aux **formateurs** de saisir les heures pour leurs cours.
* Permettre aux **étudiants** de consulter leurs cours et leurs heures.
* Garantir un **contrôle des accès** selon les rôles (Administrateur, RH, Formateur Principal, Formateur, Étudiant).

---

## 3. 👥 Utilisateurs et rôles

| Rôle                    | Description                        | Permissions principales                                                                    |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| **Administrateur**      | Gère toute la plateforme           | CRUD utilisateurs, CRUD départements, gestion des rôles, affectation formateurs principaux |
| **RH**                  | Gère les employés et rôles         | CRUD utilisateurs, changement de rôle, affectations                                        |
| **Formateur Principal** | Responsable d’un département       | Gère les cours, étudiants, affectations et désactivations                                  |
| **Formateur**           | Enseigne un ou plusieurs cours     | Saisie des heures pour ses cours                                                           |
| **Étudiant**            | Suit des cours dans un département | Consulte ses cours et heures                                                               |

---

## 4. 🧩 Fonctionnalités principales

### 4.1. Authentification et Sécurité

* Inscription / Connexion / Déconnexion (JWT)
* Gestion des rôles et des permissions
* Réinitialisation du mot de passe
* Middleware d’autorisation (backend)

### 4.2. Gestion des Utilisateurs (RH / Admin)

* Ajouter, modifier, supprimer un utilisateur
* Affecter un rôle (étudiant, formateur, formateur principal)
* Affecter un formateur principal à un département
* Désactiver / réactiver un utilisateur

### 4.3. Gestion des Départements (Admin)

* Créer, modifier, supprimer un département
* Lister les départements
* Associer un formateur principal à un département

### 4.4. Gestion des Cours (Formateur principal)

* Créer, modifier, supprimer un cours
* Affecter un formateur à un cours
* Affecter ou désaffecter un étudiant à un cours

### 4.5. Saisie des Heures (Formateur / Formateur principal)

* Saisir le nombre d’heures effectuées pour un cours donné
* Consulter son historique de saisies
* Modification ou suppression de saisies récentes

### 4.6. Gestion des Étudiants (Formateur principal)

* Lister les étudiants du département
* Désactiver un étudiant (en cas de renvoi)
* Affecter / désaffecter un étudiant à un cours

### 4.7. Consultation des Heures (Étudiant)

* Consulter ses cours affectés
* Voir les heures de cours enregistrées
* Téléchargement en PDF (optionnel)

---

## 5. 🗂️ Modélisation des données (MongoDB)

### 5.1. **Modèle User**

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  role: String, // 'admin', 'rh', 'formateur_principal', 'formateur', 'etudiant'
  department: ObjectId, // Référence vers Department
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2. **Modèle Department**

```js
{
  _id: ObjectId,
  name: String, // Ex: "Informatique", "Mathématiques"
  description: String,
  mainTeacher: ObjectId, // User (formateur principal)
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3. **Modèle Course**

```js
{
  _id: ObjectId,
  title: String,
  code: String,
  description: String,
  department: ObjectId, // Department
  teacher: ObjectId, // User (formateur)
  students: [ObjectId], // Liste d’étudiants
  createdAt: Date,
  updatedAt: Date
}
```

### 5.4. **Modèle HourEntry**

```js
{
  _id: ObjectId,
  course: ObjectId,
  teacher: ObjectId,
  date: Date,
  hours: Number, // ex : 2.5
  description: String, // optionnel
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. ⚙️ Architecture technique

### Frontend : **Vue 3 (Composition API) + Vue Router + TailwindCSS**

* Composants réutilisables (Form, Table, Modal)
* Vue Router avec guards pour les rôles
* Store global pour la gestion de l’utilisateur connecté
* Axios pour les appels API 

### Backend : **Node.js + Express + Mongoose**

* Routes sécurisées par middleware JWT
* Routes groupées par ressource : `/auth`, `/users`, `/departments`, `/courses`, `/hours`
* Gestion d’erreurs centralisée
* Validation des données avec Joi

### Base de données : **MongoDB + Mongoose**

* Relations via références (`ObjectId`)
* Indexation sur les champs utilisés en recherche (email, department, course)

---

## 7. 🧱 Structure des routes (exemples backend)

| Ressource  | Méthode | Route                   | Rôle requis              |
| ---------- | ------- | ----------------------- | ------------------------ |
| Auth       | POST    | `/auth/login`           | Public                   |
| Auth       | POST    | `/auth/register`        | RH / Admin               |
| User       | GET     | `/users`                | RH / Admin               |
| User       | PATCH   | `/users/:id/role`       | RH / Admin               |
| Department | GET     | `/departments`          | Tous                     |
| Department | POST    | `/departments`          | Admin                    |
| Course     | POST    | `/courses`              | Formateur principal      |
| Course     | PATCH   | `/courses/:id/students` | Formateur principal      |
| Hours      | POST    | `/hours`                | Formateur / Principal    |
| Hours      | GET     | `/hours/me`             | Tous (filtré selon rôle) |

---

## 8. 🎨 Design & UX

* Thème épuré (fond clair, accent bleu université)
* Dashboard par rôle :

  * RH/Admin : tableau de bord global + statistiques
  * Formateur principal : gestion des cours et étudiants
  * Formateur : saisie rapide des heures
  * Étudiant : vue simplifiée des cours et heures
* Notifications (Toast) pour actions réussies / erreurs (vue-toastification)

---





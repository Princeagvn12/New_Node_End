# Documentation API - Guide de Test

## Configuration de Base
```
BASE_URL: http://localhost:4000/api
```

## 🔑 Authentification

### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "admin@uni.com",
    "password": "password123"
}

// Autres identifiants de test
{
    "email": "rh@uni.com",
    "password": "password123"
}
{
    "email": "principal.info@uni.com",
    "password": "password123"
}
{
    "email": "prof.java@uni.com",
    "password": "password123"
}
{
    "email": "etudiant1@uni.com",
    "password": "password123"
}
```

### 2. Vérifier Utilisateur Connecté
```http
GET /auth/me
Cookie: accessToken=<token>
```

### 3. Déconnexion
```http
POST /auth/logout
Cookie: accessToken=<token>
```

## 👥 Gestion des Utilisateurs

### 1. Lister tous les utilisateurs (Admin/RH)
```http
GET /users
Cookie: accessToken=<token>
```

### 2. Créer un utilisateur (Admin/RH)
```http
POST /users
Cookie: accessToken=<token>
Content-Type: application/json

{
    "name": "Nouveau Utilisateur",
    "email": "nouveau@uni.com",
    "password": "password123",
    "role": "formateur", // Options: admin, rh, formateur_principal, formateur, etudiant
    "department": "ID_DEPARTEMENT"
}
```

### 3. Modifier un utilisateur (Admin/RH)
```http
PATCH /users/:id
Cookie: accessToken=<token>
Content-Type: application/json

{
    "name": "Nom Modifié",
    "email": "modifie@uni.com",
    "role": "formateur",
    "department": "ID_DEPARTEMENT"
}
```

### 4. Activer/Désactiver un utilisateur (Admin/RH)
```http
PATCH /users/:id/activate
Cookie: accessToken=<token>
Content-Type: application/json

{
    "isActive": false
}
```

## 🏢 Gestion des Départements

### 1. Lister les départements
```http
GET /departments
Cookie: accessToken=<token>
```

### 2. Créer un département (Admin)
```http
POST /departments
Cookie: accessToken=<token>
Content-Type: application/json

{
    "name": "Nouveau Département",
    "description": "Description du département",
    "mainTeacher": "ID_FORMATEUR_PRINCIPAL"
}
```

### 3. Modifier un département (Admin)
```http
PATCH /departments/:id
Cookie: accessToken=<token>
Content-Type: application/json

{
    "name": "Département Modifié",
    "description": "Nouvelle description",
    "mainTeacher": "ID_NOUVEAU_FORMATEUR_PRINCIPAL"
}
```

## 📚 Gestion des Cours

### 1. Lister les cours
```http
GET /courses
Cookie: accessToken=<token>
// Note: Les résultats sont filtrés selon le rôle de l'utilisateur
```

### 2. Créer un cours (Formateur Principal)
```http
POST /courses
Cookie: accessToken=<token>
Content-Type: application/json

{
    "title": "Nouveau Cours",
    "code": "COURS101",
    "description": "Description du cours",
    "teacher": "ID_FORMATEUR"
}
```

### 3. Gérer les étudiants d'un cours (Formateur Principal)
```http
PATCH /courses/:id/students
Cookie: accessToken=<token>
Content-Type: application/json

{
    "action": "add", // ou "remove"
    "studentIds": ["ID_ETUDIANT1", "ID_ETUDIANT2"]
}
```

## ⏰ Gestion des Heures

### 1. Consulter ses heures
```http
GET /hours/me
Cookie: accessToken=<token>
// Note: Retourne les heures selon le rôle (formateur: ses cours, étudiant: ses cours suivis)
```

### 2. Enregistrer des heures (Formateur)
```http
POST /hours
Cookie: accessToken=<token>
Content-Type: application/json

{
    "course": "ID_COURS",
    "date": "2025-10-25",
    "hours": 3,
    "description": "Description de la séance"
}
```

### 3. Modifier une entrée d'heures (dans les 24h)
```http
PATCH /hours/:id
Cookie: accessToken=<token>
Content-Type: application/json

{
    "hours": 4,
    "description": "Description modifiée"
}
```

## 🧪 Scénarios de Test

### 1. Workflow Administrateur
1. Login admin
2. Créer un département
3. Créer un formateur principal
4. Assigner le formateur principal au département
5. Vérifier la liste des départements

### 2. Workflow Formateur Principal
1. Login formateur principal
2. Créer un cours
3. Assigner un formateur
4. Ajouter des étudiants au cours
5. Vérifier la liste des cours

### 3. Workflow Formateur
1. Login formateur
2. Consulter ses cours
3. Enregistrer des heures
4. Consulter son historique d'heures

### 4. Workflow Étudiant
1. Login étudiant
2. Consulter ses cours
3. Consulter ses heures de cours

## 🎯 Tests de Validation

### Validation Authentification
- Tester login avec mauvais mot de passe
- Tester accès route protégée sans token
- Tester refresh token
- Vérifier expiration access token

### Validation Permissions
- Tester création département avec compte non-admin
- Tester modification cours par mauvais formateur principal
- Tester saisie heures pour cours non assigné

### Validation Données
- Tester création utilisateur avec email existant
- Tester création cours avec code existant
- Tester saisie heures négatives

## 🔍 Informations Utiles

### IDs de Test (après seed)
```javascript
// Ces IDs seront disponibles dans la console après le seed
Départements:
- Informatique: <ID> (premier département)

Utilisateurs:
- Admin: <ID>
- RH: <ID>
- Formateur Principal Info: <ID>
- Formateur Java: <ID>
- Étudiant 1: <ID>
```

### Headers Requis
```http
Content-Type: application/json
Cookie: accessToken=<token>
```
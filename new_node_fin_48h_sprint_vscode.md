# Sprint 48h — Guide machine‑readable pour avancer vite dans VSCode
But: ce document est destiné à être lu et exécuté par une IA (ou par toi dans VSCode). Il contient les priorités, la checklist horaire et des instructions claires et atomiques que l'IA peut transformer en fichiers/squelettes. Toutes les actions critiques (auth via cookies, accès CORS credentials, seed DB, endpoints essentiels) sont explicitées.

Important — contrainte d'implémentation
- Authentification via cookies HttpOnly (ACCESS + REFRESH). Aucun token dans localStorage/sessionStorage.
- Axios côté client doit utiliser withCredentials: true.
- CORS côté serveur doit autoriser credentials et l'origine du frontend.
- En dev : Secure=false si localhost; en prod Secure=true.

Résumé livré en 48h (MVP)
- Backend minimal fonctionnel : auth (login/refresh/logout/me), users (list/create/patch activate), departments (list/create), courses (create/list), hours (create/list for teacher).
- Frontend minimal : Login, Dashboard unique, UsersView, DepartmentsView, CoursesView, HoursView, axios + store + guards.
- Seed DB : 6 départements + 1 admin + 1 rh + 1 formateur_principal + 1 formateur + 1 étudiant.

Quick start — commandes rapides
- Backend initial
  - npm init -y
  - npm i express mongoose dotenv jsonwebtoken bcrypt cookie-parser joi cors helmet morgan
  - npm i -D nodemon
  - dev : NODE_ENV=development nodemon src/server.js
- Frontend initial (Vite)
  - npm init vite@latest frontend -- --template vue
  - cd frontend && npm i pinia vue-router axios tailwindcss
  - dev : npm run dev

Fichiers .env minimum (mettre dans backend/.env et frontend/.env)
- backend/.env
  - MONGO_URI=
  - PORT=4000
  - JWT_ACCESS_TOKEN_SECRET=
  - JWT_REFRESH_TOKEN_SECRET=
  - ACCESS_TOKEN_TTL=15m
  - REFRESH_TOKEN_TTL=7d
  - COOKIE_SECURE=false  # true en prod
  - CLIENT_ORIGIN=http://localhost:5173
- frontend/.env (Vite)
  - VITE_API_URL=http://localhost:4000/api

Plan d'action horaire (ordre strict pour 48h)
Jour 1 — Matin (0–4h)
1. Créer arborescence minimale backend + init package.json.
2. Créer server.js, app.js et config/db.js.
3. Créer modèles Mongoose : User, Department, Course, HourEntry.
4. Créer scripts/seed.js pour peupler la DB rapidement.

Jour 1 — Après‑midi (4–10h)
1. Implémenter auth minimal (controllers + routes) :
   - POST /api/auth/login => Set-Cookie accessToken & refreshToken, retourne profil user
   - POST /api/auth/refresh => lit refreshToken cookie, renvoie nouveau accessToken cookie
   - POST /api/auth/logout => clear cookies
   - GET /api/auth/me => retourne profil si accessToken valide
2. Créer middlewares :
   - auth.middleware.js (lit accessToken depuis cookie, attache req.user)
   - role.middleware.js allow([...])
   - error.middleware.js (gestion simple)
3. Créer controllers/routes basiques pour users, departments, courses, hours (endpoints listés ci‑dessous).
4. Lancer seed et tester login via Postman (vérifier Set-Cookie).

Jour 2 — Matin (0–5h)
1. Init frontend Vite, installer Pinia/vue-router/axios.
2. Créer axios instance withCredentials true et interceptor 401->/auth/refresh.
3. Créer store utilisateur (profil uniquement).
4. Créer Login.vue, Dashboard.vue, UsersView.vue, DepartmentsView.vue, CoursesView.vue, HoursView.vue.
5. Router minimal et guards pour vérifier /auth/me si store vide.

Jour 2 — Après‑midi (5–11h)
1. Intégrer appels API depuis frontend (login, /departments, /courses, /hours/me, /users).
2. Tester scénarios utilisateur : admin crée department/user ; formateur crée hour ; student consulte.
3. Stabiliser, corriger CORS/cookies, préparer README et Postman collection.

Endpoints essentiels (baseURL = /api)
- Auth
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET /auth/me
- Users
  - GET /users
  - GET /users/:id
  - POST /users
  - PATCH /users/:id/activate
- Departments
  - GET /departments
  - POST /departments
- Courses
  - GET /courses
  - POST /courses
  - PATCH /courses/:id/students (add/remove)
- Hours
  - POST /hours
  - GET /hours/me

Arborescence minimale à créer (copier-coller)
- new_node_fin/
  - backend/
    - package.json
    - .env.example
    - src/
      - server.js
      - app.js
      - config/
        - db.js
        - jwt.js
      - models/
        - User.js
        - Department.js
        - Course.js
        - HourEntry.js
      - controllers/
        - auth.controller.js
        - user.controller.js
        - department.controller.js
        - course.controller.js
        - hour.controller.js
      - routes/
        - index.js
        - auth.routes.js
        - users.routes.js
        - departments.routes.js
        - courses.routes.js
        - hours.routes.js
      - middlewares/
        - auth.middleware.js
        - role.middleware.js
        - error.middleware.js
      - scripts/
        - seed.js
      - utils/
        - response.js
  - frontend/
    - package.json
    - .env.example
    - src/
      - main.js
      - App.vue
      - router/
        - index.js
        - guards.js
      - store/
        - index.js
        - user.store.js
      - services/
        - api.js
        - auth.service.js
        - user.service.js
        - department.service.js
        - course.service.js
        - hour.service.js
      - views/
        - Login.vue
        - Dashboard.vue
        - UsersView.vue
        - DepartmentsView.vue
        - CoursesView.vue
        - HoursView.vue
      - components/
        - common/
          - Navbar.vue
          - Table.vue
          - FormField.vue
      - composables/
        - useAuth.js

Pour chaque fichier critique — instruction précise (prête à être convertie en génération de fichier)
- backend/src/server.js
  - Rôle : démarre le serveur, importe app.js, lit PORT.
  - TODO pour IA : créer express server qui écoute sur process.env.PORT et appelle connectDB() avant de démarrer.
- backend/src/app.js
  - Rôle : configure middlewares globaux : express.json, cookie-parser, helmet, cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }), routes, error middleware.
  - TODO pour IA : monter /api/* routes depuis routes/index.js.
- backend/src/config/db.js
  - Rôle : connecte mongoose à MONGO_URI et exporte la fonction connectDB().
- backend/src/config/jwt.js
  - Rôle : exporte secrets et TTL depuis process.env.
- backend/src/models/User.js
  - Rôle : schéma Mongoose minimal : name, email (unique), password, role enum, department ObjectId ref, isActive true/false, timestamps.
  - TODO : ajouter méthode statique comparePassword (bcrypt).
- backend/src/models/Department.js, Course.js, HourEntry.js
  - Rôles : champs décrits dans le cahier des charges (références ObjectId).
- backend/src/controllers/auth.controller.js
  - Rôle : login (check password, create access+refresh JWT), refresh, logout, me.
  - Important : accessToken cookie = short TTL ; refreshToken cookie = long TTL.
  - TODO : Set-Cookie options : httpOnly true, secure = process.env.COOKIE_SECURE === 'true', sameSite = 'lax', maxAge selon TTL (ms).
- backend/src/middlewares/auth.middleware.js
  - Rôle : lire cookie accessToken, vérifier JWT, attacher req.user (id, role).
  - Sur erreur -> return 401 JSON.
- backend/src/middlewares/role.middleware.js
  - Rôle : factory allow(rolesArray) -> middleware qui vérifie req.user.role.
- backend/src/scripts/seed.js
  - Rôle : créer 6 départements + utilisateurs (admin, rh, formateur_principal, formateur, étudiant) avec mots de passe simples (hashés).
  - NOTE : afficher les identifiants en console pour tests.

Frontend — instructions de génération minimale
- frontend/src/services/api.js
  - Créer instance axios avec baseURL=import.meta.env.VITE_API_URL et defaults.withCredentials=true.
  - Response interceptor : si status 401 -> appeler /api/auth/refresh (avecCredentials) ; si success -> rejouer requête initiale ; si échec -> router.push('/login').
- frontend/src/store/user.store.js
  - Pinia store : state { user:null, isAuthenticated:false }, actions setUser, clearUser.
- frontend/src/composables/useAuth.js
  - login(email,password) -> POST /api/auth/login (body), server renvoie user (JSON) et Set-Cookie ; hydrater store.
  - logout() -> POST /api/auth/logout ; clear store.
  - init() -> called at app mount : call GET /api/auth/me to hydrate store if cookie valid.
- frontend/src/router/guards.js
  - Avant chaque route privée, vérifier store.user ; si null -> call /api/auth/me ; si fail -> redirect login.
- Views minimalistes
  - Login.vue : form email/password, on submit call useAuth.login
  - Dashboard.vue : unique dashboard, panels conditionnés par rôle (tu gères les v-if)
  - UsersView.vue : table GET /api/users, actions selon role (create via modal simple ou page)
  - DepartmentsView.vue : list + create (admin)
  - CoursesView.vue : list + create (formateur_principal)
  - HoursView.vue : form create hour (teacher) + list GET /api/hours/me

Curl de test pour vérifier cookies (exemples)
- Tester login (Postman ou curl)
  - curl -i -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@uni","password":"password"}' --include
  - Vérifier que response headers contiennent Set-Cookie pour accessToken et refreshToken.
- Tester appel protégé
  - curl -i http://localhost:4000/api/auth/me --cookie "accessToken=..."  (devra renvoyer profil)

Checklist prioritaire (cocher en itération)
- [ ] backend : models + seed fonctionnel
- [ ] backend : auth cookies (login/refresh/logout/me) + auth.middleware
- [ ] backend : routes GET/POST minimal pour users, departments, courses, hours
- [ ] frontend : axios withCredentials + interceptor refresh
- [ ] frontend : login flow + store + route guards
- [ ] end-to-end tests manuels via Postman (login -> create course -> create hour)

Prompts prêts à coller pour l'IA dans VSCode (exemples)
- "Génère le fichier backend/src/server.js : express server qui importe app.js, lit PORT depuis process.env, lance connectDB() et écoute; ajoute log console 'Server running on PORT'."
- "Génère le fichier backend/src/app.js : configure express.json(), cookie-parser(), helmet(), cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }), importe routes/index.js et error.middleware."
- "Génère le modèle Mongoose backend/src/models/User.js avec fields name,email,password,role enum,department ref, isActive, timestamps; ajoute méthode comparePassword bcrypt."
- "Génère frontend/src/services/api.js : axios instance withCredentials true, baseURL from env, interceptor 401->/api/auth/refresh and retry."

Ce que je t'ai préparé maintenant
- Un MD structuré, priorisé et prêt à être utilisé par une IA dans VSCode. Il contient la checklist horaire, l'arborescence exacte, les endpoints, et des prompts prêts à exécuter pour générer les fichiers squelettes.

Prochaine étape (action immédiate que tu peux demander à l'IA)
- Demande : "Génère tous les fichiers backend essentiels (server.js, app.js, config/db.js, config/jwt.js, models/*, controllers/auth.controller.js, routes/auth.routes.js, middlewares/auth/role/error, scripts/seed.js) avec les TODOs indiqués et un README de démarrage."  
L'IA pourra alors créer les fichiers squelettes dans VSCode et tu pourras coder les petites logiques restantes.

Si tu veux, je peux maintenant :
- 1) Générer un arborescence texte à exécuter (script bash mkdir/touch).
- 2) Générer le contenu minimal (headers + imports + TODO) de chaque fichier listé pour que tu les ouvres directement et complètes.
- Dis juste "1" ou "2" ou "les deux".
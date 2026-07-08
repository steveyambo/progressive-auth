# Progressive Auth

Application d'authentification progressive avec:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: C#, ASP.NET Core Web API, Entity Framework Core
- Database: SQLite

Etat actuel: V2. L'application permet de creer un compte, se connecter, se deconnecter, lire l'utilisateur courant et acceder a un dashboard protege. Les mots de passe sont maintenant stockes sous forme de hash.

Ce projet n'est pas seulement une app login/register. C'est une progression d'authentification: chaque version ajoute une amelioration reelle, documente pourquoi elle existe, puis est mergee dans `main` seulement quand elle est terminee et testee.

## Architecture

```txt
User
  -> Frontend Next.js
  -> Backend ASP.NET Core Web API
  -> SQLite
```

Le frontend affiche les pages et appelle l'API en JSON. Le backend valide les donnees, gere la session cookie, hash les mots de passe et lit/ecrit dans SQLite avec Entity Framework Core.

## Roadmap Progressive

Cette roadmap est la reference avant chaque nouvelle branche. Une version ne doit pas ajouter du bruit ou des details inutiles: elle doit corriger une limite concrete de la version precedente.

### V1: Basic Auth Flow

- But: creer le squelette complet `User -> Frontend -> Backend API -> Database`.
- Pourquoi: avant de renforcer la securite, il faut un flux fonctionnel complet.
- Amelioration reelle: inscription, connexion, deconnexion, page protegee, stockage utilisateur SQLite.
- System design: le frontend envoie des requetes HTTP JSON au backend, le backend stocke l'utilisateur dans `Users`.
- Fin de version: register/login/logout/dashboard fonctionnent et la V1 est mergee dans `main`.

### V2: Password Hashing

- But: ne plus stocker le mot de passe en clair.
- Pourquoi: si la base fuite, les passwords ne doivent pas etre lisibles directement.
- Amelioration reelle: `Password` devient `PasswordHash`, `Register` hash le password, `Login` verifie avec `VerifyHashedPassword`.
- System design: le password clair est temporaire pendant la requete; seul le hash persiste en database.
- Fin de version: les anciens retours API ne renvoient ni password ni hash, le login marche avec hash, la V2 est mergee dans `main`.

### V3: Sessions + Cookies

- But: rendre la session cookie explicite, controlee et plus robuste.
- Pourquoi: HTTP est stateless; le backend doit reconnaitre l'utilisateur entre plusieurs requetes sans exposer le password au frontend.
- Amelioration reelle prevue: `rememberMe`, session courte par defaut, session persistante seulement si demandee, reponses API 401/403 propres pour les appels API.
- System design: `Login -> Set-Cookie HTTP-only -> navigateur renvoie cookie -> backend reconstruit l'identite`.
- Fin de version: login avec et sans rememberMe, `/me`, dashboard et logout sont testes; le README explique le flow session/cookie; V3 est mergee dans `main`.

### V4: Authentication Middleware

- But: structurer proprement la protection automatique des routes.
- Pourquoi: on ne veut pas verifier manuellement l'utilisateur dans chaque endpoint.
- Amelioration reelle prevue: clarifier `UseAuthentication()`, `UseAuthorization()`, `[Authorize]`, centraliser la lecture de l'utilisateur courant si le code commence a se repeter.
- System design: le pipeline ASP.NET Core authentifie la requete avant d'executer les controllers proteges.
- Fin de version: les routes protegees utilisent une approche coherente et documentee; V4 est mergee dans `main`.

### V5: Roles USER / ADMIN

- But: ajouter l'autorisation par role.
- Pourquoi: etre connecte ne veut pas dire avoir tous les droits.
- Amelioration reelle prevue: role `USER` ou `ADMIN`, endpoints admin, protections par role, affichage adapte cote frontend.
- System design: authentication = qui es-tu; authorization = qu'as-tu le droit de faire.
- Fin de version: un user normal ne peut pas acceder aux routes admin, un admin peut; V5 est mergee dans `main`.

### V6: Email Verification

- But: verifier que l'utilisateur controle l'adresse email fournie.
- Pourquoi: un email non verifie ne doit pas etre considere comme fiable.
- Amelioration reelle prevue: statut `EmailVerified`, token de verification, endpoint de verification, restrictions tant que l'email n'est pas verifie.
- System design: l'identite utilisateur gagne un etat de confiance supplementaire.
- Fin de version: le compte peut etre cree, verifie, puis autorise selon son statut; V6 est mergee dans `main`.

### V7: Forgot Password

- But: permettre a l'utilisateur de recuperer son compte sans connaitre l'ancien password.
- Pourquoi: un systeme d'authentification realiste doit gerer la perte de mot de passe sans compromettre le compte.
- Amelioration reelle prevue: token temporaire, expiration, endpoint request-reset, endpoint reset-password, invalidation apres usage.
- System design: le reset password devient un flux separe avec token limite dans le temps.
- Fin de version: un password peut etre reinitialise avec un token valide et refuse avec un token invalide/expire; V7 est mergee dans `main`.

### V8: Sessions Table / Revocation

- But: ne plus dependre seulement du cookie signe; pouvoir suivre et revoquer les sessions.
- Pourquoi: un utilisateur doit pouvoir fermer une session compromise ou toutes ses sessions.
- Amelioration reelle prevue: table `Sessions`, `SessionId` dans les claims, expiration cote DB, revocation au logout.
- System design: `Cookie Session Id -> Sessions Table -> Active/Expired/Revoked Session`.
- Fin de version: logout revoque la session courante, logout all devices revoque toutes les sessions; V8 est mergee dans `main`.

### V9: Security Hardening

- But: proteger l'auth contre les abus.
- Pourquoi: une auth exposee doit resister au brute force, aux comptes attaques et aux comportements suspects.
- Amelioration reelle prevue: rate limiting, logs de securite, compteur d'echecs login, blocage temporaire, configuration cookie production.
- System design: `Request -> Rate Limiter -> Auth -> Audit Logs -> Monitoring`.
- Fin de version: les protections principales sont testees et documentees; V9 est mergee dans `main`.

### V10: Deployment / Observability

- But: rapprocher le projet d'un vrai systeme deployable.
- Pourquoi: une architecture serieuse doit separer dev/prod, config, logs, build et deploiement.
- Amelioration reelle prevue: variables d'environnement, config dev/prod, seed admin securise, build frontend/backend, documentation finale.
- System design: `Frontend -> API -> DB -> Logs -> Monitoring -> CI/CD`.
- Fin de version: l'application a un chemin de lancement et de verification proche production; V10 est mergee dans `main`.

Note: V1/V2 utilisent deja techniquement un cookie de session et `[Authorize]` pour avoir un dashboard vraiment protege. V3 et V4 ne doivent donc pas simplement renommer l'existant; elles doivent rendre ces mecanismes plus clairs, plus controles et plus maintenables.

## Structure Du Projet

```txt
progressive-auth/
|-- backend/
|   |-- Controllers/
|   |   |-- AuthController.cs
|   |   `-- DashboardController.cs
|   |-- Data/
|   |   `-- AppDbContext.cs
|   |-- Dtos/
|   |   |-- LoginRequest.cs
|   |   `-- RegisterRequest.cs
|   |-- Migrations/
|   |-- Models/
|   |   `-- Users.cs
|   |-- Program.cs
|   |-- appsettings.json
|   `-- backend.http
|-- frontend/
|   |-- app/
|   |   |-- dashboard/page.tsx
|   |   |-- login/page.tsx
|   |   |-- register/page.tsx
|   |   `-- page.tsx
|   |-- lib/
|   |   `-- api.ts
|   `-- next.config.ts
`-- README.md
```

## Backend

Routes exposees:

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/dashboard
```

### AuthController

`POST /api/auth/register`

- Recoit `name`, `email`, `password`.
- Nettoie le nom et l'email avec `Trim()`.
- Normalise l'email avec `ToLowerInvariant()`.
- Refuse les champs vides.
- Refuse un email deja utilise.
- Cree un hash avec `PasswordHasher<Users>`.
- Stocke uniquement `PasswordHash` en base.
- Retourne les informations utilisateur sans `PasswordHash`.

`POST /api/auth/login`

- Recoit `email`, `password`.
- Cherche l'utilisateur par email.
- Verifie le password avec `VerifyHashedPassword`.
- Cree une session cookie avec `SignInAsync` si le password est valide.
- Stocke dans le cookie des claims: id, name, email.

`GET /api/auth/me`

- Route protegee avec `[Authorize]`.
- Lit l'id utilisateur depuis les claims du cookie.
- Verifie que l'utilisateur existe encore en base.
- Retourne les informations utilisateur sans `PasswordHash`.

`POST /api/auth/logout`

- Route protegee avec `[Authorize]`.
- Supprime la session cookie avec `SignOutAsync`.

### DashboardController

`GET /api/dashboard`

- Route protegee avec `[Authorize]`.
- Lit le nom et l'email depuis les claims.
- Retourne une reponse simple pour afficher le dashboard.
- Affiche le niveau actuel: `V2 hashed password + cookie session`.

### Session Cookie

La session utilise un cookie HTTP-only:

```txt
progressive_auth_session
```

Configuration importante:

- `HttpOnly = true`: JavaScript ne peut pas lire le cookie.
- `SameSite = Lax`: comportement simple pour l'app locale.
- `SecurePolicy = None`: autorise HTTP en local.
- `ExpireTimeSpan = 2 heures`: duree de session.
- `SlidingExpiration = true`: prolonge la session si l'utilisateur continue a utiliser l'app.

## Database

SQLite est utilise en developpement:

```txt
backend/app.db
```

`app.db` est ignore par Git, car c'est une base locale.

Table principale:

```txt
Users
```

Colonnes actuelles:

```txt
Id
Name
Email
PasswordHash
CreatedAt
```

Migrations importantes:

- `InitialCreate`: cree la table `Users`.
- `RenamePasswordToPasswordHash`: remplace `Password` par `PasswordHash`.

## Frontend

Pages principales:

```txt
/
/register
/login
/dashboard
```

### `frontend/lib/api.ts`

Ce fichier centralise les appels HTTP entre React et le backend.

Correspondances:

```txt
register()      -> POST /api/auth/register
login()         -> POST /api/auth/login
logout()        -> POST /api/auth/logout
getMe()         -> GET  /api/auth/me
getDashboard()  -> GET  /api/dashboard
```

Toutes les requetes utilisent:

```ts
credentials: "include"
```

Cela permet au navigateur d'envoyer le cookie de session au backend.

### Rewrite Next.js

`frontend/next.config.ts` redirige les appels:

```txt
http://localhost:3000/api/...
```

vers:

```txt
http://localhost:5000/api/...
```

Cela evite de configurer CORS pour cette version locale et simplifie l'utilisation du cookie.

## Flux Utilisateur

### Inscription

```txt
/register
  -> POST /api/auth/register
  -> hash du password
  -> creation utilisateur en SQLite
  -> redirection vers /login
```

### Connexion

```txt
/login
  -> POST /api/auth/login
  -> verification du password contre PasswordHash
  -> creation cookie HTTP-only
  -> redirection vers /dashboard
```

### Dashboard Protege

```txt
/dashboard
  -> GET /api/dashboard
  -> si session valide: affichage du dashboard
  -> sinon: redirection vers /login
```

### Deconnexion

```txt
Logout
  -> POST /api/auth/logout
  -> suppression du cookie
  -> redirection vers /login
```

## Lancer Le Projet

Backend:

```powershell
cd backend
dotnet run --urls "http://localhost:5000"
```

Frontend, dans un deuxieme terminal:

```powershell
cd frontend
npm run dev
```

Puis ouvrir:

```txt
http://localhost:3000
```

## Tests Manuels

Tester dans le navigateur:

1. Aller sur `/register`.
2. Creer un compte avec un nouvel email.
3. Verifier la redirection vers `/login`.
4. Se connecter avec le meme email/password.
5. Verifier la redirection vers `/dashboard`.
6. Verifier que le dashboard affiche le nom et l'email.
7. Verifier que le dashboard affiche `V2 hashed password + cookie session`.
8. Cliquer sur `Logout`.
9. Verifier la redirection vers `/login`.
10. Aller directement sur `/dashboard`.
11. Verifier que l'utilisateur non connecte est renvoye vers `/login`.

Tester le backend avec `backend/backend.http`:

```txt
Register
Login
Me
Dashboard
Logout
Me apres logout doit renvoyer 401
Login avec mauvais password doit renvoyer 401
```

## Commandes De Verification

Backend:

```powershell
cd backend
dotnet build
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

## Historique Et Suite

Cette section sert de journal court. Quand une version est terminee, elle passe de "Objectif prevu" a "Ce qui a ete fait".

### V1: Basic Authentication

Ce qui a ete fait:

- squelette complet `User -> Frontend -> Backend API -> Database`
- inscription
- connexion
- deconnexion
- premiere session par cookie HTTP-only pour rendre le dashboard reellement protege
- dashboard protege
- SQLite avec table `Users`
- frontend Next.js avec pages `/register`, `/login`, `/dashboard`

Pourquoi c'etait necessaire:

V1 etablit le flux de base avant les ameliorations de securite. Sans ce flux, les versions suivantes n'auraient rien de concret a renforcer.

Limite V1:

- le password etait stocke en clair dans la colonne `Password`

### V2: Password Hashing

Ce qui a ete fait:

- `Password` devient `PasswordHash`
- `Register` ne sauvegarde plus le mot de passe recu
- `Register` genere un hash avec `PasswordHasher<Users>`
- `Login` verifie le password avec `VerifyHashedPassword`
- les reponses API ne renvoient jamais `PasswordHash`
- la session cookie HTTP-only reste utilisee apres connexion
- `backend/app.db` n'est plus suivi par Git

Pourquoi c'etait necessaire:

V2 corrige le plus gros probleme de V1: un mot de passe ne doit jamais etre stocke en clair. Elle introduit la difference entre le mot de passe recu pendant la requete et le hash persistant en base.

Un hash n'est pas reversible. On ne dechiffre jamais un password: on verifie seulement si le password recu correspond au hash stocke.

### V3: Sessions + Cookies

Ce qui a ete fait:

- ajouter `rememberMe` au login
- session courte par defaut quand `rememberMe = false`
- session persistante plus longue quand `rememberMe = true`
- checkbox `Remember me` dans la page `/login`
- verification dans le navigateur via le cookie `progressive_auth_session`

Pourquoi cette version existe:

HTTP est stateless: chaque requete est independante. Sans session, le backend ne peut pas savoir qu'une requete vient d'un utilisateur deja connecte. V3 explique et controle donc la maniere dont l'identite est conservee entre plusieurs requetes.

System design V3:

```txt
+------------------+
|      User        |
| Browser          |
+--------+---------+
         |
         | email/password/rememberMe
         v
+--------------------------+
| Frontend Next.js         |
| /login                   |
|                          |
| - affiche le formulaire  |
| - envoie rememberMe      |
+------------+-------------+
             |
             | POST /api/auth/login
             | JSON
             v
+--------------------------+
| Backend ASP.NET Core     |
| AuthController.Login     |
|                          |
| - verifie le password    |
| - construit les claims   |
| - cree authProperties    |
+------------+-------------+
             |
             | SignInAsync()
             v
+--------------------------+
| Cookie Auth Ticket       |
| progressive_auth_session |
|                          |
| HttpOnly                 |
| SameSite=Lax             |
| Expiration selon choix   |
+------------+-------------+
             |
             | Set-Cookie
             v
+--------------------------+
| Browser Cookie Store     |
|                          |
| Session cookie           |
| ou persistent cookie     |
+------------+-------------+
             |
             | cookie renvoye automatiquement
             v
+--------------------------+
| Protected API Routes     |
| /api/auth/me             |
| /api/dashboard           |
+--------------------------+
```

Flux V3:

```txt
Login sans Remember me
 -> rememberMe=false
 -> IsPersistent=false
 -> expiration courte
 -> cookie affiche "Session" dans DevTools

Login avec Remember me
 -> rememberMe=true
 -> IsPersistent=true
 -> expiration longue
 -> cookie affiche une date d'expiration dans DevTools
```

Ce que V3 change cote backend:

- `LoginRequest` recoit `RememberMe`
- `AuthController.Login` cree des `AuthenticationProperties`
- `IsPersistent` depend de `RememberMe`
- `ExpiresUtc` change selon le type de session choisi

Ce que V3 change cote frontend:

- `frontend/lib/api.ts` envoie `rememberMe` dans le JSON de login
- la page `/login` affiche une checkbox `Remember me`
- le navigateur stocke le cookie sans que JavaScript puisse le lire directement

Limites restantes:

- le cookie contient un ticket signe, mais il n'y a pas encore de table `Sessions`
- on ne peut pas encore lister ou revoquer les sessions actives
- la configuration cookie est adaptee au dev local, pas encore durcie pour production

Tests de validation:

- login sans `Remember me` cree un cookie `progressive_auth_session` de type session
- login avec `Remember me` cree un cookie persistant
- `/api/auth/me` fonctionne apres login
- `/api/dashboard` fonctionne apres login
- logout supprime la session

### V4: Authentication Middleware

Objectif prevu:

- expliquer `UseAuthentication()`
- expliquer `UseAuthorization()`
- expliquer `[Authorize]`
- centraliser la recuperation de l'utilisateur courant
- separer clairement authentification et autorisation

Pourquoi cette version vient apres V3:

Quand les sessions sont claires, on peut nettoyer la structure du backend: le pipeline ASP.NET Core doit porter la responsabilite d'authentifier la requete avant les controllers.

### V5: User Roles

Objectif prevu:

- ajouter un role utilisateur: `USER` ou `ADMIN`
- proteger certaines routes pour les admins uniquement
- expliquer la difference entre etre connecte et etre autorise

Pourquoi cette version vient apres V4:

Une fois l'authentification stable, on peut ajouter l'autorisation. Le backend doit pouvoir dire non a un utilisateur connecte s'il n'a pas le bon role.

### V6: Email Verification

Objectif prevu:

- ajouter un champ de statut email verifie/non verifie
- generer un token de verification
- bloquer ou limiter certains acces tant que l'email n'est pas verifie

Pourquoi cette version vient apres V5:

Les roles disent ce que l'utilisateur peut faire. La verification email ajoute un autre niveau: est-ce que l'identite declaree est fiable ?

### V7: Forgot Password

Objectif prevu:

- generer un token temporaire de reset password
- stocker une expiration
- permettre de definir un nouveau mot de passe
- invalider le token apres utilisation

Pourquoi cette version vient apres V6:

Le reset password depend d'une adresse email fiable. Il vient donc apres la verification email.

### V8: Sessions Table / Revocation

Objectif prevu:

- ajouter une table `Sessions`
- stocker un identifiant de session dans les claims
- verifier que la session existe encore et n'est pas revoquee
- revoquer la session courante au logout
- ajouter un logout all devices

Pourquoi cette version vient apres V7:

Quand les grands flux utilisateur existent, on peut rendre les sessions observables et revocables. C'est une brique importante avant le durcissement securite general.

### V9: Security Hardening

Objectif prevu:

- rate limiting sur login/register/reset password
- logs de securite
- compteur d'echecs login
- blocage temporaire de compte
- durcissement de la configuration cookie en production

Pourquoi cette version vient apres V8:

Une fois les sessions suivies en base, le systeme peut reagir plus proprement aux abus: limiter, journaliser, bloquer, expirer et revoquer.

### V10: Deployment / Observability

Objectif prevu:

- variables d'environnement
- configuration dev/prod
- seed admin securise
- build frontend/backend
- documentation finale avec schema global
- preparation CI/CD ou Docker si necessaire

Pourquoi cette version vient apres V9:

Quand l'auth est fonctionnelle et durcie, la derniere etape est de rendre le projet plus proche d'un vrai environnement: configuration propre, builds reproductibles, logs et chemin de deploiement.

## Workflow Git

Regle appliquee:

```txt
une branche par version
commit souvent quand une partie fonctionne
push souvent pour sauvegarder a distance
merge dans main seulement quand la version est terminee
```

Branches:

```txt
v1-basic-auth
v2-password-hashing
v3-session-cookies
```

Avant merge d'une version:

```powershell
git status
dotnet build
npm run lint
npm run build
```

Merge recommande:

```powershell
git checkout main
git pull
git merge --no-ff nom-de-la-branche -m "Merge version description"
git push
```

## Notes De Securite

Ne jamais renvoyer `PasswordHash` au frontend.

Les reponses API doivent retourner seulement:

```txt
Id
Name
Email
CreatedAt
```

La V2 hash les mots de passe, mais elle reste une version d'apprentissage. Avant une utilisation serieuse, il faudra ajouter au minimum une validation plus stricte des mots de passe, une configuration production pour les cookies, des tests automatises et une vraie strategie de deploiement.

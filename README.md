# Progressive Auth

Application d'authentification progressive avec:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: C#, ASP.NET Core Web API, Entity Framework Core
- Database: SQLite

Etat actuel: V2. L'application permet de creer un compte, se connecter, se deconnecter, lire l'utilisateur courant et acceder a un dashboard protege. Les mots de passe sont maintenant stockes sous forme de hash.

Ce projet n'est pas seulement une app login/register. C'est un projet pedagogique de system design: chaque version ajoute une brique d'authentification, explique pourquoi elle existe, puis la merge dans `main` seulement quand elle est terminee.

## Architecture

```txt
User
  -> Frontend Next.js
  -> Backend ASP.NET Core Web API
  -> SQLite
```

Le frontend affiche les pages et appelle l'API en JSON. Le backend valide les donnees, gere la session cookie, hash les mots de passe et lit/ecrit dans SQLite avec Entity Framework Core.

## Roadmap Pedagogique

Le plan complet du projet est progressif:

```txt
V1 -> inscription, connexion, deconnexion, page protegee, stockage utilisateur
V2 -> hash du mot de passe
V3 -> sessions + cookies
V4 -> middleware d'authentification
V5 -> roles utilisateur: USER et ADMIN
V6 -> verification email
V7 -> mot de passe oublie avec token temporaire
V8 -> securite avancee: rate limiting, logs, statut de compte, expiration/revocation des sessions
```

Pourquoi cette progression:

- V1 pose le flux complet minimal: un utilisateur peut creer un compte, se connecter, acceder a une page protegee et se deconnecter.
- V2 corrige la faiblesse la plus evidente de V1: ne jamais stocker un mot de passe en clair.
- V3 isole le sujet des sessions et cookies pour comprendre comment le navigateur reste connecte entre deux requetes.
- V4 isole le middleware d'authentification pour comprendre comment le backend reconnait et protege automatiquement certaines routes.
- V5 ajoute l'autorisation par role, parce qu'etre connecte ne veut pas toujours dire avoir tous les droits.
- V6 ajoute la verification email pour confirmer que l'utilisateur controle l'adresse fournie.
- V7 ajoute le reset password avec token temporaire pour couvrir un flux d'authentification realiste.
- V8 ajoute les protections avancees necessaires quand l'app se rapproche d'un vrai systeme de production.

Note: la V1/V2 actuelles utilisent deja techniquement un cookie de session et `[Authorize]` pour avoir un dashboard vraiment protege. Les versions V3 et V4 ne serviront donc pas a "inventer" ces concepts depuis zero, mais a les rendre pedagogiques, explicites, mieux structures et plus proches d'un systeme professionnel.

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

## Historique Des Versions

### V1: Basic Authentication

Pourquoi cette version existe:

V1 sert a construire le squelette complet du systeme avant de parler de securite avancee. L'objectif est de comprendre le trajet principal `User -> Frontend -> Backend API -> Database`.

La V1 a ajoute:

- inscription
- connexion
- deconnexion
- premiere session par cookie HTTP-only pour rendre le dashboard reellement protege
- dashboard protege
- SQLite avec table `Users`
- frontend Next.js avec pages `/register`, `/login`, `/dashboard`

Limite V1:

- le password etait stocke en clair dans la colonne `Password`

### V2: Password Hashing

Pourquoi cette version existe:

V2 corrige le plus gros probleme de V1: un mot de passe ne doit jamais etre stocke en clair. Elle introduit la difference entre le mot de passe recu pendant la requete et le hash persistant en base.

La V2 corrige la limite principale de la V1:

- `Password` devient `PasswordHash`
- `Register` ne sauvegarde plus le mot de passe recu
- `Register` genere un hash avec `PasswordHasher<Users>`
- `Login` verifie le password avec `VerifyHashedPassword`
- les reponses API ne renvoient jamais `PasswordHash`
- la session cookie HTTP-only reste utilisee apres connexion
- `backend/app.db` n'est plus suivi par Git

Un hash n'est pas reversible. On ne dechiffre jamais un password: on verifie seulement si le password recu correspond au hash stocke.

### V3: Sessions + Cookies

Objectif prevu:

- documenter precisement le role du cookie HTTP-only
- expliquer pourquoi le frontend ne stocke pas lui-meme l'utilisateur connecte
- clarifier le role de `/api/auth/me`
- renforcer la configuration du cookie local/dev vs production
- preparer, si necessaire, une vraie table de sessions pour expiration/revocation future

### V4: Authentication Middleware

Objectif prevu:

- expliquer `UseAuthentication()`
- expliquer `UseAuthorization()`
- expliquer `[Authorize]`
- centraliser la recuperation de l'utilisateur courant
- separer clairement authentification et autorisation

### V5: User Roles

Objectif prevu:

- ajouter un role utilisateur: `USER` ou `ADMIN`
- proteger certaines routes pour les admins uniquement
- expliquer la difference entre etre connecte et etre autorise

### V6: Email Verification

Objectif prevu:

- ajouter un champ de statut email verifie/non verifie
- generer un token de verification
- bloquer ou limiter certains acces tant que l'email n'est pas verifie

### V7: Forgot Password

Objectif prevu:

- generer un token temporaire de reset password
- stocker une expiration
- permettre de definir un nouveau mot de passe
- invalider le token apres utilisation

### V8: Advanced Security

Objectif prevu:

- rate limiting
- logs de securite
- statut de compte
- expiration et revocation de sessions
- durcissement de la configuration cookie en production

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
git merge --no-ff v2-password-hashing -m "Merge V2 password hashing"
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

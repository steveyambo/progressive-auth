# Progressive Auth

Application V1 d'authentification progressive avec:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: C#, ASP.NET Core Web API, Entity Framework Core
- Base de donnees: SQLite

La V1 reste volontairement simple: inscription, connexion, deconnexion, session par cookie, page protegee et stockage utilisateur en base.

## Architecture V1

```txt
User
  -> Frontend Next.js
  -> Backend ASP.NET Core Web API
  -> SQLite
```

Le frontend affiche les pages et appelle les routes API en JSON.
Le backend valide les donnees, gere la session cookie et lit/ecrit dans SQLite avec Entity Framework Core.

## Structure du projet

```txt
progressive-auth/
├── backend/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   └── DashboardController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Dtos/
│   │   ├── LoginRequest.cs
│   │   └── RegisterRequest.cs
│   ├── Migrations/
│   ├── Models/
│   │   └── Users.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── backend.http
├── frontend/
│   ├── app/
│   │   ├── dashboard/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── api.ts
│   └── next.config.ts
└── README.md
```

## Backend

Le backend expose les routes suivantes:

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
- Cree un utilisateur en base.
- Retourne les informations utilisateur sans le password.

`POST /api/auth/login`

- Recoit `email`, `password`.
- Cherche l'utilisateur par email.
- Compare le password recu avec le password stocke.
- Cree une session cookie avec `SignInAsync`.
- Stocke dans le cookie des claims: id, name, email.

`GET /api/auth/me`

- Route protegee avec `[Authorize]`.
- Lit l'id utilisateur depuis les claims du cookie.
- Verifie que l'utilisateur existe encore en base.
- Retourne les informations utilisateur sans le password.

`POST /api/auth/logout`

- Route protegee avec `[Authorize]`.
- Supprime la session cookie avec `SignOutAsync`.

### DashboardController

`GET /api/dashboard`

- Route protegee avec `[Authorize]`.
- Lit le nom et l'email depuis les claims.
- Retourne une reponse simple pour afficher le dashboard.

### Session cookie

La V1 utilise un cookie HTTP-only:

```txt
progressive_auth_session
```

Configuration importante:

- `HttpOnly = true`: JavaScript ne peut pas lire le cookie.
- `SameSite = Lax`: comportement simple pour l'app locale.
- `SecurePolicy = None`: autorise HTTP en local.
- `ExpireTimeSpan = 2 heures`: duree de session.
- `SlidingExpiration = true`: prolonge la session si l'utilisateur continue a utiliser l'app.

## Base de donnees

La V1 utilise SQLite:

```txt
backend/app.db
```

La table principale est:

```txt
Users
```

Colonnes:

```txt
Id
Name
Email
Password
CreatedAt
```

Une migration EF Core initiale cree cette table et ajoute un index unique sur `Email`.

Important: `app.db` est ignore par Git, car c'est une base locale de developpement.

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

Le fichier `frontend/next.config.ts` redirige les appels frontend:

```txt
http://localhost:3000/api/...
```

vers le backend:

```txt
http://localhost:5000/api/...
```

Cela evite de configurer CORS pour la V1 et simplifie l'utilisation du cookie.

## Flux utilisateur

### Inscription

```txt
/register
  -> POST /api/auth/register
  -> creation utilisateur en SQLite
  -> redirection vers /login
```

### Connexion

```txt
/login
  -> POST /api/auth/login
  -> creation cookie HTTP-only
  -> redirection vers /dashboard
```

### Dashboard protege

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

## Lancer le projet

### Backend

```powershell
cd backend
dotnet run --urls "http://localhost:5000"
```

### Frontend

Dans un deuxieme terminal:

```powershell
cd frontend
npm run dev
```

Puis ouvrir:

```txt
http://localhost:3000
```

## Tests manuels V1

Tester dans le navigateur:

1. Aller sur `/register`.
2. Creer un compte avec un nouvel email.
3. Verifier la redirection vers `/login`.
4. Se connecter.
5. Verifier la redirection vers `/dashboard`.
6. Verifier que le dashboard affiche le nom et l'email.
7. Cliquer sur `Logout`.
8. Verifier la redirection vers `/login`.
9. Aller directement sur `/dashboard`.
10. Verifier que l'utilisateur non connecte est renvoye vers `/login`.

Tester le backend avec `backend/backend.http`:

```txt
Register
Login
Me
Dashboard
Logout
Me apres logout doit renvoyer 401
```

## Commandes de verification

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

## Workflow Git utilise

La V1 est developpee sur:

```txt
v1-basic-auth
```

Regle appliquee:

```txt
commit souvent quand une partie fonctionne
push souvent pour sauvegarder a distance
merge dans main seulement quand la version est terminee
```

Exemples de commits faits pendant la V1:

```txt
Implement backend auth API
Clean backend artifacts and sanitize register response
Scaffold Next.js frontend
Configure frontend API rewrite
Add frontend API client
Add register page
Add login page
Add protected dashboard page
Add frontend home page
```

Avant merge:

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
git merge --no-ff v1-basic-auth -m "Merge V1 basic authentication"
git push
```

## Limites volontaires de la V1

Cette V1 est pedagogique et volontairement simple.

Limites connues:

- Le mot de passe est stocke en clair.
- Il n'y a pas encore de hash de password.
- Il n'y a pas encore de validation avancee du mot de passe.
- Il n'y a pas encore de refresh token.
- Il n'y a pas encore de roles ou permissions.
- Il n'y a pas encore de tests automatises.
- SQLite est utilise pour demarrer vite.

La V2 devra au minimum remplacer `Password` par `PasswordHash` et utiliser un vrai hash de mot de passe.

## Notes de securite

Ne jamais renvoyer `Password` au frontend.

Meme en V1, les reponses API doivent retourner seulement:

```txt
Id
Name
Email
CreatedAt
```

Le stockage du password en clair est accepte uniquement pour cette V1 d'apprentissage. Il doit etre corrige avant toute utilisation serieuse.

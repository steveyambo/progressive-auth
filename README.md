# Progressive Auth

Application d'authentification progressive avec:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: C#, ASP.NET Core Web API, Entity Framework Core
- Database: SQLite

Etat actuel: V6. L'application ajoute maintenant la verification d'adresse email au flux d'authentification. Un compte recoit un token temporaire par email, ne peut pas se connecter avant confirmation, peut demander un nouveau lien et expose son statut `EmailVerified` dans les reponses utilisateur et le dashboard. En developpement, les emails sont envoyes par SMTP vers Mailpit avec Docker Compose.

Ce projet n'est pas seulement une app login/register. C'est une progression d'authentification: chaque version ajoute une amelioration reelle, documente pourquoi elle existe, puis est mergee dans `main` seulement quand elle est terminee et testee.

## Architecture

```txt
User
  -> Frontend Next.js
  -> Backend ASP.NET Core Web API
      -> SQLite
      -> SMTP Mailpit
          -> Email de verification
          -> Frontend /verify-email
          -> Backend POST /api/auth/verify-email
```

Le frontend affiche les pages et appelle l'API en JSON. Le backend valide les donnees, gere la session cookie, hash les mots de passe et lit/ecrit dans SQLite avec Entity Framework Core. Pour la V6, le backend genere aussi des tokens temporaires et envoie les liens de verification par SMTP. Mailpit intercepte ces emails localement sans utiliser de domaine ni envoyer de vrais messages.

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
- Amelioration reelle: statut `EmailVerified`, token temporaire, envoi SMTP, verification, renvoi du lien et refus du login avant verification.
- System design: `Register -> SQLite -> SMTP Mailpit -> /verify-email -> EmailVerified=true -> Login autorise`.
- Critere de fin: le compte peut etre cree, recevoir ou renvoyer son email, etre verifie, puis se connecter; V6 est mergee dans `main` seulement apres les tests et la documentation.

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
|   |   |-- AdminController.cs
|   |   |-- AuthController.cs
|   |   `-- DashboardController.cs
|   |-- Data/
|   |   `-- AppDbContext.cs
|   |-- Dtos/
|   |   |-- LoginRequest.cs
|   |   |-- RegisterRequest.cs
|   |   |-- ResendVerificationRequest.cs
|   |   `-- VerifyEmailRequest.cs
|   |-- Extensions/
|   |   `-- CurrentUserExtensions.cs
|   |-- Migrations/
|   |-- Models/
|   |   |-- UserRole.cs
|   |   `-- Users.cs
|   |-- Options/
|   |   `-- EmailOptions.cs
|   |-- Services/
|   |   |-- IEmailSender.cs
|   |   `-- SmtpEmailSender.cs
|   |-- Program.cs
|   |-- appsettings.Development.json
|   |-- appsettings.json
|   `-- backend.http
|-- frontend/
|   |-- app/
|   |   |-- dashboard/page.tsx
|   |   |-- login/page.tsx
|   |   |-- register/page.tsx
|   |   |-- verify-email/
|   |   |   |-- page.tsx
|   |   |   `-- verify-email-content.tsx
|   |   `-- page.tsx
|   |-- lib/
|   |   `-- api.ts
|   `-- next.config.ts
|-- docker-compose.yml
`-- README.md
```

## Backend

Routes exposees:

```txt
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/dashboard
GET  /api/admin
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
- Genere un token de verification aleatoire valable 24 heures.
- Enregistre l'utilisateur avant de tenter l'envoi SMTP.
- Retourne `verificationEmailSent` pour distinguer creation du compte et livraison de l'email.
- Retourne les informations utilisateur sans `PasswordHash`.

`POST /api/auth/verify-email`

- Recoit un token depuis la page `/verify-email`.
- Refuse un token absent, inconnu ou expire.
- Passe `EmailVerified` a `true`.
- Supprime le token et son expiration apres utilisation.

`POST /api/auth/resend-verification`

- Recoit une adresse email.
- Retourne une reponse generique pour limiter l'enumeration des comptes.
- Remplace l'ancien token par un nouveau token valable 24 heures.
- Retourne `503 Service Unavailable` si le service SMTP est indisponible.

`POST /api/auth/login`

- Recoit `email`, `password`.
- Cherche l'utilisateur par email.
- Verifie le password avec `VerifyHashedPassword`.
- Retourne `403` avec le code `EMAIL_NOT_VERIFIED` si le password est valide mais l'email non verifie.
- Cree une session cookie avec `SignInAsync` si le password est valide.
- Stocke dans le cookie des claims: id, name, email, role et `email_verified`.

`GET /api/auth/me`

- Route protegee avec `[Authorize]`.
- Lit l'id utilisateur avec `User.GetUserId()`.
- Verifie que l'utilisateur existe encore en base.
- Retourne les informations utilisateur sans `PasswordHash`.

`POST /api/auth/logout`

- Route protegee avec `[Authorize]`.
- Supprime la session cookie avec `SignOutAsync`.

### DashboardController

`GET /api/dashboard`

- Route protegee avec `[Authorize]`.
- Lit le nom, l'email et le role avec `CurrentUserExtensions`.
- Lit le statut email depuis le claim `email_verified`.
- Retourne une reponse simple pour afficher le dashboard.
- Affiche le niveau actuel: `V6 email verification`.

### AdminController

`GET /api/admin`

- Route protegee avec `[Authorize(Roles = "ADMIN")]`.
- Accessible seulement si le cookie contient le claim role `ADMIN`.
- Retourne `403 Forbidden` pour un utilisateur connecte avec le role `USER`.
- Retourne `401 Unauthorized` si aucun utilisateur n'est connecte.

### CurrentUserExtensions

`backend/Extensions/CurrentUserExtensions.cs` centralise la lecture des claims de l'utilisateur courant.

Pourquoi:

- `UseAuthentication()` remplit `HttpContext.User`.
- Les controllers n'ont pas besoin de connaitre partout les details de `ClaimTypes`.
- Le code devient plus lisible: `User.GetUserId()` exprime mieux l'intention que `User.FindFirstValue(...)`.

Methodes actuelles:

```txt
GetUserId()
GetUserName()
GetUserEmail()
GetUserRole()
```

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

### Email Delivery En Developpement

`IEmailSender` separe le flux d'authentification du transport utilise pour les emails. La V6 enregistre `SmtpEmailSender`, qui lit `EmailOptions` depuis `appsettings.Development.json`.

Configuration locale:

```txt
SMTP host: localhost
SMTP port: 1025
Mailpit UI: http://localhost:8025
FrontendBaseUrl: http://localhost:3000
```

Docker Compose demarre Mailpit et conserve ses messages dans le volume `mailpit_data`. Le port `1025` sert au backend pour envoyer; le port `8025` sert au navigateur pour consulter.

```txt
AuthController
  -> IEmailSender
  -> SmtpEmailSender
  -> localhost:1025
  -> Mailpit
```

Cette separation permettra de remplacer SMTP/Mailpit par un fournisseur reel sans changer le controleur. La V6 ne configure toutefois aucun fournisseur de production et ne necessite aucun nom de domaine.

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
Role
EmailVerified
EmailVerificationToken
EmailVerificationTokenExpiresAt
CreatedAt
```

Migrations importantes:

- `InitialCreate`: cree la table `Users`.
- `RenamePasswordToPasswordHash`: remplace `Password` par `PasswordHash`.
- `AddUserRole`: ajoute le role utilisateur stocke en texte (`USER` ou `ADMIN`).
- `AddEmailVerificationFields`: ajoute le statut, le token temporaire et son expiration.

## Frontend

Pages principales:

```txt
/
/register
/login
/dashboard
/verify-email
```

### `frontend/lib/api.ts`

Ce fichier centralise les appels HTTP entre React et le backend.

Correspondances:

```txt
register()      -> POST /api/auth/register
verifyEmail()   -> POST /api/auth/verify-email
resendVerificationEmail()
                -> POST /api/auth/resend-verification
login()         -> POST /api/auth/login
logout()        -> POST /api/auth/logout
getMe()         -> GET  /api/auth/me
getDashboard()  -> GET  /api/dashboard
```

`ApiError` conserve le statut HTTP et le code metier retourne par le backend. La page de login peut ainsi reconnaitre `EMAIL_NOT_VERIFIED` sans comparer le texte du message.

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
  -> creation utilisateur non verifie en SQLite
  -> generation token valable 24 heures
  -> envoi SMTP vers Mailpit
  -> ecran Check your inbox
```

### Verification Email

```txt
Mailpit
  -> clic sur le lien /verify-email?token=...
  -> Next.js lit le token
  -> POST /api/auth/verify-email
  -> backend valide token et expiration
  -> EmailVerified=true
  -> token supprime
  -> redirection manuelle vers /login
```

### Renvoi De Verification

```txt
Register ou Login
  -> POST /api/auth/resend-verification
  -> nouveau token et nouvelle expiration
  -> ancien lien invalide
  -> nouvel email dans Mailpit
```

### Connexion

```txt
/login
  -> POST /api/auth/login
  -> verification du password contre PasswordHash
  -> refus 403 EMAIL_NOT_VERIFIED si email non verifie
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

Mailpit, depuis la racine:

```powershell
docker compose up -d
```

Mailpit recoit les emails SMTP sur le port `1025`. Son interface est disponible sur:

```txt
http://localhost:8025
```

Backend, dans un deuxieme terminal:

```powershell
cd backend
dotnet run --urls "http://localhost:5000"
```

Frontend, dans un troisieme terminal:

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
3. Verifier l'ecran `Check your inbox`.
4. Tenter le login avant verification et verifier `EMAIL_NOT_VERIFIED`.
5. Verifier que le bouton de renvoi cree un nouvel email dans Mailpit.
6. Cliquer sur le dernier lien recu.
7. Verifier que `/verify-email` affiche `Email verified`.
8. Reutiliser le meme token et verifier qu'il est refuse.
9. Se connecter avec le meme email/password.
10. Verifier la redirection vers `/dashboard`.
11. Verifier le role et le statut `Email verified`.
12. Cliquer sur `Logout`.
13. Verifier que l'utilisateur non connecte est renvoye vers `/login`.

Tester le backend avec `backend/backend.http`:

```txt
Register
Login avant verification doit renvoyer 403 EMAIL_NOT_VERIFIED
Resend verification
Verify email
Verify email avec le meme token doit renvoyer 400
Login
Me
Dashboard
Logout
Me apres logout doit renvoyer 401
Login avec mauvais password doit renvoyer 401
```

Tester la panne SMTP:

```powershell
docker compose stop mailpit
```

- `Register` cree encore le compte et retourne `verificationEmailSent=false`.
- Apres `docker compose start mailpit`, `Resend verification` envoie un nouveau lien.

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

Ce qui a ete fait:

- `UseHttpsRedirection()` est place avant l'authentification et l'autorisation.
- `UseAuthentication()` est place avant `UseAuthorization()`.
- les routes controllers sont mappees apres les middlewares d'auth.
- le cookie auth retourne maintenant `401` et `403` pour l'API au lieu de redirections HTML.
- `CurrentUserExtensions` centralise la lecture des claims utilisateur.
- `AuthController.Me` utilise `User.GetUserId()`.
- `DashboardController` utilise `User.GetUserName()` et `User.GetUserEmail()`.

Pourquoi cette version existe:

Quand les sessions sont claires, il faut comprendre ce que le backend fait a chaque requete. V4 montre que l'authentification n'est pas seulement dans le controller `Login`: elle fait partie du pipeline ASP.NET Core.

System design V4:

```txt
+----------------------+
| HTTP Request         |
| Cookie optionnel     |
+----------+-----------+
           |
           | HTTPS first
           v
+----------------------+
| UseHttpsRedirection  |
| securise le transport|
+----------+-----------+
           |
           | lit le cookie si present
           v
+----------------------+
| UseAuthentication    |
| construit User       |
| ClaimsPrincipal      |
+----------+-----------+
           |
           | verifie [Authorize]
           v
+----------------------+
| UseAuthorization     |
| 401 si non connecte  |
| 403 si interdit      |
+----------+-----------+
           |
           | route autorisee
           v
+----------------------+
| Controller           |
| Auth / Dashboard     |
+----------+-----------+
           |
           | lit l'utilisateur courant
           v
+----------------------+
| CurrentUserExtensions|
| GetUserId/Name/Email |
+----------------------+
```

Flux V4:

```txt
Requete sans cookie vers /api/dashboard
 -> UseAuthentication ne trouve pas d'identite
 -> UseAuthorization voit [Authorize]
 -> CookieAuthenticationEvents retourne 401

Requete avec cookie valide vers /api/dashboard
 -> UseAuthentication reconstruit ClaimsPrincipal
 -> UseAuthorization autorise la requete
 -> DashboardController lit User.GetUserName()/GetUserEmail()
 -> 200 OK
```

Ce que V4 change cote backend:

- le pipeline est ordonne selon: transport, identite, acces, controller
- les erreurs d'auth sont adaptees a une API JSON
- la lecture des claims est factorisee dans une extension dediee

Limites restantes:

- il n'y a pas encore de roles ou policies personnalisees
- `403 Forbidden` sera surtout utile a partir de V5 avec les roles
- il n'y a pas encore de tests automatises du pipeline

Tests de validation:

- une route `[Authorize]` sans cookie retourne `401 Unauthorized`
- une route `[Authorize]` avec cookie valide retourne `200 OK`
- le dashboard affiche le nom et l'email depuis les claims
- la build backend passe

### V5: User Roles

Ce qui a ete fait:

- ajout de l'enum `UserRole` avec `USER` et `ADMIN`
- ajout de `Users.Role` avec valeur par defaut `USER`
- stockage du role en texte dans SQLite via `HasConversion<string>()`
- migration `AddUserRole`
- ajout du claim `ClaimTypes.Role` dans le cookie au login
- ajout de `User.GetUserRole()`
- ajout de `GET /api/admin` protege par `[Authorize(Roles = "ADMIN")]`
- affichage du role dans le dashboard frontend

Pourquoi cette version existe:

Une fois l'authentification stable, on peut ajouter l'autorisation. Le backend doit pouvoir dire non a un utilisateur connecte s'il n'a pas le bon role.

System design V5:

```txt
+----------------------+
| User record          |
| SQLite Users.Role    |
| USER ou ADMIN        |
+----------+-----------+
           |
           | login valide
           v
+----------------------+
| AuthController.Login |
| ajoute ClaimTypes.Role|
+----------+-----------+
           |
           | SignInAsync
           v
+----------------------+
| Cookie Auth Ticket   |
| id/name/email/role   |
+----------+-----------+
           |
           | requete vers route protegee
           v
+----------------------+
| UseAuthentication    |
| reconstruit User     |
+----------+-----------+
           |
           | verifie role si necessaire
           v
+----------------------+
| UseAuthorization     |
| [Authorize]          |
| [Authorize(Roles)]   |
+----------+-----------+
           |
           | ADMIN seulement
           v
+----------------------+
| AdminController      |
| GET /api/admin       |
+----------------------+
```

Difference importante:

```txt
Authentication = qui est l'utilisateur ?
Authorization  = qu'a-t-il le droit de faire ?
```

Flux V5:

```txt
Utilisateur USER vers /api/dashboard
 -> cookie valide
 -> [Authorize] accepte
 -> 200 OK

Utilisateur USER vers /api/admin
 -> cookie valide
 -> [Authorize(Roles = "ADMIN")] refuse
 -> 403 Forbidden

Utilisateur ADMIN vers /api/admin
 -> cookie valide avec role ADMIN
 -> [Authorize(Roles = "ADMIN")] accepte
 -> 200 OK
```

Limites restantes:

- il n'y a pas encore d'interface pour promouvoir un utilisateur en admin
- pour tester ADMIN en dev, le role peut etre modifie directement dans SQLite
- les permissions sont encore simples: seulement `USER` et `ADMIN`

Tests de validation:

- un nouvel inscrit recoit le role `USER`
- `/api/dashboard` fonctionne pour `USER`
- `/api/admin` retourne `403` pour `USER`
- apres passage manuel du role a `ADMIN`, `/api/admin` retourne `200`

### V6: Email Verification

Ce qui a ete fait:

- ajout de `EmailVerified`, `EmailVerificationToken` et `EmailVerificationTokenExpiresAt`
- migration `AddEmailVerificationFields`
- generation d'un token aleatoire de 32 octets converti en hexadecimal
- expiration du token apres 24 heures
- envoi d'un lien par `IEmailSender` et `SmtpEmailSender`
- environnement Mailpit reproductible avec Docker Compose
- ajout de `POST /api/auth/verify-email`
- token invalide apres sa premiere utilisation
- ajout de `POST /api/auth/resend-verification`
- remplacement de l'ancien token lors d'un renvoi
- reponse generique du renvoi pour limiter l'enumeration des comptes
- gestion explicite d'une panne SMTP pendant l'inscription et le renvoi
- blocage du login avec `403 EMAIL_NOT_VERIFIED`
- ajout du claim `email_verified` dans le cookie apres login
- ajout de `/verify-email` avec `useSearchParams` et `Suspense`
- ajout du renvoi dans les pages register et login
- affichage de `Email verified` dans le dashboard

Pourquoi cette version vient apres V5:

Les roles disent ce que l'utilisateur peut faire. La verification email ajoute un autre niveau: est-ce que l'identite declaree est fiable ? La V7 pourra ensuite utiliser cette adresse fiable pour recuperer un compte.

System design V6:

```txt
+-----------------------+
| User / Browser        |
| /register             |
+-----------+-----------+
            |
            | name, email, password
            v
+-------------------------------+
| Frontend Next.js              |
| POST /api/auth/register       |
+---------------+---------------+
                |
                v
+-------------------------------+
| AuthController.Register       |
| - hash password               |
| - genere token + expiration   |
| - EmailVerified = false       |
+----------+--------------------+
           |
           | SaveChangesAsync
           v
+-------------------------------+
| SQLite Users                  |
| PasswordHash                  |
| EmailVerificationToken        |
| ExpiresAt                     |
+----------+--------------------+
           |
           | IEmailSender / SMTP :1025
           v
+-------------------------------+
| Mailpit                       |
| UI http://localhost:8025      |
+----------+--------------------+
           |
           | clic sur lien
           v
+-------------------------------+
| Next.js /verify-email         |
| lit ?token=...                |
+----------+--------------------+
           |
           | POST /api/auth/verify-email
           v
+-------------------------------+
| AuthController.VerifyEmail    |
| - token existe                |
| - token non expire            |
| - EmailVerified = true        |
| - token et expiration = null  |
+----------+--------------------+
           |
           | login apres verification
           v
+-------------------------------+
| Cookie HTTP-only              |
| id/name/email/role            |
| email_verified=True           |
+-------------------------------+
```

Gestion d'une panne SMTP:

```txt
Mailpit arrete
 -> SaveChangesAsync reussit
 -> compte conserve avec EmailVerified=false
 -> register retourne verificationEmailSent=false
 -> utilisateur redemarre Mailpit
 -> POST /api/auth/resend-verification
 -> nouveau token
 -> nouvel email
```

Pourquoi le compte n'est pas supprime si SMTP echoue:

SQLite et SMTP sont deux systemes independants. Sauvegarder avant l'envoi garantit que le lien correspond a un compte existant. Un endpoint de renvoi permet ensuite de recuperer d'une panne sans recreer le compte. Une version plus avancee pourrait utiliser un Outbox et un worker pour retenter automatiquement.

Limites restantes:

- Mailpit est uniquement un outil local; aucun vrai email n'est envoye
- le token de verification est stocke directement en base et n'est pas encore hashe
- aucun rate limiting ne protege encore register, login ou resend
- aucun delai minimal ne limite les demandes de renvoi
- aucun worker ou Outbox ne retente automatiquement un envoi
- aucune configuration SMTP de production, TLS ou domaine n'est fournie

Tests de validation:

- register avec Mailpit actif retourne `verificationEmailSent=true`
- register avec Mailpit arrete cree le compte et retourne `verificationEmailSent=false`
- login avant verification retourne `403 EMAIL_NOT_VERIFIED`
- renvoi apres redemarrage de Mailpit produit un nouvel email
- ancien token refuse apres renvoi
- token expire ou inconnu refuse
- token valide passe `EmailVerified` a `true` et devient inutilisable
- login apres verification cree le cookie
- dashboard affiche `Email verified` et `V6 email verification`

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
v4-auth-middleware
v5-roles-admin
v6-email-verification
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
Role
EmailVerified
CreatedAt
```

Ne jamais exposer `PasswordHash` ou `EmailVerificationToken` dans une reponse API.

La V6 utilise Mailpit uniquement en developpement. Elle ne constitue pas encore une configuration de production: il manque notamment un fournisseur email reel, TLS, une configuration par secrets, le hash des tokens temporaires, le rate limiting, des tests automatises et une strategie de deploiement.

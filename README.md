# 👶 Fille ou Garçon ?

Trois pages :

| URL        | Rôle                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| `#/`       | Cercle de répartition (vert = garçon, mauve = fille), % et nombre de participants, QR code vers le formulaire. |
| `#/parier` | Formulaire de pronostic : email, prénom, nom, sexe.                         |
| `#/admin`  | Liste des participants (prénom, nom, pronostic) filtrable Tous / Garçon / Fille, et reset de la base avec le jeton `ADMIN_TOKEN` du serveur. |

## Lancer

```bash
npm run dev
```

## Configuration (`.env`)

```
VITE_API_URL=http://localhost:3000   # serveur API (REST + Socket.io)
VITE_PUBLIC_URL=                     # URL encodée dans le QR code (optionnel)
```

Pour scanner le QR code depuis un téléphone sur le même Wi-Fi, mets l'IP du PC dans
`VITE_PUBLIC_URL` (ex. `http://192.168.1.20:5173/`) et lance `npm run dev -- --host`.
Relance `npm run dev` après chaque modification du `.env`.

## API

Tout passe par `src/api.js` :
- les stats sont chargées via `GET /api/stats` puis mises à jour en direct par l'événement Socket.io `stats` ;
- le formulaire envoie `POST /api/predictions` et affiche le `message` d'erreur du serveur (email déjà utilisé, etc.).

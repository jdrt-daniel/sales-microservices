# Frontend — Panel de Administración E-commerce

Panel de administración en Next.js 16 que consume todas las funcionalidades del
[`api-gateway`](../backend/api-gateway) del e-commerce.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript + Tailwind CSS v4
- pnpm
- `jose` para verificar el JWT del gateway en el servidor

## Arquitectura de autenticación (BFF)

La sesión se maneja con **cookies httpOnly** (el JWT nunca se expone al
navegador). El frontend actúa como Backend-for-Frontend:

1. El usuario inicia sesión en `/login`.
2. `app/api/auth/login` llama al gateway (`POST /auth/login`), recibe
   `{ accessToken, user }` y guarda el token en una cookie `httpOnly`
   (`token`) más una cookie de sesión legible (`session_user`) con los datos
   del usuario.
3. Todo el resto de llamadas pasa por el Route Handler `app/api/proxy/[...path]`,
   que agrega la cabecera `Authorization: Bearer <token>` y reenvía la petición
   al gateway.
4. `proxy.ts` (el "middleware" de Next 16) redirige de forma optimista: sin
   cookie `token` → `/login`; con sesión en `/login` o `/register` → `/`.
5. `/api/auth/session` expone la sesión actual al cliente; `AuthProvider`
   verifica la sesión al montar y redirige si expiró.

## Variables de entorno

Copiar `.env.example` a `.env.local`:

| Variable          | Descripción                                                  |
| ----------------- | ------------------------------------------------------------ |
| `API_GATEWAY_URL` | URL del api-gateway del backend (por defecto `http://localhost:3000`) |
| `JWT_SECRET`      | Mismo secreto que usa el api-gateway para firmar los JWT      |

## Puesta en marcha

Requisito: el `api-gateway` y sus microservicios levantados (ver
`../backend/README.md`).

```bash
pnpm install
pnpm dev        # http://localhost:3007
```

El puerto del servidor se configuró en `3007` (evita colisión con el gateway en
`3000`).

## Funcionalidades cubiertas

- **Autenticación**: login y registro.
- **Usuarios**: CRUD, activar/desactivar y cambiar contraseña (`PATCH /users/:id/password`).
- **Roles**: CRUD y asignación de permisos.
- **Permisos**: listar, crear y eliminar (el backend solo expone POST/GET/DELETE).
- **Clientes**: CRUD.
- **Productos**: CRUD y ajuste de stock (`PATCH /products/:id/stock`, cantidad negativa permitida).
- **Categorías**: CRUD con categorías padre para subcategorías.
- **Ventas**: listar, ver detalle de ítems y registrar ventas (cliente + ítems).
- **Compras**: listar, ver detalle de ítems y registrar compras (proveedor opcional + ítems con costo unitario).
- **Dashboard**: estado de salud (health check) de los servicios del gateway.

## Comandos

```bash
pnpm dev     # servidor de desarrollo en :3007
pnpm build   # build de producción
pnpm start   # servidor de producción en :3007
pnpm lint    # ESLint (config plana incluida por create-next-app)
```
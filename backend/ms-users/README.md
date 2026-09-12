# ms-users

Microservicio NestJS responsable de **usuarios**, **roles**, **permisos** y **clientes**.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Crear usuario (hashea password con bcrypt) |
| GET | `/users` | Listar usuarios (sin passwordHash) |
| GET | `/users/:id` | Detalle (con roles y permisos) |
| PATCH | `/users/:id` | Actualizar |
| PATCH | `/users/:id/password` | Cambiar contraseña |
| DELETE | `/users/:id` | Eliminar |
| POST/GET/PATCH/DELETE | `/roles` | CRUD de roles (con `permissionIds`) |
| POST/GET/DELETE | `/permissions` | CRUD de permisos |
| POST/GET/PATCH/DELETE | `/clients` | CRUD de clientes |

## Eventos publicados (Kafka)

Tópico `client-events`: `client.created`, `client.updated` — los consumirá `ms-sales`
para mantener su read model local de clientes.

## Cómo correrlo

```bash
npm install
cp .env.example .env      # ajusta DB_HOST/USER/PASSWORD/NAME y KAFKA_BROKER
npm run start:dev
```

Corre en el puerto **3001**. Requiere la base `users_db` ya creada en tu Postgres
(las tablas se crean solas con `synchronize: true`, solo para desarrollo).

## Notas de diseño

- `passwordHash` tiene `select: false` en la entidad: nunca se devuelve en
  `GET /users`. Para login se usará `usersService.findByEmailWithPassword()`.
- Este microservicio **no incluye login/JWT todavía** — eso lo añadiremos cuando
  conectemos el API Gateway (o si prefieres, lo agregamos aquí mismo en el
  siguiente paso, como `AuthModule`).

## Probar rápido

```bash
curl -X POST http://localhost:3001/permissions -H "Content-Type: application/json" \
  -d '{"name":"sales.create","resource":"sales"}'

curl -X POST http://localhost:3001/roles -H "Content-Type: application/json" \
  -d '{"name":"vendedor","permissionIds":["<id-del-permiso>"]}'

curl -X POST http://localhost:3001/users -H "Content-Type: application/json" \
  -d '{"email":"ana@demo.com","password":"12345678","fullName":"Ana Pérez","roleIds":["<id-del-rol>"]}'

curl -X POST http://localhost:3001/clients -H "Content-Type: application/json" \
  -d '{"documentNumber":"12345678","fullName":"Juan Cliente"}'
```

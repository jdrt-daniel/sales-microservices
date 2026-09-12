# Ecommerce Microservices

Plataforma de comercio electrónico basada en arquitectura de microservicios, construida con NestJS, Kafka, TypeORM y Docker.

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  api-gateway │────▶│  ms-users   │────▶│  ms-products│
│   (3000)    │     │   (3001)    │     │   (3002)    │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │            ┌──────▼──────┐
       │            │    Kafka    │
       │            │  (9094 ext) │
       │            └──────┬──────┘
       │                   │
       │            ┌──────▼──────┐     ┌─────────────┐
       └───────────▶│   ms-logs   │────▶│   Postgres  │
                    │   (3004)    │     │   Loki      │
                    └─────────────┘     └─────────────┘
```

### Microservicios

| Servicio | Puerto | gRPC | Descripción |
|----------|--------|------|-------------|
| `api-gateway` | 3000 | - | API Gateway con JWT, rate limiting y proxy |
| `ms-users` | 3001 | 5001 | Usuarios, roles, permisos y autenticación |
| `ms-products` | 3002 | 5002 | Catálogo de productos y categorías |
| `ms-sales` | 3003 | - | Ventas y compras (consume gRPC de otros servicios) |
| `ms-logs` | 3004 | - | Centralización de logs y métricas de negocio |
| `frontend` | 3007 | - | Panel de administración Next.js (React 19 + pnpm) |

### Infraestructura (Docker)

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Kafka | 9092/9094 | Bus de eventos (Apache Kafka, modo KRaft) |
| Kafka UI | 8080 | Interfaz para inspeccionar tópicos |
| Prometheus | 9090 | Scraping de métricas |
| Loki | 3100 | Almacenamiento de logs |
| Grafana | 3006 | Dashboards de observabilidad |

## Stack Tecnológico

- **Runtime**: NestJS 11 (TypeScript)
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 (pnpm)
- **Base de datos**: PostgreSQL (TypeORM)
- **Eventos**: Apache Kafka (kafkajs)
- **Comunicación síncrona**: gRPC (@grpc/grpc-js, @grpc/proto-loader)
- **Autenticación**: JWT (bcrypt + @nestjs/jwt)
- **Rate Limiting**: @nestjs/throttler
- **Métricas**: Prometheus (prom-client)
- **Logs**: Loki
- **Dashboards**: Grafana
- **Contenedores**: Docker Compose

## Estructura del Proyecto

```
ecommerce/
├── backend/
│   ├── api-gateway/           # API Gateway (puerto 3000)
│   │   └── src/
│   │       ├── auth/          # JWT Strategy y Guards
│   │       ├── proxy/         # Proxy reverso a microservicios
│   │       ├── kafka/         # Productor de eventos (logs)
│   │       ├── metrics/       # Métricas Prometheus
│   │       ├── health/        # Health check endpoint
│   │       └── common/        # Logging interceptor, decoradores
│   │
│   ├── ms-users/              # Microservicio de usuarios (puerto 3001)
│   │   └── src/
│   │       ├── auth/          # Login y registro (JWT)
│   │       ├── users/         # CRUD de usuarios
│   │       ├── roles/         # Gestión de roles
│   │       ├── permissions/   # Sistema de permisos
│   │       ├── clients/       # Clientes
│   │       ├── kafka/         # Productor de eventos
│   │       ├── metrics/       # Métricas de negocio
│   │       └── common/        # Middleware HTTP metrics
│   │
│   ├── ms-products/           # Microservicio de productos (puerto 3002)
│   │   ├── proto/             # Definiciones gRPC (.proto)
│   │   └── src/
│   │       ├── products/      # CRUD de productos + ajuste de stock
│   │       ├── categories/    # CRUD de categorías
│   │       ├── kafka/         # Productor de eventos
│   │       ├── metrics/       # Métricas de negocio
│   │       └── common/        # Middleware HTTP metrics
│   │
│   ├── ms-sales/              # Microservicio de ventas (puerto 3003)
│   │   ├── proto/             # Definiciones gRPC de ms-products y ms-users
│   │   └── src/
│   │       ├── sales/         # CRUD de ventas
│   │       ├── purchases/     # CRUD de compras
│   │       ├── grpc-clients/  # Clientes gRPC para ms-products y ms-users
│   │       ├── kafka/         # Productor de eventos
│   │       ├── metrics/       # Métricas de negocio
│   │       └── common/        # Middleware HTTP metrics
│   │
│   └── ms-logs/               # Microservicio de logs (puerto 3004)  
│       └── src/
│           ├── logs/          # Consumidor Kafka + persistencia en Postgres + push a Loki
│           ├── metrics/       # Métricas Prometheus
│           └── common/        # Middleware HTTP metrics
│
├── frontend/                  # Panel de administración Next.js (puerto 3007)
│   ├── app/                   # App Router: rutas y API routes (BFF)
│   ├── components/            # Componentes UI (Tailwind)
│   └── lib/                   # Lógica de cliente, sesión y proxy
│
├── infra/
│   ├── prometheus/            # Configuración de scraping
│   ├── loki/                  # Configuración de Loki
│   └── grafana/               # Datasources y dashboards
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerrequisitos

- Node.js >= 18
- Docker y Docker Compose
- PostgreSQL (una instancia, con bases de datos creadas por separado)

## Inicio Rápido

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de Postgres
```

### 2. Levantar infraestructura

```bash
docker compose up -d
```

### 3. Crear bases de datos en Postgres

```sql
CREATE DATABASE db_users;
CREATE DATABASE db_products;
CREATE DATABASE db_sales;
CREATE DATABASE db_logs;
```

### 4. Instalar y ejecutar microservicios

```bash
# api-gateway (puerto 3000)
cd backend/api-gateway
cp .env.example .env  # Configurar JWT_SECRET
npm install
npm run start:dev

# ms-users (puerto 3001)
cd backend/ms-users
cp .env.example .env  # Configurar DB_NAME=db_users
npm install
npm run start:dev

# ms-products (puerto 3002)
cd backend/ms-products
cp .env.example .env  # Configurar DB_NAME=products_db
npm install
npm run start:dev

# ms-sales (puerto 3003)
cd backend/ms-sales
cp .env.example .env  # Configurar DB_NAME=sales_db
npm install
npm run start:dev

# ms-logs (puerto 3004)
cd backend/ms-logs
cp .env.example .env  # Configurar DB_NAME=db_logs
npm install
npm run start:dev
```

### 5. Instalar y ejecutar frontend

```bash
cd frontend
cp .env.example .env.local  # API_GATEWAY_URL y JWT_SECRET (igual al del api-gateway)
pnpm install
pnpm dev   # http://localhost:3007
```

> Requiere el `api-gateway` (puerto 3000) levantado y `JWT_SECRET` coincidiendo con el del gateway. Detalles en [`frontend/README.md`](frontend/README.md).

## Endpoints

### api-gateway (puerto 3000)

El gateway valida JWT y reenvía las peticiones a cada microservicio.

| Método | Ruta | Microservicio destino | Descripción |
|--------|------|----------------------|-------------|
| POST | `/auth/login` | ms-users | Iniciar sesión |
| POST | `/auth/register` | ms-users | Registrar usuario |
| GET | `/users` | ms-users | Listar usuarios |
| GET | `/users/:id` | ms-users | Obtener usuario |
| POST | `/users` | ms-users | Crear usuario |
| PATCH | `/users/:id` | ms-users | Actualizar usuario |
| PATCH | `/users/:id/password` | ms-users | Cambiar contraseña |
| DELETE | `/users/:id` | ms-users | Eliminar usuario |
| GET | `/roles` | ms-users | Listar roles |
| POST | `/roles` | ms-users | Crear rol |
| PATCH | `/roles/:id` | ms-users | Actualizar rol |
| DELETE | `/roles/:id` | ms-users | Eliminar rol |
| GET | `/products` | ms-products | Listar productos |
| GET | `/products/:id` | ms-products | Obtener producto |
| POST | `/products` | ms-products | Crear producto |
| PATCH | `/products/:id` | ms-products | Actualizar producto |
| PATCH | `/products/:id/stock` | ms-products | Ajustar stock |
| DELETE | `/products/:id` | ms-products | Eliminar producto |
| GET | `/categories` | ms-products | Listar categorías |
| GET | `/categories/:id` | ms-products | Obtener categoría |
| POST | `/categories` | ms-products | Crear categoría |
| PATCH | `/categories/:id` | ms-products | Actualizar categoría |
| DELETE | `/categories/:id` | ms-products | Eliminar categoría |
| GET | `/sales` | ms-sales | Listar ventas |
| GET | `/sales/:id` | ms-sales | Obtener venta |
| POST | `/sales` | ms-sales | Crear venta |
| GET | `/purchases` | ms-sales | Listar compras |
| GET | `/purchases/:id` | ms-sales | Obtener compra |
| POST | `/purchases` | ms-sales | Crear compra |
| GET | `/health` | - | Health check |

### ms-users (puerto 3001)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/users` | Listar usuarios |
| GET | `/users/:id` | Obtener usuario |
| POST | `/users` | Crear usuario |
| PATCH | `/users/:id` | Actualizar usuario |
| PATCH | `/users/:id/password` | Cambiar contraseña |
| DELETE | `/users/:id` | Eliminar usuario |
| GET | `/roles` | Listar roles |
| POST | `/roles` | Crear rol |
| PATCH | `/roles/:id` | Actualizar rol |
| DELETE | `/roles/:id` | Eliminar rol |
| GET | `/metrics` | Métricas Prometheus |

### ms-products (puerto 3002)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Listar productos |
| GET | `/products/:id` | Obtener producto |
| POST | `/products` | Crear producto |
| PATCH | `/products/:id` | Actualizar producto |
| PATCH | `/products/:id/stock` | Ajustar stock |
| DELETE | `/products/:id` | Eliminar producto |
| GET | `/categories` | Listar categorías |
| GET | `/categories/:id` | Obtener categoría |
| POST | `/categories` | Crear categoría |
| PATCH | `/categories/:id` | Actualizar categoría |
| DELETE | `/categories/:id` | Eliminar categoría |
| GET | `/metrics` | Métricas Prometheus |

**gRPC** (puerto 5002): Servicio `products` (definido en `proto/products.proto`)

### ms-sales (puerto 3003)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/sales` | Listar ventas |
| GET | `/sales/:id` | Obtener venta |
| POST | `/sales` | Crear venta |
| GET | `/purchases` | Listar compras |
| GET | `/purchases/:id` | Obtener compra |
| POST | `/purchases` | Crear compra |
| GET | `/metrics` | Métricas Prometheus |

**Clientes gRPC consumidos**:
- `ms-products` (localhost:5002) — para validar productos
- `ms-users` (localhost:5001) — para validar usuarios

### ms-logs (puerto 3004)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/logs?limit=50&offset=0` | Consultar logs (máx 200) |
| GET | `/metrics` | Métricas Prometheus |

**Kafka Consumer**: Escucha tópico `gateway.access.logs`

## Usuarios de Demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@demo.com | Password123! | admin (todos los permisos) |
| vendedor@demo.com | Password123! | vendedor (ventas + lectura) |

## Eventos Kafka

| Tópico | Productor | Consumidor | Descripción |
|--------|-----------|------------|-------------|
| `gateway.access.logs` | api-gateway | ms-logs | Logs de acceso HTTP del gateway |

## Comunicación entre Servicios

### HTTP (Proxy)
- `api-gateway` → `ms-users` (puerto 3001)
- `api-gateway` → `ms-products` (puerto 3002)
- `api-gateway` → `ms-sales` (puerto 3003)

### gRPC
- `ms-sales` → `ms-users` (puerto 5001) — Validación de usuarios
- `ms-sales` → `ms-products` (puerto 5002) — Validación de productos

### Kafka
- `api-gateway` → `ms-logs` — Envío de logs de acceso

## Observabilidad

### Métricas Prometheus

Los microservicios exponen métricas en `/metrics`:

**Métricas HTTP (todos los servicios)**:
- `http_requests_total` — Peticiones HTTP por método, ruta y estado
- `http_request_duration_seconds` — Duración de peticiones (histograma)

**Métricas de negocio (ms-logs)**:
- `logs_received_total` — Logs recibidos desde el gateway
- `logs_persisted_total` — Logs persistidos en Postgres
- `logs_loki_push_failures_total` — Fallos al enviar a Loki

### Dashboards Grafana

- **URL**: http://localhost:3006 (admin/admin)
- **Datasources**: Prometheus y Loki preconfigurados

### Acceso a servicios

| Servicio | URL |
|----------|-----|
| Kafka UI | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3006 |

## Comandos Útiles

```bash
# Levantar infraestructura
docker compose up -d

# Ver estado
docker compose ps

# Ver logs de un servicio
docker compose logs -f kafka

# Apagar conservando datos
docker compose down

# Apagar y borrar datos
docker compose down -v
```

## Resiliencia (api-gateway)

El gateway incorpora patrones de tolerancia a fallos ante caídas de los microservicios:

### Circuit Breaker
- Basado en [opossum](https://www.npmjs.com/package/opossum), un breaker por servicio.
- **Estados**: `closed` (normal) → `open` (fail fast, reject inmediato con 502) → `half-open` (prueba de recuperación).
- Solo los errores de red y los status `503/504` abren el circuito; los `4xx` no cuentan.
- Umbral: 50% de fallos en las últimas 5 peticiones (configurable).
- Reset: 30s (configurable).

### Retry con backoff exponencial
- Reintentos solo en errores de red y status `503/504` (nunca en `4xx`).
- Configuración por defecto: 3 intentos con delays `1s, 2s, 4s`.

### Timeout configurable
- Timeout por defecto: 5s (reducido desde los 10s fijos).
- Override por servicio con `TIMEOUT_<SERVICIO>`.

### Health Checks
- `GET /health` en el gateway verifica `ms-users`, `ms-products` y `ms-sales` (ping a `/health` de cada uno con timeout de 3s).
- Cada microservicio expone su propio `GET /health`.

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `RETRY_MAX` | `3` | Intentos máximos por petición |
| `RETRY_BASE_DELAY` | `1000` | Delay base del backoff (ms) |
| `TIMEOUT` | `5000` | Timeout HTTP hacia microservicios (ms) |
| `CB_TIMEOUT` | `5000` | Timeout del circuit breaker (ms) |
| `CB_ERROR_THRESHOLD` | `50` | % de fallos para abrir el circuito |
| `CB_RESET_TIMEOUT` | `30000` | Tiempo hasta half-open (ms) |

Todas soportan override por servicio con sufijo: `RETRY_MAX_USERS`, `TIMEOUT_PRODUCTS`, `CB_RESET_TIMEOUT_SALES`, etc.

## Notas

- Se usa la imagen oficial `apache/kafka` (no Bitnami) ya que Bitnami cerró su catálogo público en agosto de 2025.
- `synchronize: true` en TypeORM está habilitado solo para desarrollo (no usar en producción).
- Los microservicios corren en el host (fuera de Docker), la infraestructura corre en contenedores.
- `ms-products` es un servicio híbrido: expone HTTP (puerto 3002) y gRPC (puerto 5002).
- `ms-sales` consume gRPC de `ms-products` y `ms-users` para validar datos antes de crear ventas/compras.
- `api-gateway` valida JWT en todas las rutas excepto `/auth/login` y `/auth/register`.
- El gateway inyecta headers `x-user-id` y `x-user-email` al reenviar peticiones a los microservicios.
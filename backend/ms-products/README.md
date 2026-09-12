# ms-products

Microservicio NestJS responsable de **productos** y **categorías**.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/categories` | Crear categoría |
| GET | `/categories` | Listar categorías |
| GET | `/categories/:id` | Detalle |
| PATCH | `/categories/:id` | Actualizar |
| DELETE | `/categories/:id` | Eliminar |
| POST | `/products` | Crear producto |
| GET | `/products` | Listar productos |
| GET | `/products/:id` | Detalle |
| PATCH | `/products/:id` | Actualizar |
| PATCH | `/products/:id/stock` | Ajustar stock (`{ "quantity": -2 }`) |
| DELETE | `/products/:id` | Eliminar |

## Eventos publicados (Kafka)

Tópico `product-events`:
- `product.created`
- `product.updated`
- `product.stock_changed` — lo consumirá `ms-sales` (o lo dispara `ms-sales` al confirmar una venta)

## Cómo correrlo

```bash
npm install
cp .env.example .env      # ajusta DB_HOST/USER/PASSWORD/NAME y KAFKA_BROKER
npm run start:dev
```

Requiere:
- Postgres con la base `products_db` ya creada (la tabla se crea sola gracias a `synchronize: true`, solo para desarrollo).
- Kafka corriendo (ver `docker-compose.yml` del paso 1) — si Kafka no está disponible, el servicio igual funciona; solo se loguea el error al publicar eventos.

## Probar rápido

```bash
curl -X POST http://localhost:3002/categories -H "Content-Type: application/json" -d '{"name":"Bebidas"}'

curl -X POST http://localhost:3002/products -H "Content-Type: application/json" \
  -d '{"sku":"BEB-001","name":"Coca-Cola 500ml","price":8.5,"stock":100}'
```

# ms-sales

Microservicio NestJS responsable de **compras** y **ventas**. Es el orquestador:
antes de confirmar cualquier operación, valida contra los otros dos microservicios
**vía gRPC** (síncrono).

## Flujo de una venta (`POST /sales`)

1. `ValidateClient` (gRPC → `ms-users`, puerto 5001): confirma que el cliente existe.
2. `GetProduct` (gRPC → `ms-products`, puerto 5002) por cada línea: confirma que el
   producto existe y que hay stock suficiente, y captura el precio vigente.
3. Si todo es válido, `AdjustStock` (gRPC → `ms-products`) descuenta el stock de
   cada producto.
4. Se guarda la venta con status `COMPLETED` y se emite el evento `sale.completed`
   a Kafka (tópico `sale-events`) — solo para trazabilidad/observabilidad, nadie
   lo consume todavía.

El flujo de `POST /purchases` es simétrico, pero **repone** stock (`AdjustStock`
con cantidad positiva) en vez de descontarlo.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/sales` | Crear venta (valida cliente y stock vía gRPC) |
| GET | `/sales` | Listar ventas |
| GET | `/sales/:id` | Detalle de una venta |
| POST | `/purchases` | Registrar compra (repone stock vía gRPC) |
| GET | `/purchases` | Listar compras |
| GET | `/purchases/:id` | Detalle de una compra |

## ⚠️ Limitación conocida (a propósito, para la siguiente iteración)

Si al descontar stock de varios productos una línea falla a mitad de camino,
las líneas anteriores **ya quedaron descontadas** en `ms-products` — no hay
rollback automático. Esto es el problema clásico de transacciones distribuidas.
La solución correcta es un **patrón Saga con compensación** (si `AdjustStock`
falla, se llama de nuevo con la cantidad inversa para las líneas ya aplicadas,
o se marca la venta como `CANCELLED` y se dispara un evento de compensación).
Lo dejamos señalado en el código (`sales.service.ts`) como el siguiente paso
natural una vez el flujo feliz esté probado.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # ajusta DB_* y las URLs gRPC si no usas los puertos por defecto
npm run start:dev
```

Corre en el puerto **3003**. Requiere:
- La base `sales_db` ya creada en tu Postgres.
- `ms-products` corriendo (HTTP :3002 / gRPC :5002).
- `ms-users` corriendo (HTTP :3001 / gRPC :5001).
- Kafka arriba (solo para el evento de trazabilidad; si no está disponible, la venta igual se completa).

## Probar rápido (flujo completo)

```bash
# 1. Crear cliente en ms-users
curl -X POST http://localhost:3001/clients -H "Content-Type: application/json" \
  -d '{"documentNumber":"12345678","fullName":"Juan Cliente"}'

# 2. Crear producto en ms-products
curl -X POST http://localhost:3002/products -H "Content-Type: application/json" \
  -d '{"sku":"BEB-001","name":"Coca-Cola 500ml","price":8.5,"stock":100}'

# 3. Crear la venta en ms-sales (usa los IDs devueltos arriba)
curl -X POST http://localhost:3003/sales -H "Content-Type: application/json" \
  -d '{"clientId":"<id-cliente>","items":[{"productId":"<id-producto>","quantity":2}]}'

# 4. Verificar que el stock bajó en ms-products
curl http://localhost:3002/products/<id-producto>
```

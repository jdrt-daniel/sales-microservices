const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3000';
const EMAIL_ADMIN = process.env.SEED_ADMIN_EMAIL || 'admin@demo.com';
const EMAIL_VENDEDOR = process.env.SEED_VENDEDOR_EMAIL || 'vendedor@demo.com';
const PASSWORD = process.env.SEED_PASSWORD || 'Password123!';

const failures = [];

async function api(method, path, body, token) {
  const res = await fetch(GATEWAY + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function step(name, fn) {
  return async (...args) => {
    process.stdout.write(`  - ${name} ... `);
    try {
      const result = await fn(...args);
      console.log('OK');
      return result;
    } catch (err) {
      console.log(`FALLÓ (${err.status ?? 'error'})`);
      console.log(`    ${err.message}`);
      failures.push(name);
      return null;
    }
  };
}

async function getOrCreate(path, uniqueField, item, token) {
  const list = await api('GET', path, null, token);
  if (!Array.isArray(list)) throw new Error(`GET ${path} no devolvió un arreglo: ${JSON.stringify(list)}`);
  const existing = list.find((x) => String(x[uniqueField]) === String(item[uniqueField]));
  if (existing) return existing;
  return api('POST', path, item, token);
}

async function auth(email, fullName) {
  try {
    const reg = await api('POST', '/auth/register', { email, password: PASSWORD, fullName });
    return reg.accessToken;
  } catch (err) {
    if (err.status === 409) {
      const login = await api('POST', '/auth/login', { email, password: PASSWORD });
      return login.accessToken;
    }
    throw err;
  }
}

async function main() {
  console.log(`Gateway: ${GATEWAY}\n`);

  // 1) Autenticación
  console.log('=== 1. Autenticación ===');
  const adminToken = await step('login/register admin', auth)(EMAIL_ADMIN, 'Administrador Demo');
  const vendedorToken = await step('login/register vendedor', auth)(EMAIL_VENDEDOR, 'Vendedor Demo');
  if (!adminToken || !vendedorToken) {
    console.log('\nNo se pudo autenticar. Abortando.');
    process.exit(1);
  }

  // 2) Permisos (idempotente por nombre)
  console.log('\n=== 2. Permisos ===');
  const PERMISOS = [
    ['products.create', 'products'], ['products.read', 'products'],
    ['products.update', 'products'], ['products.delete', 'products'],
    ['categories.create', 'categories'], ['categories.read', 'categories'],
    ['categories.update', 'categories'], ['categories.delete', 'categories'],
    ['sales.create', 'sales'], ['sales.read', 'sales'],
    ['purchases.create', 'purchases'], ['purchases.read', 'purchases'],
    ['users.create', 'users'], ['users.read', 'users'],
    ['clients.create', 'clients'], ['clients.read', 'clients'],
  ];
  const permIds = {};
  for (const [name, resource] of PERMISOS) {
    const perm = await step(`get-or-create permiso ${name}`, () =>
      getOrCreate('/permissions', 'name', { name, resource }, adminToken),
    )();
    if (perm) permIds[name] = perm.id;
  }

  // 3) Roles (idempotente por nombre)
  console.log('\n=== 3. Roles ===');
  const adminRole = await step('get-or-create rol admin', () =>
    getOrCreate('/roles', 'name', {
      name: 'admin',
      description: 'Acceso total',
      permissionIds: Object.values(permIds),
    }, adminToken),
  )();

  let vendedorRole = null;
  if (permIds['sales.create'] && permIds['sales.read'] && permIds['products.read']) {
    vendedorRole = await step('get-or-create rol vendedor', () =>
      getOrCreate('/roles', 'name', {
        name: 'vendedor',
        description: 'Ventas y lectura de productos',
        permissionIds: [
          permIds['sales.create'], permIds['sales.read'],
          permIds['products.read'], permIds['clients.read'],
        ].filter(Boolean),
      }, adminToken),
    )();
  } else {
    console.log('  - get-or-create rol vendedor ... (SKIP: faltan permisos)');
    failures.push('crear rol vendedor');
  }

  // 4) Asignar roles a usuarios
  console.log('\n=== 4. Asignación de roles ===');
  const users = await step('listar usuarios', () => api('GET', '/users', null, adminToken))();
  if (users && users.length) {
    const adminUser = users.find((u) => u.email.toLowerCase() === EMAIL_ADMIN.toLowerCase());
    const vendedorUser = users.find((u) => u.email.toLowerCase() === EMAIL_VENDEDOR.toLowerCase());
    if (adminRole && adminUser) {
      await step('asignar rol admin', async () =>
        api('PATCH', `/users/${adminUser.id}`, { roleIds: [adminRole.id] }, adminToken),
      )();
    }
    if (vendedorRole && vendedorUser) {
      await step('asignar rol vendedor', async () =>
        api('PATCH', `/users/${vendedorUser.id}`, { roleIds: [vendedorRole.id] }, adminToken),
      )();
    }
  }

  // 5) Clientes (idempotente por documentNumber)
  console.log('\n=== 5. Clientes ===');
  const clientes = [
    { documentNumber: '12345678', fullName: 'Juan Pérez', email: 'juan@mail.com', phone: '999111222', address: 'Av. Lima 123' },
    { documentNumber: '87654321', fullName: 'María López', email: 'maria@mail.com', phone: '999333444', address: 'Jr. Ica 456' },
    { documentNumber: '11223344', fullName: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '999555666', address: 'Calle Piura 789' },
  ];
  const clientIds = [];
  for (const c of clientes) {
    const client = await step(`get-or-create cliente ${c.fullName}`, () =>
      getOrCreate('/clients', 'documentNumber', c, adminToken),
    )();
    if (client) clientIds.push(client.id);
  }

  // 6) Categorías (idempotente por nombre)
  console.log('\n=== 6. Categorías ===');
  const categorias = ['Bebidas', 'Gaseosas', 'Snacks'];
  const catIds = {};
  for (const name of categorias) {
    const cat = await step(`get-or-create categoría ${name}`, () =>
      getOrCreate('/categories', 'name', { name }, adminToken),
    )();
    if (cat) catIds[name] = cat.id;
  }

  // 7) Productos (idempotente por sku)
  console.log('\n=== 7. Productos ===');
  const productos = [
    { sku: 'BEB-001', name: 'Coca-Cola 500ml', price: 8.5, stock: 100, categoryId: catIds['Bebidas'] },
    { sku: 'BEB-002', name: 'Sprite 500ml', price: 7.5, stock: 80, categoryId: catIds['Bebidas'] },
    { sku: 'GAS-001', name: 'Agua San Luis 1L', price: 5.0, stock: 150, categoryId: catIds['Gaseosas'] },
    { sku: 'SNK-001', name: 'Doritos 110g', price: 6.0, stock: 60, categoryId: catIds['Snacks'] },
    { sku: 'SNK-002', name: 'Papas Lays 90g', price: 5.5, stock: 70, categoryId: catIds['Snacks'] },
  ];
  const productIds = [];
  for (const p of productos) {
    const prod = await step(`get-or-create producto ${p.name}`, () =>
      getOrCreate('/products', 'sku', p, vendedorToken),
    )();
    if (prod) productIds.push(prod.id);
  }

  // 8) Venta de prueba (flujo completo: valida cliente + stock via gRPC)
  console.log('\n=== 8. Venta de prueba ===');
  if (clientIds.length >= 1 && productIds.length >= 2) {
    await step('crear venta (valida cliente + stock via gRPC)', async () => {
      const output = await api('POST', '/sales', {
        clientId: clientIds[0],
        items: [
          { productId: productIds[0], quantity: 2 },
          { productId: productIds[1], quantity: 1 },
        ],
      }, vendedorToken);
      console.log(`      total: ${output.total}, status: ${output.status}, id: ${output.id}`);
      return output;
    })();
  } else {
    console.log('  - crear venta ... (SKIP: faltan clientes o productos)');
  }

  // 9) Compra de prueba (repone stock via gRPC)
  console.log('\n=== 9. Compra de prueba ===');
  if (productIds.length >= 1) {
    await step('crear compra (reponer stock via gRPC)', async () => {
      const output = await api('POST', '/purchases', {
        supplierId: '8a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a11',
        items: [
          { productId: productIds[0], quantity: 50, unitCost: 4.0 },
        ],
      }, vendedorToken);
      console.log(`      total: ${output.total}, status: ${output.status}, id: ${output.id}`);
      return output;
    })();
  } else {
    console.log('  - crear compra ... (SKIP: faltan productos)');
  }

  // 10) Comprobación final
  console.log('\n=== 10. Resumen ===');
  if (failures.length) {
    console.log(`PASOS CON FALLO: ${failures.length}`);
    failures.forEach((f) => console.log(`  - ${f}`));
  } else {
    console.log('Todos los pasos completados sin errores.');
  }
  console.log('\nCredenciales de prueba:');
  console.log(`  Admin:    ${EMAIL_ADMIN} / ${PASSWORD}`);
  console.log(`  Vendedor: ${EMAIL_VENDEDOR} / ${PASSWORD}`);
  console.log(`\nGateway:   ${GATEWAY}`);
  console.log(`Swagger:   ${GATEWAY}/docs`);
}

main().catch((err) => {
  console.error('Error fatal del seed:', err.message);
  process.exit(1);
});
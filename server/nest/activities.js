// Catálogo de actividades de NestJS. Cada actividad arranca el AppModule del usuario con Nest real
// y ejecuta sus pruebas en orden sobre la misma app (comparten estado, como un cliente real).
//
// Prueba HTTP:  { name, req: { method, path, body?, headers? }, expect: { status, body? | match? }, save? }
// Prueba directa a un proveedor: { name, call: { provider, method, args? }, expect: { value? | match? | throws? } }
//   body  → el cuerpo debe ser exactamente ese valor.
//   match → el cuerpo debe contener al menos esas propiedades (sirve para respuestas con campos extra).
//   Comodines dentro de body/match: '<string>', '<number>', '<any>'.
//   save: { variable: 'ruta.en.el.cuerpo' } guarda un valor para usarlo después como {{variable}}.

const GET = (path, headers) => ({ method: 'GET', path, ...(headers && { headers }) });
const POST = (path, body, headers) => ({ method: 'POST', path, body, ...(headers && { headers }) });
const PATCH = (path, body) => ({ method: 'PATCH', path, body });
const DELETE = (path) => ({ method: 'DELETE', path });

const raw = [
  // ───────────────────────────── FÁCILES ─────────────────────────────
  {
    id: 'hola-nest',
    title: 'Hola, Nest',
    difficulty: 'facil',
    category: 'Controladores',
    lessons: ['nest-intro', 'nest-controladores'],
    description: 'Crea tu primer controlador. <code>SaludoController</code> responde en la ruta <code>/saludo</code> con un mensaje en JSON, y en <code>/saludo/:nombre</code> saluda a la persona que llega en la URL. No olvides registrarlo en <code>AppModule</code>.',
    hints: [
      'El prefijo de las rutas va en <code>@Controller(\'saludo\')</code>, y cada método lleva su verbo: <code>@Get()</code> o <code>@Get(\':nombre\')</code>.',
      'Lee el parámetro de la ruta con <code>@Param(\'nombre\') nombre: string</code>. Devuelve un objeto y Nest lo convierte en JSON.',
    ],
    starter: `import { Controller, Get, Module, Param } from '@nestjs/common';

// 1. Crea SaludoController con el prefijo 'saludo'.
//    GET /saludo          → { mensaje: 'Hola, Nest' }
//    GET /saludo/:nombre  → { mensaje: 'Hola, <nombre>' }

@Module({
  controllers: [], // 2. Registra aquí tu controlador
})
export class AppModule {}
`,
    tests: [
      { name: 'Saludo general', req: GET('/saludo'), expect: { status: 200, body: { mensaje: 'Hola, Nest' } } },
      { name: 'Saludo con nombre', req: GET('/saludo/Ana'), expect: { status: 200, body: { mensaje: 'Hola, Ana' } } },
      { name: 'Funciona con cualquier nombre', req: GET('/saludo/Luis'), expect: { status: 200, body: { mensaje: 'Hola, Luis' } } },
    ],
  },
  {
    id: 'calculadora-query',
    title: 'Calculadora con query params',
    difficulty: 'facil',
    category: 'Controladores',
    lessons: ['nest-controladores', 'nest-ciclo'],
    description: 'Crea <code>CalculadoraController</code> en <code>/calculadora</code> con dos rutas que leen los números de la <b>query string</b>: <code>GET /calculadora/sumar?a=2&amp;b=3</code> → <code>{ "resultado": 5 }</code> y <code>GET /calculadora/multiplicar?a=4&amp;b=5</code> → <code>{ "resultado": 20 }</code>. Los parámetros llegan como texto: conviértelos con un pipe para que un valor que no sea número responda <b>400</b>.',
    hints: [
      'Los parámetros de la query se leen con <code>@Query(\'a\')</code>. Sin conversión, <code>"2" + "3"</code> da <code>"23"</code>.',
      '<code>@Query(\'a\', ParseIntPipe) a: number</code> convierte el texto en número y responde 400 automáticamente si no puede.',
    ],
    starter: `import { Controller, Get, Module, Query, ParseIntPipe } from '@nestjs/common';

// CalculadoraController con el prefijo 'calculadora':
//   GET /calculadora/sumar?a=2&b=3        → { resultado: 5 }
//   GET /calculadora/multiplicar?a=4&b=5  → { resultado: 20 }
//   Si a o b no son números enteros       → 400 Bad Request

@Module({
  controllers: [],
})
export class AppModule {}
`,
    tests: [
      { name: 'Suma dos números', req: GET('/calculadora/sumar?a=2&b=3'), expect: { status: 200, body: { resultado: 5 } } },
      { name: 'Suma con negativos', req: GET('/calculadora/sumar?a=-4&b=10'), expect: { status: 200, body: { resultado: 6 } } },
      { name: 'Multiplica', req: GET('/calculadora/multiplicar?a=4&b=5'), expect: { status: 200, body: { resultado: 20 } } },
      { name: 'Rechaza texto que no es número', req: GET('/calculadora/sumar?a=dos&b=3'), expect: { status: 400 } },
    ],
  },
  {
    id: 'contador-servicio',
    title: 'Un contador compartido',
    difficulty: 'facil',
    category: 'Proveedores',
    lessons: ['nest-proveedores'],
    description: 'Separa la lógica en un <b>servicio</b>. <code>ContadorService</code> guarda un número y sabe leerlo, incrementarlo y reiniciarlo. <code>ContadorController</code> lo recibe por inyección de dependencias y expone <code>GET /contador</code>, <code>POST /contador/incrementar</code> y <code>POST /contador/reiniciar</code>. Todas responden <code>{ "valor": n }</code>. Reiniciar debe responder <b>200</b> en vez del 201 que usa <code>@Post</code> por defecto.',
    hints: [
      'Marca el servicio con <code>@Injectable()</code>, añádelo a <code>providers</code> y pídelo en el constructor del controlador: <code>constructor(private readonly contador: ContadorService) {}</code>.',
      'Nest crea una sola instancia del servicio para toda la app: por eso el valor se conserva entre peticiones. Para el código de estado usa <code>@HttpCode(200)</code>.',
    ],
    starter: `import { Controller, Get, Post, HttpCode, Injectable, Module } from '@nestjs/common';

@Injectable()
export class ContadorService {
  private valor = 0;

  // leer(), incrementar() y reiniciar() devuelven el valor actual
}

@Controller('contador')
export class ContadorController {
  // Inyecta ContadorService en el constructor
}

@Module({
  controllers: [ContadorController],
  providers: [],
})
export class AppModule {}
`,
    tests: [
      { name: 'Empieza en 0', req: GET('/contador'), expect: { status: 200, body: { valor: 0 } } },
      { name: 'Incrementa', req: POST('/contador/incrementar'), expect: { status: 201, body: { valor: 1 } } },
      { name: 'Conserva el valor entre peticiones', req: POST('/contador/incrementar'), expect: { status: 201, body: { valor: 2 } } },
      { name: 'El servicio es una única instancia', call: { provider: 'ContadorService', method: 'leer' }, expect: { value: 2 } },
      { name: 'Reiniciar responde 200', req: POST('/contador/reiniciar'), expect: { status: 200, body: { valor: 0 } } },
    ],
  },

  // ───────────────────────────── MEDIAS ─────────────────────────────
  {
    id: 'crud-tareas',
    title: 'CRUD de tareas',
    difficulty: 'medio',
    category: 'Controladores',
    lessons: ['nest-controladores', 'nest-proveedores', 'nest-errores'],
    description: 'Construye una API completa en memoria. <code>TareasService</code> guarda las tareas (<code>{ id, titulo, hecha }</code>, con ids desde 1) y <code>TareasController</code> expone:<br><code>GET /tareas</code> · <code>POST /tareas</code> (crea con <code>hecha: false</code>) · <code>GET /tareas/:id</code> · <code>PATCH /tareas/:id</code> (cambia solo lo que llega) · <code>DELETE /tareas/:id</code> (responde <b>204</b> sin cuerpo).<br>Si una tarea no existe, responde <b>404</b>.',
    hints: [
      'El <code>id</code> de la URL es texto: usa <code>@Param(\'id\', ParseIntPipe) id: number</code> para compararlo con los ids numéricos.',
      'Lanza <code>new NotFoundException()</code> desde el servicio cuando no encuentres la tarea: Nest lo convierte en una respuesta 404.',
      'Para borrar sin cuerpo usa <code>@HttpCode(204)</code> en el método <code>@Delete(\':id\')</code>. Para actualizar, <code>Object.assign(tarea, cambios)</code>.',
    ],
    starter: `import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

export interface Tarea {
  id: number;
  titulo: string;
  hecha: boolean;
}

@Injectable()
export class TareasService {
  private tareas: Tarea[] = [];
  private siguienteId = 1;

  // todas(), crear(titulo), buscar(id), actualizar(id, cambios), borrar(id)
}

@Controller('tareas')
export class TareasController {
  constructor(private readonly tareas: TareasService) {}

  // GET /tareas, POST /tareas, GET /tareas/:id, PATCH /tareas/:id, DELETE /tareas/:id
}

@Module({
  controllers: [TareasController],
  providers: [TareasService],
})
export class AppModule {}
`,
    tests: [
      { name: 'Al inicio no hay tareas', req: GET('/tareas'), expect: { status: 200, body: [] } },
      { name: 'Crea una tarea', req: POST('/tareas', { titulo: 'Leer' }), expect: { status: 201, body: { id: 1, titulo: 'Leer', hecha: false } } },
      { name: 'Crea otra con el siguiente id', req: POST('/tareas', { titulo: 'Programar' }), expect: { status: 201, body: { id: 2, titulo: 'Programar', hecha: false } } },
      { name: 'Lista todas', req: GET('/tareas'), expect: { status: 200, body: [{ id: 1, titulo: 'Leer', hecha: false }, { id: 2, titulo: 'Programar', hecha: false }] } },
      { name: 'Busca por id', req: GET('/tareas/2'), expect: { status: 200, body: { id: 2, titulo: 'Programar', hecha: false } } },
      { name: '404 si no existe', req: GET('/tareas/99'), expect: { status: 404 } },
      { name: 'Actualiza parcialmente', req: PATCH('/tareas/1', { hecha: true }), expect: { status: 200, body: { id: 1, titulo: 'Leer', hecha: true } } },
      { name: 'Borra con 204', req: DELETE('/tareas/1'), expect: { status: 204 } },
      { name: 'La tarea borrada ya no aparece', req: GET('/tareas'), expect: { status: 200, body: [{ id: 2, titulo: 'Programar', hecha: false }] } },
      { name: 'Borrar algo inexistente da 404', req: DELETE('/tareas/1'), expect: { status: 404 } },
    ],
  },
  {
    id: 'validacion-dto',
    title: 'Registro con validación',
    difficulty: 'medio',
    category: 'Validación',
    lessons: ['nest-validacion'],
    description: 'Crea <code>POST /usuarios</code> que recibe un <code>CrearUsuarioDto</code> y <code>GET /usuarios</code> que lista los registrados. Reglas: <code>nombre</code> texto de al menos 3 letras, <code>email</code> con formato válido y <code>edad</code> entero mayor o igual a 18. Cualquier dato inválido, o una propiedad que no esté en el DTO, debe responder <b>400</b> y no guardarse. Activa la validación en la función <code>configurar(app)</code>.',
    hints: [
      'Decora cada propiedad del DTO: <code>@IsString() @MinLength(3)</code>, <code>@IsEmail()</code>, <code>@IsInt() @Min(18)</code> (vienen de <code>class-validator</code>).',
      'Los decoradores no hacen nada sin <code>ValidationPipe</code>: en <code>configurar</code> llama a <code>app.useGlobalPipes(new ValidationPipe({ ... }))</code>.',
      'Para rechazar propiedades desconocidas usa las opciones <code>whitelist: true</code> y <code>forbidNonWhitelisted: true</code>.',
    ],
    starter: `import { Body, Controller, Get, INestApplication, Module, Post, ValidationPipe } from '@nestjs/common';
import { IsEmail, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  nombre: string;
  email: string;
  edad: number;
}

@Controller('usuarios')
export class UsuariosController {
  private usuarios: (CrearUsuarioDto & { id: number })[] = [];

  // POST /usuarios → 201 { id, nombre, email, edad }
  // GET  /usuarios → la lista
}

@Module({
  controllers: [UsuariosController],
})
export class AppModule {}

// CodeRush llama a esta función antes de arrancar (como harías en main.ts)
export function configurar(app: INestApplication) {
}
`,
    tests: [
      { name: 'Registra un usuario válido', req: POST('/usuarios', { nombre: 'Ana', email: 'ana@correo.com', edad: 30 }), expect: { status: 201, body: { id: 1, nombre: 'Ana', email: 'ana@correo.com', edad: 30 } } },
      { name: 'Rechaza un email inválido', req: POST('/usuarios', { nombre: 'Luis', email: 'luis-correo', edad: 25 }), expect: { status: 400 } },
      { name: 'Rechaza un nombre corto', req: POST('/usuarios', { nombre: 'Al', email: 'al@correo.com', edad: 25 }), expect: { status: 400 } },
      { name: 'Rechaza menores de 18', req: POST('/usuarios', { nombre: 'Sofía', email: 'sofia@correo.com', edad: 15 }), expect: { status: 400 } },
      { name: 'Rechaza la edad como texto', req: POST('/usuarios', { nombre: 'Marta', email: 'marta@correo.com', edad: '30' }), expect: { status: 400 } },
      { name: 'Rechaza propiedades extra', req: POST('/usuarios', { nombre: 'Pedro', email: 'pedro@correo.com', edad: 40, rol: 'admin' }), expect: { status: 400 } },
      { name: 'Solo se guardó el válido', req: GET('/usuarios'), expect: { status: 200, body: [{ id: 1, nombre: 'Ana', email: 'ana@correo.com', edad: 30 }] } },
    ],
  },
  {
    id: 'modulos-pedidos',
    title: 'Módulos que colaboran',
    difficulty: 'medio',
    category: 'Módulos',
    lessons: ['nest-modulos', 'nest-proveedores'],
    description: 'La app tiene dos áreas. <code>ProductosModule</code> contiene el catálogo (<code>ProductosService</code>, ya escrito) y su controlador <code>GET /productos</code>. <code>PedidosModule</code> calcula el total de un pedido en <code>POST /pedidos</code> usando <code>ProductosService</code>. Conecta los módulos: exporta lo necesario, impórtalo donde se use y une todo en <code>AppModule</code>. Un pedido con un producto inexistente responde <b>404</b>.',
    hints: [
      'Un proveedor solo es visible fuera de su módulo si está en <code>exports</code>. El módulo que lo usa debe tener el otro en <code>imports</code>.',
      '<code>AppModule</code> solo necesita importar los dos módulos de funcionalidad: <code>imports: [ProductosModule, PedidosModule]</code>.',
      'El total es la suma de <code>precio × cantidad</code> de cada línea. <code>buscar(id)</code> ya lanza <code>NotFoundException</code> si el producto no existe.',
    ],
    starter: `import { Body, Controller, Get, Injectable, Module, NotFoundException, Post } from '@nestjs/common';

// ───── Productos ─────
@Injectable()
export class ProductosService {
  private productos = [
    { id: 1, nombre: 'Teclado', precio: 50 },
    { id: 2, nombre: 'Ratón', precio: 20 },
    { id: 3, nombre: 'Monitor', precio: 200 },
  ];
  todos() {
    return this.productos;
  }
  buscar(id: number) {
    const p = this.productos.find((x) => x.id === id);
    if (!p) throw new NotFoundException('Producto ' + id + ' no encontrado');
    return p;
  }
}

@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}
  @Get()
  todos() {
    return this.productos.todos();
  }
}

@Module({
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}

// ───── Pedidos ─────
export class CrearPedidoDto {
  items: { productoId: number; cantidad: number }[];
}

@Controller('pedidos')
export class PedidosController {
  // POST /pedidos → 201 { total }
}

@Module({
  controllers: [PedidosController],
})
export class PedidosModule {}

// ───── App ─────
@Module({})
export class AppModule {}
`,
    tests: [
      { name: 'El catálogo responde', req: GET('/productos'), expect: { status: 200, body: [{ id: 1, nombre: 'Teclado', precio: 50 }, { id: 2, nombre: 'Ratón', precio: 20 }, { id: 3, nombre: 'Monitor', precio: 200 }] } },
      { name: 'Calcula el total del pedido', req: POST('/pedidos', { items: [{ productoId: 1, cantidad: 2 }, { productoId: 2, cantidad: 1 }] }), expect: { status: 201, body: { total: 120 } } },
      { name: 'Pedido de un solo producto', req: POST('/pedidos', { items: [{ productoId: 3, cantidad: 1 }] }), expect: { status: 201, body: { total: 200 } } },
      { name: '404 con un producto inexistente', req: POST('/pedidos', { items: [{ productoId: 9, cantidad: 1 }] }), expect: { status: 404 } },
    ],
  },
  {
    id: 'guard-api-key',
    title: 'Protege rutas con un guard',
    difficulty: 'medio',
    category: 'Seguridad',
    lessons: ['nest-ciclo'],
    description: 'Escribe <code>ApiKeyGuard</code>: deja pasar la petición solo si la cabecera <code>x-api-key</code> vale <code>coderush-123</code>. Úsalo en <code>GET /privado</code>, que responde <code>{ "acceso": "privado" }</code>. <code>GET /publico</code> responde <code>{ "acceso": "público" }</code> sin protección. Sin la clave correcta, la ruta privada responde <b>403</b>.',
    hints: [
      'Un guard es una clase <code>@Injectable()</code> que implementa <code>CanActivate</code>: su método <code>canActivate(contexto)</code> devuelve <code>true</code> para dejar pasar.',
      'Obtén la petición con <code>contexto.switchToHttp().getRequest()</code> y lee <code>req.headers[\'x-api-key\']</code>. Si devuelves <code>false</code>, Nest responde 403.',
      'Aplica el guard solo a esa ruta con <code>@UseGuards(ApiKeyGuard)</code> encima del método.',
    ],
    starter: `import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, UseGuards } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    return true; // Comprueba la cabecera x-api-key
  }
}

@Controller()
export class AccesoController {
  // GET /publico → { acceso: 'público' }
  // GET /privado → { acceso: 'privado' }, protegido con ApiKeyGuard
}

@Module({
  controllers: [AccesoController],
})
export class AppModule {}
`,
    tests: [
      { name: 'La ruta pública no pide clave', req: GET('/publico'), expect: { status: 200, body: { acceso: 'público' } } },
      { name: 'Sin clave: 403', req: GET('/privado'), expect: { status: 403 } },
      { name: 'Con clave incorrecta: 403', req: GET('/privado', { 'x-api-key': 'otra-clave' }), expect: { status: 403 } },
      { name: 'Con la clave correcta entra', req: GET('/privado', { 'x-api-key': 'coderush-123' }), expect: { status: 200, body: { acceso: 'privado' } } },
    ],
  },
  {
    id: 'interceptor-respuesta',
    title: 'Respuestas con formato común',
    difficulty: 'medio',
    category: 'Interceptores',
    lessons: ['nest-ciclo'],
    description: 'Muchas APIs envuelven todas sus respuestas en el mismo formato. Escribe <code>EnvolverInterceptor</code> para que cualquier respuesta correcta salga como <code>{ "ok": true, "data": … }</code> y regístralo de forma global en <code>configurar(app)</code>. El controlador ya está escrito: no lo cambies. Los errores <b>no</b> se envuelven: un 404 debe seguir siendo el error estándar de Nest.',
    hints: [
      'Un interceptor implementa <code>NestInterceptor</code>. En <code>intercept(contexto, next)</code>, <code>next.handle()</code> es un Observable con la respuesta del controlador.',
      'Transfórmala con el operador <code>map</code> de <code>rxjs</code>: <code>return next.handle().pipe(map((data) =&gt; ({ ok: true, data })));</code>. Los errores no pasan por <code>map</code>.',
      'Regístralo con <code>app.useGlobalInterceptors(new EnvolverInterceptor())</code>.',
    ],
    starter: `import { CallHandler, Controller, ExecutionContext, Get, INestApplication, Injectable, Module, NestInterceptor, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class EnvolverInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle(); // Envuelve la respuesta en { ok: true, data }
  }
}

// ───── Ya está escrito: no hace falta cambiarlo ─────
@Controller('frutas')
export class FrutasController {
  private frutas = ['manzana', 'pera', 'uva'];
  @Get()
  todas() {
    return this.frutas;
  }
  @Get(':i')
  una(@Param('i', ParseIntPipe) i: number) {
    if (i < 0 || i >= this.frutas.length) throw new NotFoundException('No hay fruta en la posición ' + i);
    return { posicion: i, nombre: this.frutas[i] };
  }
}

@Module({
  controllers: [FrutasController],
})
export class AppModule {}

export function configurar(app: INestApplication) {
}
`,
    tests: [
      { name: 'Envuelve una lista', req: GET('/frutas'), expect: { status: 200, body: { ok: true, data: ['manzana', 'pera', 'uva'] } } },
      { name: 'Envuelve un objeto', req: GET('/frutas/1'), expect: { status: 200, body: { ok: true, data: { posicion: 1, nombre: 'pera' } } } },
      { name: 'Los errores no se envuelven', req: GET('/frutas/7'), expect: { status: 404, body: { statusCode: 404, message: 'No hay fruta en la posición 7', error: 'Not Found' } } },
    ],
  },
  {
    id: 'filtro-excepciones',
    title: 'Errores con tu propio formato',
    difficulty: 'medio',
    category: 'Errores',
    lessons: ['nest-errores'],
    description: 'Escribe <code>FormatoErrorFilter</code>, un filtro de excepciones que captura cualquier <code>HttpException</code> y responde con este formato: <code>{ "error": true, "estado": 404, "mensaje": "…", "ruta": "/libros/7" }</code>, conservando el código de estado original. Regístralo en <code>configurar(app)</code>. El controlador ya está escrito.',
    hints: [
      'Un filtro es una clase con <code>@Catch(HttpException)</code> que implementa <code>ExceptionFilter</code> y su método <code>catch(excepcion, host)</code>.',
      'Con <code>host.switchToHttp()</code> obtienes la petición (<code>getRequest()</code>, su <code>url</code>) y la respuesta (<code>getResponse()</code>).',
      'El estado está en <code>excepcion.getStatus()</code> y el texto en <code>excepcion.message</code>. Responde con <code>respuesta.status(estado).json({ ... })</code>.',
    ],
    starter: `import { ArgumentsHost, BadRequestException, Body, Catch, Controller, ExceptionFilter, Get, HttpException, INestApplication, Module, NotFoundException, Param, ParseIntPipe, Post } from '@nestjs/common';

@Catch(HttpException)
export class FormatoErrorFilter implements ExceptionFilter {
  catch(excepcion: HttpException, host: ArgumentsHost) {
    // Responde { error: true, estado, mensaje, ruta }
  }
}

// ───── Ya está escrito: no hace falta cambiarlo ─────
@Controller('libros')
export class LibrosController {
  private libros = [{ id: 1, titulo: 'Rayuela' }];
  @Get(':id')
  uno(@Param('id', ParseIntPipe) id: number) {
    const libro = this.libros.find((l) => l.id === id);
    if (!libro) throw new NotFoundException('Libro ' + id + ' no encontrado');
    return libro;
  }
  @Post()
  crear(@Body() datos: { titulo?: string }) {
    if (!datos.titulo) throw new BadRequestException('El título es obligatorio');
    const libro = { id: this.libros.length + 1, titulo: datos.titulo };
    this.libros.push(libro);
    return libro;
  }
}

@Module({
  controllers: [LibrosController],
})
export class AppModule {}

export function configurar(app: INestApplication) {
}
`,
    tests: [
      { name: 'Las respuestas correctas no cambian', req: GET('/libros/1'), expect: { status: 200, body: { id: 1, titulo: 'Rayuela' } } },
      { name: '404 con el nuevo formato', req: GET('/libros/7'), expect: { status: 404, body: { error: true, estado: 404, mensaje: 'Libro 7 no encontrado', ruta: '/libros/7' } } },
      { name: '400 con el nuevo formato', req: POST('/libros', {}), expect: { status: 400, body: { error: true, estado: 400, mensaje: 'El título es obligatorio', ruta: '/libros' } } },
      { name: 'Los errores de los pipes también', req: GET('/libros/abc'), expect: { status: 400, match: { error: true, estado: 400, ruta: '/libros/abc' } } },
    ],
  },
  {
    id: 'configuracion',
    title: 'Configuración por entorno',
    difficulty: 'medio',
    category: 'Configuración',
    lessons: ['nest-config'],
    env: { APP_NOMBRE: 'CodeRush API', APP_VERSION: '3', MODO: 'desarrollo' },
    description: 'Lee la configuración de las <b>variables de entorno</b> con <code>@nestjs/config</code>. CodeRush arranca tu app con <code>APP_NOMBRE=CodeRush API</code>, <code>APP_VERSION=3</code> y <code>MODO=desarrollo</code>. <code>GET /info</code> responde <code>{ "nombre", "version", "modo" }</code> con <code>version</code> como <b>número</b>. <code>GET /info/limite</code> responde <code>{ "limite": n }</code> con la variable <code>LIMITE</code>, que no está definida: en ese caso usa 100.',
    hints: [
      'Importa <code>ConfigModule.forRoot()</code> en <code>AppModule</code> e inyecta <code>ConfigService</code> en el controlador.',
      '<code>config.get(\'APP_NOMBRE\')</code> devuelve el texto de la variable. Las variables de entorno siempre son texto: convierte la versión con <code>Number(...)</code>.',
      '<code>get</code> acepta un valor por defecto como segundo argumento: <code>config.get(\'LIMITE\', 100)</code>.',
    ],
    starter: `import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Controller('info')
export class InfoController {
  // Inyecta ConfigService
  // GET /info        → { nombre, version (número), modo }
  // GET /info/limite → { limite } (100 si LIMITE no está definida)
}

@Module({
  imports: [],
  controllers: [InfoController],
})
export class AppModule {}
`,
    tests: [
      { name: 'Lee las variables de entorno', req: GET('/info'), expect: { status: 200, body: { nombre: 'CodeRush API', version: 3, modo: 'desarrollo' } } },
      { name: 'Usa un valor por defecto', req: GET('/info/limite'), expect: { status: 200, body: { limite: 100 } } },
    ],
  },
  {
    id: 'swagger-docs',
    title: 'Documenta tu API',
    difficulty: 'medio',
    category: 'Documentación',
    lessons: ['nest-swagger'],
    description: 'Añade documentación <b>OpenAPI</b> con <code>@nestjs/swagger</code>. Agrupa el controlador con la etiqueta <code>productos</code>, describe cada ruta (<code>Listar productos</code> y <code>Crear producto</code>) y documenta las propiedades de <code>CrearProductoDto</code>. En <code>configurar(app)</code> genera el documento con el título <code>Tienda CodeRush</code> y la versión <code>1.0</code>, y publícalo en <code>/docs</code>. CodeRush lo lee en formato JSON desde <code>/docs-json</code>.',
    hints: [
      '<code>@ApiTags(\'productos\')</code> va sobre la clase del controlador y <code>@ApiOperation({ summary: \'…\' })</code> sobre cada método.',
      'Cada propiedad del DTO necesita <code>@ApiProperty()</code> para aparecer en el esquema.',
      'En <code>configurar</code>: <code>const config = new DocumentBuilder().setTitle(…).setVersion(…).build();</code>, luego <code>SwaggerModule.createDocument(app, config)</code> y <code>SwaggerModule.setup(\'docs\', app, documento)</code>.',
    ],
    starter: `import { Body, Controller, Get, INestApplication, Module, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class CrearProductoDto {
  nombre: string;
  precio: number;
}

@Controller('productos')
export class ProductosController {
  private productos: (CrearProductoDto & { id: number })[] = [];

  @Get()
  listar() {
    return this.productos;
  }

  @Post()
  crear(@Body() dto: CrearProductoDto) {
    const producto = { id: this.productos.length + 1, ...dto };
    this.productos.push(producto);
    return producto;
  }
}

@Module({
  controllers: [ProductosController],
})
export class AppModule {}

export function configurar(app: INestApplication) {
}
`,
    tests: [
      { name: 'La API sigue funcionando', req: POST('/productos', { nombre: 'Taza', precio: 8 }), expect: { status: 201, body: { id: 1, nombre: 'Taza', precio: 8 } } },
      { name: 'Publica el documento con título y versión', req: GET('/docs-json'), expect: { status: 200, match: { info: { title: 'Tienda CodeRush', version: '1.0' } } } },
      { name: 'Documenta GET /productos', req: GET('/docs-json'), expect: { status: 200, match: { paths: { '/productos': { get: { summary: 'Listar productos', tags: ['productos'] } } } } } },
      { name: 'Documenta POST /productos', req: GET('/docs-json'), expect: { status: 200, match: { paths: { '/productos': { post: { summary: 'Crear producto', tags: ['productos'] } } } } } },
      { name: 'Describe el DTO', req: GET('/docs-json'), expect: { status: 200, match: { components: { schemas: { CrearProductoDto: { properties: { nombre: { type: 'string' }, precio: { type: 'number' } } } } } } } },
    ],
  },

  // ───────────────────────────── DIFÍCILES ─────────────────────────────
  {
    id: 'jwt-login',
    title: 'Login con JWT',
    difficulty: 'dificil',
    category: 'Seguridad',
    lessons: ['nest-jwt', 'nest-ciclo'],
    description: 'Implementa autenticación con tokens. <code>POST /auth/login</code> recibe <code>{ usuario, clave }</code>: si coinciden con un usuario de la lista, responde <b>200</b> con <code>{ "access_token": "…" }</code>, firmado con <code>JwtService</code> e incluyendo <code>usuario</code> y <code>rol</code>; si no, <b>401</b>. <code>GET /auth/perfil</code> está protegida por <code>JwtGuard</code>, que lee el token de la cabecera <code>Authorization: Bearer …</code> y responde con los datos del token. Sin token, o con un token inválido, responde <b>401</b>.',
    hints: [
      'Registra <code>JwtModule.register({ secret: \'…\', signOptions: { expiresIn: \'1h\' } })</code> en los <code>imports</code> y firma con <code>await this.jwt.signAsync({ usuario, rol })</code>.',
      'En el guard, separa la cabecera: <code>const [tipo, token] = (req.headers.authorization ?? \'\').split(\' \')</code>. Si no es <code>Bearer</code>, lanza <code>UnauthorizedException</code>.',
      '<code>verifyAsync(token)</code> <b>lanza un error</b> con tokens inválidos: envuélvelo en <code>try/catch</code> y lanza <code>UnauthorizedException</code>, o el cliente recibirá un 500. Guarda el contenido en <code>req.usuario</code> para que el controlador lo lea.',
    ],
    starter: `import { Body, CanActivate, Controller, ExecutionContext, Get, HttpCode, Injectable, Module, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

const USUARIOS = [
  { usuario: 'ana', clave: '1234', rol: 'admin' },
  { usuario: 'luis', clave: 'abcd', rol: 'lector' },
];

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // Lee "Authorization: Bearer <token>", verifícalo y guarda su contenido en req.usuario
    return true;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  // POST /auth/login  → 200 { access_token } o 401
  // GET  /auth/perfil → protegido con JwtGuard → { usuario, rol }
}

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [JwtGuard],
})
export class AppModule {}
`,
    tests: [
      { name: 'Rechaza una clave incorrecta', req: POST('/auth/login', { usuario: 'ana', clave: 'mala' }), expect: { status: 401 } },
      { name: 'Rechaza un usuario inexistente', req: POST('/auth/login', { usuario: 'eva', clave: '1234' }), expect: { status: 401 } },
      { name: 'Entrega un token con 200', req: POST('/auth/login', { usuario: 'ana', clave: '1234' }), expect: { status: 200, match: { access_token: '<string>' } }, save: { token: 'access_token' } },
      { name: 'Perfil sin token: 401', req: GET('/auth/perfil'), expect: { status: 401 } },
      { name: 'Perfil con un token falso: 401', req: GET('/auth/perfil', { authorization: 'Bearer esto.no.vale' }), expect: { status: 401 } },
      { name: 'Perfil con el token correcto', req: GET('/auth/perfil', { authorization: 'Bearer {{token}}' }), expect: { status: 200, match: { usuario: 'ana', rol: 'admin' } } },
      { name: 'Cada usuario recibe su propio token', req: POST('/auth/login', { usuario: 'luis', clave: 'abcd' }), expect: { status: 200, match: { access_token: '<string>' } }, save: { token2: 'access_token' } },
      { name: 'El token identifica al usuario', req: GET('/auth/perfil', { authorization: 'Bearer {{token2}}' }), expect: { status: 200, match: { usuario: 'luis', rol: 'lector' } } },
    ],
  },
  {
    id: 'typeorm-libros',
    title: 'Biblioteca con TypeORM',
    difficulty: 'dificil',
    category: 'Base de datos',
    lessons: ['nest-typeorm'],
    description: 'Guarda los datos en una <b>base de datos SQL</b> real (SQLite en memoria). Define la entidad <code>Libro</code> (<code>id</code> autogenerado, <code>titulo</code>, <code>autor</code>, <code>paginas</code>), conecta TypeORM con <code>type: \'sqljs\'</code> y usa el <b>repositorio</b> en <code>LibrosService</code>. Rutas: <code>POST /libros</code>, <code>GET /libros</code> (ordenados por id, con filtro opcional <code>?autor=</code>), <code>GET /libros/:id</code> y <code>DELETE /libros/:id</code> (204). Lo que no existe responde <b>404</b>.',
    hints: [
      'La entidad lleva <code>@Entity()</code>, <code>@PrimaryGeneratedColumn()</code> en el id y <code>@Column()</code> en el resto (<code>@Column(\'int\')</code> para las páginas).',
      'En <code>AppModule</code>: <code>TypeOrmModule.forRoot({ type: \'sqljs\', entities: [Libro], synchronize: true })</code> y <code>TypeOrmModule.forFeature([Libro])</code>. Sin <code>forFeature</code> no se puede inyectar el repositorio.',
      'Inyecta con <code>@InjectRepository(Libro) private repo: Repository&lt;Libro&gt;</code>. Para filtrar y ordenar: <code>this.repo.find({ where: autor ? { autor } : {}, order: { id: \'ASC\' } })</code>. <code>delete(id)</code> devuelve <code>affected</code>: si es 0, no existía.',
    ],
    starter: `import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Column, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';

// Entidad Libro: id (autogenerado), titulo, autor, paginas
export class Libro {
}

@Injectable()
export class LibrosService {
  // Inyecta el repositorio de Libro
}

@Controller('libros')
export class LibrosController {
  constructor(private readonly libros: LibrosService) {}

  // POST /libros, GET /libros?autor=, GET /libros/:id, DELETE /libros/:id
}

@Module({
  imports: [
    // Conecta TypeORM con una base sqljs en memoria y registra la entidad
  ],
  controllers: [LibrosController],
  providers: [LibrosService],
})
export class AppModule {}
`,
    tests: [
      { name: 'Guarda un libro', req: POST('/libros', { titulo: 'Rayuela', autor: 'Cortázar', paginas: 600 }), expect: { status: 201, body: { id: 1, titulo: 'Rayuela', autor: 'Cortázar', paginas: 600 } } },
      { name: 'Guarda otro', req: POST('/libros', { titulo: 'Ficciones', autor: 'Borges', paginas: 200 }), expect: { status: 201, body: { id: 2, titulo: 'Ficciones', autor: 'Borges', paginas: 200 } } },
      { name: 'Y uno más', req: POST('/libros', { titulo: 'El Aleph', autor: 'Borges', paginas: 150 }), expect: { status: 201, body: { id: 3, titulo: 'El Aleph', autor: 'Borges', paginas: 150 } } },
      { name: 'Lista todos ordenados', req: GET('/libros'), expect: { status: 200, body: [{ id: 1, titulo: 'Rayuela', autor: 'Cortázar', paginas: 600 }, { id: 2, titulo: 'Ficciones', autor: 'Borges', paginas: 200 }, { id: 3, titulo: 'El Aleph', autor: 'Borges', paginas: 150 }] } },
      { name: 'Filtra por autor', req: GET('/libros?autor=Borges'), expect: { status: 200, body: [{ id: 2, titulo: 'Ficciones', autor: 'Borges', paginas: 200 }, { id: 3, titulo: 'El Aleph', autor: 'Borges', paginas: 150 }] } },
      { name: 'Busca por id', req: GET('/libros/2'), expect: { status: 200, body: { id: 2, titulo: 'Ficciones', autor: 'Borges', paginas: 200 } } },
      { name: '404 si no existe', req: GET('/libros/42'), expect: { status: 404 } },
      { name: 'Borra con 204', req: DELETE('/libros/1'), expect: { status: 204 } },
      { name: 'Ya no está en la base', req: GET('/libros'), expect: { status: 200, body: [{ id: 2, titulo: 'Ficciones', autor: 'Borges', paginas: 200 }, { id: 3, titulo: 'El Aleph', autor: 'Borges', paginas: 150 }] } },
      { name: 'Borrar de nuevo da 404', req: DELETE('/libros/1'), expect: { status: 404 } },
    ],
  },
];

const XP = { facil: 20, medio: 40, dificil: 70 };

export const nestActivities = raw.map((a) => ({ module: 'AppModule', ...a, xp: XP[a.difficulty] }));
export const nestActivityById = new Map(nestActivities.map((a) => [a.id, a]));

// Versión para el navegador: todas las pruebas son visibles en NestJS.
export function publicNestActivity(a) {
  const { env, module, ...rest } = a;
  return { ...rest, tests: a.tests.map(({ save, ...t }) => t) };
}

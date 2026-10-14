// Verifica la ruta de NestJS: cada actividad se resuelve con su solución de referencia (con Nest real),
// los casos de error dan explicaciones útiles, el código inicial compila y los ejemplos de las lecciones
// y librerías pasan el compilador de TypeScript con los tipos reales de los paquetes.
// Uso: npm run verify (o node scripts/verify-nest.js)
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nestActivities, nestActivityById } from '../server/nest/activities.js';
import { runNestActivity, nestStatus, compile } from '../server/nest/runner.js';
import { NEST_LESSONS, NEST_LIBRARIES } from '../public/js/nest-content.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ts = createRequire(path.join(ROOT, 'package.json'))('typescript');

let failures = 0;
const report = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${label}${ok ? '' : `\n   ${detail}`}`);
};

const status = nestStatus();
if (!status.ready) {
  console.log(`✘ Faltan dependencias: ${status.missing.join(', ')}. Ejecuta npm install.`);
  process.exit(1);
}

// ───────────── Soluciones de referencia ─────────────
const solutions = {
  'hola-nest': `import { Controller, Get, Module, Param } from '@nestjs/common';

@Controller('saludo')
export class SaludoController {
  @Get()
  hola() {
    return { mensaje: 'Hola, Nest' };
  }

  @Get(':nombre')
  holaA(@Param('nombre') nombre: string) {
    return { mensaje: \`Hola, \${nombre}\` };
  }
}

@Module({ controllers: [SaludoController] })
export class AppModule {}
`,
  'calculadora-query': `import { Controller, Get, Module, Query, ParseIntPipe } from '@nestjs/common';

@Controller('calculadora')
export class CalculadoraController {
  @Get('sumar')
  sumar(@Query('a', ParseIntPipe) a: number, @Query('b', ParseIntPipe) b: number) {
    return { resultado: a + b };
  }

  @Get('multiplicar')
  multiplicar(@Query('a', ParseIntPipe) a: number, @Query('b', ParseIntPipe) b: number) {
    return { resultado: a * b };
  }
}

@Module({ controllers: [CalculadoraController] })
export class AppModule {}
`,
  'contador-servicio': `import { Controller, Get, Post, HttpCode, Injectable, Module } from '@nestjs/common';

@Injectable()
export class ContadorService {
  private valor = 0;
  leer() { return this.valor; }
  incrementar() { return ++this.valor; }
  reiniciar() { this.valor = 0; return this.valor; }
}

@Controller('contador')
export class ContadorController {
  constructor(private readonly contador: ContadorService) {}
  @Get() leer() { return { valor: this.contador.leer() }; }
  @Post('incrementar') incrementar() { return { valor: this.contador.incrementar() }; }
  @Post('reiniciar') @HttpCode(200) reiniciar() { return { valor: this.contador.reiniciar() }; }
}

@Module({ controllers: [ContadorController], providers: [ContadorService] })
export class AppModule {}
`,
  'crud-tareas': `import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

export interface Tarea { id: number; titulo: string; hecha: boolean; }

@Injectable()
export class TareasService {
  private tareas: Tarea[] = [];
  private siguienteId = 1;
  todas() { return this.tareas; }
  crear(titulo: string) {
    const tarea = { id: this.siguienteId++, titulo, hecha: false };
    this.tareas.push(tarea);
    return tarea;
  }
  buscar(id: number) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) throw new NotFoundException(\`La tarea \${id} no existe\`);
    return tarea;
  }
  actualizar(id: number, cambios: Partial<Tarea>) { return Object.assign(this.buscar(id), cambios); }
  borrar(id: number) {
    const tarea = this.buscar(id);
    this.tareas = this.tareas.filter((t) => t !== tarea);
  }
}

@Controller('tareas')
export class TareasController {
  constructor(private readonly tareas: TareasService) {}
  @Get() todas() { return this.tareas.todas(); }
  @Post() crear(@Body() datos: { titulo: string }) { return this.tareas.crear(datos.titulo); }
  @Get(':id') una(@Param('id', ParseIntPipe) id: number) { return this.tareas.buscar(id); }
  @Patch(':id') actualizar(@Param('id', ParseIntPipe) id: number, @Body() cambios: Partial<Tarea>) { return this.tareas.actualizar(id, cambios); }
  @Delete(':id') @HttpCode(204) borrar(@Param('id', ParseIntPipe) id: number) { this.tareas.borrar(id); }
}

@Module({ controllers: [TareasController], providers: [TareasService] })
export class AppModule {}
`,
  'validacion-dto': `import { Body, Controller, Get, INestApplication, Module, Post, ValidationPipe } from '@nestjs/common';
import { IsEmail, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  @IsString() @MinLength(3) nombre: string;
  @IsEmail() email: string;
  @IsInt() @Min(18) edad: number;
}

@Controller('usuarios')
export class UsuariosController {
  private usuarios: (CrearUsuarioDto & { id: number })[] = [];
  @Post() crear(@Body() dto: CrearUsuarioDto) {
    const usuario = { id: this.usuarios.length + 1, ...dto };
    this.usuarios.push(usuario);
    return usuario;
  }
  @Get() todos() { return this.usuarios; }
}

@Module({ controllers: [UsuariosController] })
export class AppModule {}

export function configurar(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
}
`,
  'modulos-pedidos': `import { Body, Controller, Get, Injectable, Module, NotFoundException, Post } from '@nestjs/common';

@Injectable()
export class ProductosService {
  private productos = [
    { id: 1, nombre: 'Teclado', precio: 50 },
    { id: 2, nombre: 'Ratón', precio: 20 },
    { id: 3, nombre: 'Monitor', precio: 200 },
  ];
  todos() { return this.productos; }
  buscar(id: number) {
    const p = this.productos.find((x) => x.id === id);
    if (!p) throw new NotFoundException('Producto ' + id + ' no encontrado');
    return p;
  }
}

@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}
  @Get() todos() { return this.productos.todos(); }
}

@Module({ controllers: [ProductosController], providers: [ProductosService], exports: [ProductosService] })
export class ProductosModule {}

export class CrearPedidoDto { items: { productoId: number; cantidad: number }[]; }

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly productos: ProductosService) {}
  @Post() crear(@Body() pedido: CrearPedidoDto) {
    const total = pedido.items.reduce((s, it) => s + this.productos.buscar(it.productoId).precio * it.cantidad, 0);
    return { total };
  }
}

@Module({ imports: [ProductosModule], controllers: [PedidosController] })
export class PedidosModule {}

@Module({ imports: [ProductosModule, PedidosModule] })
export class AppModule {}
`,
  'guard-api-key': `import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, UseGuards } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const req = contexto.switchToHttp().getRequest();
    return req.headers['x-api-key'] === 'coderush-123';
  }
}

@Controller()
export class AccesoController {
  @Get('publico') publico() { return { acceso: 'público' }; }
  @Get('privado') @UseGuards(ApiKeyGuard) privado() { return { acceso: 'privado' }; }
}

@Module({ controllers: [AccesoController] })
export class AppModule {}
`,
  'interceptor-respuesta': `import { CallHandler, Controller, ExecutionContext, Get, INestApplication, Injectable, Module, NestInterceptor, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class EnvolverInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ ok: true, data })));
  }
}

@Controller('frutas')
export class FrutasController {
  private frutas = ['manzana', 'pera', 'uva'];
  @Get() todas() { return this.frutas; }
  @Get(':i') una(@Param('i', ParseIntPipe) i: number) {
    if (i < 0 || i >= this.frutas.length) throw new NotFoundException('No hay fruta en la posición ' + i);
    return { posicion: i, nombre: this.frutas[i] };
  }
}

@Module({ controllers: [FrutasController] })
export class AppModule {}

export function configurar(app: INestApplication) {
  app.useGlobalInterceptors(new EnvolverInterceptor());
}
`,
  'filtro-excepciones': `import { ArgumentsHost, BadRequestException, Body, Catch, Controller, ExceptionFilter, Get, HttpException, INestApplication, Module, NotFoundException, Param, ParseIntPipe, Post } from '@nestjs/common';

@Catch(HttpException)
export class FormatoErrorFilter implements ExceptionFilter {
  catch(excepcion: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const estado = excepcion.getStatus();
    http.getResponse().status(estado).json({ error: true, estado, mensaje: excepcion.message, ruta: http.getRequest().url });
  }
}

@Controller('libros')
export class LibrosController {
  private libros = [{ id: 1, titulo: 'Rayuela' }];
  @Get(':id') uno(@Param('id', ParseIntPipe) id: number) {
    const libro = this.libros.find((l) => l.id === id);
    if (!libro) throw new NotFoundException('Libro ' + id + ' no encontrado');
    return libro;
  }
  @Post() crear(@Body() datos: { titulo?: string }) {
    if (!datos.titulo) throw new BadRequestException('El título es obligatorio');
    const libro = { id: this.libros.length + 1, titulo: datos.titulo };
    this.libros.push(libro);
    return libro;
  }
}

@Module({ controllers: [LibrosController] })
export class AppModule {}

export function configurar(app: INestApplication) {
  app.useGlobalFilters(new FormatoErrorFilter());
}
`,
  configuracion: `import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Controller('info')
export class InfoController {
  constructor(private readonly config: ConfigService) {}
  @Get() info() {
    return { nombre: this.config.get('APP_NOMBRE'), version: Number(this.config.get('APP_VERSION')), modo: this.config.get('MODO') };
  }
  @Get('limite') limite() { return { limite: this.config.get('LIMITE', 100) }; }
}

@Module({ imports: [ConfigModule.forRoot()], controllers: [InfoController] })
export class AppModule {}
`,
  'swagger-docs': `import { Body, Controller, Get, INestApplication, Module, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class CrearProductoDto {
  @ApiProperty({ example: 'Taza' }) nombre: string;
  @ApiProperty({ example: 8 }) precio: number;
}

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  private productos: (CrearProductoDto & { id: number })[] = [];
  @Get() @ApiOperation({ summary: 'Listar productos' }) listar() { return this.productos; }
  @Post() @ApiOperation({ summary: 'Crear producto' }) crear(@Body() dto: CrearProductoDto) {
    const producto = { id: this.productos.length + 1, ...dto };
    this.productos.push(producto);
    return producto;
  }
}

@Module({ controllers: [ProductosController] })
export class AppModule {}

export function configurar(app: INestApplication) {
  const config = new DocumentBuilder().setTitle('Tienda CodeRush').setVersion('1.0').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
`,
  'jwt-login': `import { Body, CanActivate, Controller, ExecutionContext, Get, HttpCode, Injectable, Module, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

const USUARIOS = [
  { usuario: 'ana', clave: '1234', rol: 'admin' },
  { usuario: 'luis', clave: 'abcd', rol: 'lector' },
];

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException();
    try {
      req.usuario = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
    return true;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}
  @Post('login') @HttpCode(200)
  async login(@Body() datos: { usuario: string; clave: string }) {
    const u = USUARIOS.find((x) => x.usuario === datos.usuario && x.clave === datos.clave);
    if (!u) throw new UnauthorizedException('Credenciales incorrectas');
    return { access_token: await this.jwt.signAsync({ usuario: u.usuario, rol: u.rol }) };
  }
  @Get('perfil') @UseGuards(JwtGuard)
  perfil(@Req() req: { usuario: unknown }) { return req.usuario; }
}

@Module({
  imports: [JwtModule.register({ secret: 'secreto-coderush', signOptions: { expiresIn: '1h' } })],
  controllers: [AuthController],
  providers: [JwtGuard],
})
export class AppModule {}
`,
  'typeorm-libros': `import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Column, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';

@Entity()
export class Libro {
  @PrimaryGeneratedColumn() id: number;
  @Column() titulo: string;
  @Column() autor: string;
  @Column('int') paginas: number;
}

@Injectable()
export class LibrosService {
  constructor(@InjectRepository(Libro) private readonly repo: Repository<Libro>) {}
  crear(datos: Omit<Libro, 'id'>) { return this.repo.save(this.repo.create(datos)); }
  todos(autor?: string) { return this.repo.find({ where: autor ? { autor } : {}, order: { id: 'ASC' } }); }
  async uno(id: number) {
    const libro = await this.repo.findOneBy({ id });
    if (!libro) throw new NotFoundException(\`El libro \${id} no existe\`);
    return libro;
  }
  async borrar(id: number) {
    const r = await this.repo.delete(id);
    if (!r.affected) throw new NotFoundException(\`El libro \${id} no existe\`);
  }
}

@Controller('libros')
export class LibrosController {
  constructor(private readonly libros: LibrosService) {}
  @Post() crear(@Body() datos: Omit<Libro, 'id'>) { return this.libros.crear(datos); }
  @Get() todos(@Query('autor') autor?: string) { return this.libros.todos(autor); }
  @Get(':id') uno(@Param('id', ParseIntPipe) id: number) { return this.libros.uno(id); }
  @Delete(':id') @HttpCode(204) borrar(@Param('id', ParseIntPipe) id: number) { return this.libros.borrar(id); }
}

@Module({
  imports: [TypeOrmModule.forRoot({ type: 'sqljs', entities: [Libro], synchronize: true }), TypeOrmModule.forFeature([Libro])],
  controllers: [LibrosController],
  providers: [LibrosService],
})
export class AppModule {}
`,
};

for (const a of nestActivities) {
  if (!solutions[a.id]) {
    report(false, `[nest] ${a.id}`, 'falta solución de referencia');
    continue;
  }
  const r = await runNestActivity(a, solutions[a.id]);
  report(r.allPassed, `[nest] ${a.id} (${r.ms} ms)`, JSON.stringify(r.fatal ? { fatal: r.fatal, hint: r.fatalHint } : r.tests.filter((t) => !t.passed)).slice(0, 900));
}

// ───────────── Casos que deben fallar con una explicación útil ─────────────
const sol = (id) => solutions[id];
const negative = [
  ['hola-nest', 'controlador sin registrar', sol('hola-nest').replace('@Module({ controllers: [SaludoController] })', '@Module({ controllers: [] })'),
    (r) => r.tests[0].status === 'fail' && /no existe/.test(r.tests[0].diagnosis)],
  ['contador-servicio', 'servicio sin registrar', sol('contador-servicio').replace('providers: [ContadorService]', 'providers: []'),
    (r) => r.fatalKind === 'crash' && /le falta <code>ContadorService<\/code>/.test(r.fatalHint?.title ?? '')],
  ['modulos-pedidos', 'servicio sin exportar', sol('modulos-pedidos').replace(', exports: [ProductosService]', ''),
    (r) => /PedidosController/.test(r.fatalHint?.title ?? '') && /exports/.test(r.fatalHint?.tip ?? '')],
  ['contador-servicio', 'error de sintaxis', 'import { Module } from "@nestjs/common";\n\n@Module({})\nexport class AppModule {\n',
    (r) => r.fatalKind === 'syntax' && r.fatalLine === 5],
  ['hola-nest', 'módulo con otro nombre', sol('hola-nest').replace('export class AppModule', 'export class AplicacionModule'),
    (r) => r.fatalKind === 'notFound' && /AplicacionModule/.test(r.fatal)],
  ['hola-nest', 'error dentro de un método', sol('hola-nest').replace("return { mensaje: 'Hola, Nest' };", 'const x: any = null;\n    return x.mensaje;'),
    (r) => r.tests[0].status === 'error' && r.tests[0].line === 8 && /TypeError/.test(r.tests[0].error)],
  ['contador-servicio', 'reiniciar sin @HttpCode', sol('contador-servicio').replace(" @HttpCode(200)", ''),
    (r) => /HttpCode\(200\)/.test(r.tests[4].diagnosis)],
  ['validacion-dto', 'sin ValidationPipe', sol('validacion-dto').replace(/app\.useGlobalPipes\([^;]+;/, ''),
    (r) => r.tests[1].status === 'fail' && /ValidationPipe/.test(r.tests[1].diagnosis)],
  ['configuracion', 'versión como texto', sol('configuracion').replace("Number(this.config.get('APP_VERSION'))", "this.config.get('APP_VERSION')"),
    (r) => /texto "3" en vez del número 3/.test(r.tests[0].diagnosis)],
  ['jwt-login', 'token falso sin try/catch → 500', sol('jwt-login').replace(/try \{\n\s+(req\.usuario = await this\.jwt\.verifyAsync\(token\);)\n\s+\} catch \{\n[^}]+\}/, '$1'),
    (r) => r.tests[4].actual?.status === 500 && r.tests[4].error && /error al atender/.test(r.tests[4].diagnosis)],
  ['typeorm-libros', 'falta forFeature', sol('typeorm-libros').replace(', TypeOrmModule.forFeature([Libro])', ''),
    (r) => /forFeature/.test(r.fatalHint?.tip ?? '')],
  ['interceptor-respuesta', 'decorador mal escrito e importado', sol('interceptor-respuesta').replace('NestInterceptor,', 'NestInterceptor, Inyectable,').replace('@Injectable()\nexport class EnvolverInterceptor', '@Inyectable()\nexport class EnvolverInterceptor'),
    (r) => r.fatalKind === 'crash' && /Inyectable/.test(r.fatalHint?.title ?? '')],
  ['interceptor-respuesta', 'decorador sin importar', sol('interceptor-respuesta').replace('Injectable, ', ''),
    (r) => r.fatalKind === 'crash' && /Injectable/.test(r.fatalHint?.title ?? '') && [4, 5].includes(r.fatalLine)],
  ['hola-nest', 'bucle infinito en una petición', sol('hola-nest').replace("return { mensaje: 'Hola, Nest' };", 'while (true) {}'),
    (r) => r.tests[0].status === 'timeout' && r.fatalKind == null],
];
for (const [id, label, code, check] of negative) {
  const r = await runNestActivity(nestActivityById.get(id), code);
  report(check(r), `[nest] ${id}: ${label} (caso negativo)`, JSON.stringify({ fatalKind: r.fatalKind, fatal: r.fatal, hint: r.fatalHint, t: r.tests.map((t) => [t.status, t.diagnosis, t.error?.slice(0, 120), t.line]) }).slice(0, 1200));
}

// ───────────── Código inicial ─────────────
for (const a of nestActivities) {
  const c = compile(a.starter);
  report(!c.error, `[nest] ${a.id}: el código inicial compila`, c.error);
}

// ───────────── Enlaces entre lecciones, actividades y librerías ─────────────
const lessonIds = new Set(NEST_LESSONS.map((l) => l.id));
for (const l of NEST_LESSONS) {
  for (const id of l.activities) report(nestActivityById.has(id), `${l.id} → ${id}`, `la actividad "${id}" no existe`);
  for (const [i, q] of l.quiz.entries()) {
    report(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && q.why, `${l.id} pregunta ${i + 1}`, 'respuesta fuera de rango o sin explicación');
  }
}
for (const a of nestActivities) {
  for (const id of a.lessons) report(lessonIds.has(id), `${a.id} → ${id}`, `la lección "${id}" no existe`);
  report(NEST_LESSONS.some((l) => l.activities.includes(a.id)), `${a.id}: tiene lección`, 'ninguna lección enlaza esta actividad');
}
for (const lib of NEST_LIBRARIES) {
  if (lib.lesson) report(lessonIds.has(lib.lesson), `${lib.id} → ${lib.lesson}`, 'la lección no existe');
  if (lib.activity) report(nestActivityById.has(lib.activity), `${lib.id} → ${lib.activity}`, 'la actividad no existe');
}

// ───────────── Comprobación de tipos de los ejemplos ─────────────
// Cada ejemplo se compila con los tipos reales de los paquetes instalados. Se ignoran los nombres que
// vendrían de otros archivos del proyecto o de Jest (2304, 2593) y los imports relativos (2307 con './'), porque un
// ejemplo muestra un archivo suelto. Los paquetes no instalados (librerías opcionales) solo se revisan por sintaxis.
const snippets = [];
for (const l of NEST_LESSONS) l.sections.forEach((s, i) => !s.lang && snippets.push({ label: `${l.id} sección ${i + 1}`, code: s.code, typed: s.typed !== false }));
for (const lib of NEST_LIBRARIES) snippets.push({ label: `librería ${lib.id}`, code: lib.snippet, typed: lib.typed });
const dir = await mkdtemp(path.join(ROOT, '.runs', 'check-'));
await mkdir(dir, { recursive: true });
const files = [];
for (const [i, s] of snippets.entries()) {
  const file = path.join(dir, `ejemplo${i}.ts`);
  await writeFile(file, `export {};\n${s.code}`, 'utf8');
  files.push(file);
}
const program = ts.createProgram(files, {
  noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  experimentalDecorators: true, emitDecoratorMetadata: true, strict: false, skipLibCheck: true, types: [], lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
});
const ignored = (d) => [2304, 2552, 2582, 2593].includes(d.code) || (d.code === 2307 && /'\.\.?\//.test(ts.flattenDiagnosticMessageText(d.messageText, ' ')));
for (const [i, s] of snippets.entries()) {
  const sf = program.getSourceFile(files[i]);
  const diags = [...program.getSyntacticDiagnostics(sf), ...(s.typed ? program.getSemanticDiagnostics(sf) : [])].filter((d) => !ignored(d));
  const msg = diags.slice(0, 3).map((d) => `línea ${sf.getLineAndCharacterOfPosition(d.start ?? 0).line} (TS${d.code}): ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`).join(' | ');
  report(!diags.length, `${s.label}: compila${s.typed ? ' con tipos' : ''}`, msg);
}
await rm(dir, { recursive: true, force: true });

console.log(failures ? `\n${failures} fallo(s) en NestJS` : `\nNestJS correcto: ${nestActivities.length} actividades, ${negative.length} casos negativos y ${snippets.length} ejemplos.`);
process.exit(failures ? 1 : 0);

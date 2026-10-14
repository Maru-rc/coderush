// Ruta de NestJS: lecciones (con quiz) y fichas de las librerías más usadas.
// Los ejemplos son TypeScript; `npm run verify` los compila con los tipos reales de los paquetes instalados.
// Sección: { title, text, code, file?, lang? }. `lang` cambia el resaltado y omite la comprobación de tipos
// (para .env, JSON o la terminal). `typed: false` revisa solo la sintaxis (paquetes que CodeRush no instala).

export const NEST_LESSONS = [
  // ───────────────────────────── 01 ─────────────────────────────
  {
    id: 'nest-intro',
    title: '¿Qué es NestJS?',
    summary: 'Un framework para APIs en Node.js con TypeScript, ordenado en módulos, controladores y proveedores.',
    activities: ['hola-nest'],
    sections: [
      {
        title: 'Las tres piezas',
        text: 'Nest organiza una aplicación en tres tipos de clases. Los <b>controladores</b> reciben las peticiones HTTP y responden. Los <b>proveedores</b> (normalmente servicios) contienen la lógica y se inyectan donde se necesitan. Los <b>módulos</b> agrupan controladores y proveedores relacionados. Los decoradores (lo que empieza por <code>@</code>) le dicen a Nest qué papel cumple cada clase.',
        file: 'app.module.ts',
        code: `import { Controller, Get, Injectable, Module } from '@nestjs/common';

@Injectable()
export class AppService {
  saludo() {
    return 'Hola desde un servicio';
  }
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  inicio() {
    return { mensaje: this.appService.saludo() }; // se envía como JSON
  }
}

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}`,
      },
      {
        title: 'El punto de entrada: main.ts',
        text: 'En un proyecto real, <code>main.ts</code> crea la aplicación a partir del módulo raíz y la pone a escuchar en un puerto. Ahí también se configura lo que afecta a toda la app: pipes globales, prefijo de rutas, CORS, Swagger… En las actividades de CodeRush no escribes <code>main.ts</code>: CodeRush arranca tu <code>AppModule</code>, y lo que pondrías aquí va en una función exportada <code>configurar(app)</code>.',
        file: 'main.ts',
        code: `import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // todas las rutas empiezan por /api
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();`,
      },
      {
        title: 'Crear un proyecto con la CLI',
        text: 'La CLI de Nest crea el proyecto y genera cada pieza con su archivo, su prueba y su registro en el módulo. La convención es un archivo por clase con el nombre <code>nombre.tipo.ts</code>: <code>tareas.controller.ts</code>, <code>tareas.service.ts</code>, <code>tareas.module.ts</code>. El comando <code>resource</code> genera un CRUD completo con sus DTOs.',
        lang: 'shell',
        code: `npm i -g @nestjs/cli
nest new mi-api
cd mi-api
nest generate resource tareas   # módulo, controlador, servicio y DTOs
npm run start:dev               # arranca y se recarga al guardar`,
      },
    ],
    quiz: [
      { q: '¿Qué pieza de Nest recibe las peticiones HTTP?', options: ['El módulo', 'El controlador', 'El proveedor', '<code>main.ts</code>'], answer: 1, why: 'Los controladores definen las rutas y responden. La lógica la delegan en los proveedores.' },
      { q: '¿Para qué sirve un módulo?', options: ['Para guardar datos', 'Para agrupar controladores y proveedores relacionados y decidir qué comparte con otros módulos', 'Para definir rutas', 'Para validar datos'], answer: 1, why: 'Un módulo es una unidad de organización: declara sus piezas, qué importa y qué exporta.' },
      { q: 'En las actividades de CodeRush, ¿dónde va lo que en un proyecto real pondrías en <code>main.ts</code> (como <code>app.useGlobalPipes</code>)?', options: ['En el constructor del controlador', 'En la función exportada <code>configurar(app)</code>', 'En el decorador <code>@Module</code>', 'No se puede hacer'], answer: 1, why: 'CodeRush crea la app por ti y llama a <code>configurar(app)</code> antes de arrancarla, igual que harías en <code>bootstrap()</code>.' },
    ],
  },

  // ───────────────────────────── 02 ─────────────────────────────
  {
    id: 'nest-controladores',
    title: 'Controladores y rutas',
    summary: 'Definir rutas, leer parámetros, query y cuerpo, y elegir el código de estado.',
    activities: ['hola-nest', 'calculadora-query', 'crud-tareas'],
    sections: [
      {
        title: 'Rutas y verbos HTTP',
        text: 'El prefijo de <code>@Controller(\'libros\')</code> se suma a la ruta de cada método: <code>@Get(\':id\')</code> atiende <code>GET /libros/7</code>. Lo que devuelve el método se envía como JSON con estado 200 (201 en los <code>@Post</code>). Pon las rutas fijas, como <code>destacados</code>, <b>antes</b> de las que tienen parámetros: si no, <code>:id</code> las atraparía.',
        file: 'libros.controller.ts',
        code: `import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';

@Controller('libros') // prefijo: /libros
export class LibrosController {
  @Get() // GET /libros
  listar() {
    return [{ id: 1, titulo: 'Rayuela' }];
  }

  @Get('destacados') // GET /libros/destacados
  destacados() {
    return [];
  }

  @Post() // POST /libros → 201 por defecto
  crear() {
    return { id: 2 };
  }

  @Patch(':id') // PATCH /libros/7
  actualizar() {}

  @Delete(':id') // DELETE /libros/7
  borrar() {}
}`,
      },
      {
        title: 'Leer datos de la petición',
        text: '<code>@Param</code> lee los parámetros de la ruta, <code>@Query</code> los de la query string (<code>?autor=Borges</code>), <code>@Body</code> el cuerpo JSON y <code>@Headers</code> las cabeceras. Ojo: los parámetros y la query siempre llegan como <b>texto</b>, aunque anotes el tipo como <code>number</code>. Los tipos de TypeScript desaparecen al compilar y no convierten nada.',
        file: 'libros.controller.ts',
        code: `import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';

@Controller('libros')
export class LibrosController {
  // GET /libros/buscar?autor=Borges&pagina=2
  @Get('buscar')
  buscar(@Query('autor') autor: string, @Query('pagina') pagina: string) {
    return { autor, pagina }; // pagina es el texto "2"
  }

  // GET /libros/7
  @Get(':id')
  uno(@Param('id') id: string) {
    return { id };
  }

  // POST /libros con un cuerpo JSON
  @Post()
  crear(@Body() datos: { titulo: string }, @Headers('x-idioma') idioma?: string) {
    return { ...datos, idioma: idioma ?? 'es' };
  }
}`,
      },
      {
        title: 'Pipes de conversión y códigos de estado',
        text: 'Los <b>pipes</b> transforman y validan un valor antes de que llegue al método. <code>ParseIntPipe</code> convierte a número y responde 400 si no puede. <code>DefaultValuePipe</code> pone un valor cuando falta. También existen <code>ParseBoolPipe</code>, <code>ParseUUIDPipe</code> y <code>ParseEnumPipe</code>. Con <code>@HttpCode()</code> cambias el estado de la respuesta.',
        file: 'libros.controller.ts',
        code: `import { Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, ParseIntPipe, Query } from '@nestjs/common';

@Controller('libros')
export class LibrosController {
  @Get()
  listar(@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number) {
    return { pagina }; // número; con ?pagina=abc responde 400
  }

  @Get(':id')
  uno(@Param('id', ParseIntPipe) id: number) {
    return { id, tipo: typeof id }; // { id: 7, tipo: 'number' }
  }

  @Delete(':id')
  @HttpCode(204) // respuesta sin contenido
  borrar(@Param('id', ParseIntPipe) id: number) {}
}`,
      },
    ],
    quiz: [
      { q: 'Con <code>@Controller(\'tareas\')</code> y <code>@Get(\':id\')</code>, ¿qué URL atiende el método?', options: ['<code>/:id</code>', '<code>/tareas/:id</code>, por ejemplo <code>/tareas/5</code>', '<code>/tareas</code>', '<code>/id/tareas</code>'], answer: 1, why: 'El prefijo del controlador y la ruta del método se unen: <code>/tareas</code> + <code>/:id</code>.' },
      { q: 'Sin ningún pipe, ¿qué tipo tiene <code>id</code> en <code>@Param(\'id\') id: number</code>?', options: ['<code>number</code>', '<code>string</code>: la anotación de TypeScript no convierte nada', '<code>undefined</code>', '<code>boolean</code>'], answer: 1, why: 'Los tipos de TypeScript desaparecen al compilar. Para convertir de verdad usa <code>ParseIntPipe</code>.' },
      { q: '¿Qué código de estado devuelve por defecto un método con <code>@Post()</code>?', options: ['200', '201', '204', '202'], answer: 1, why: 'POST responde 201 (Created) por defecto. Se cambia con <code>@HttpCode(200)</code>.' },
    ],
  },

  // ───────────────────────────── 03 ─────────────────────────────
  {
    id: 'nest-proveedores',
    title: 'Proveedores e inyección de dependencias',
    summary: 'Servicios con @Injectable, cómo los entrega Nest y proveedores personalizados.',
    activities: ['contador-servicio', 'crud-tareas', 'modulos-pedidos'],
    sections: [
      {
        title: 'Servicios con @Injectable',
        text: 'La lógica de negocio vive en <b>servicios</b>: clases marcadas con <code>@Injectable()</code>. Así los controladores quedan cortos (reciben, delegan y responden) y la lógica se puede reutilizar y probar por separado. Un servicio puede lanzar excepciones HTTP como <code>NotFoundException</code>: Nest las convierte en la respuesta adecuada.',
        file: 'notas.service.ts',
        code: `import { Injectable, NotFoundException } from '@nestjs/common';

export interface Nota {
  id: number;
  texto: string;
}

@Injectable()
export class NotasService {
  private notas: Nota[] = [];

  crear(texto: string): Nota {
    const nota = { id: this.notas.length + 1, texto };
    this.notas.push(nota);
    return nota;
  }

  buscar(id: number): Nota {
    const nota = this.notas.find((n) => n.id === id);
    if (!nota) throw new NotFoundException(\`La nota \${id} no existe\`);
    return nota;
  }
}`,
      },
      {
        title: 'Inyección de dependencias',
        text: 'No creas el servicio con <code>new</code>: lo pides en el <b>constructor</b> y Nest te lo entrega. Para eso debe estar en <code>providers</code> del módulo. Nest crea <b>una sola instancia</b> para toda la aplicación, así que todos los que lo inyectan comparten su estado. Si olvidas registrarlo, verás <code>Nest can\'t resolve dependencies of…</code>.',
        file: 'notas.module.ts',
        code: `import { Body, Controller, Get, Module, Param, ParseIntPipe, Post } from '@nestjs/common';
import { NotasService } from './notas.service';

@Controller('notas')
export class NotasController {
  // Nest ve el tipo NotasService y entrega la instancia registrada
  constructor(private readonly notas: NotasService) {}

  @Post()
  crear(@Body('texto') texto: string) {
    return this.notas.crear(texto);
  }

  @Get(':id')
  una(@Param('id', ParseIntPipe) id: number) {
    return this.notas.buscar(id);
  }
}

@Module({
  controllers: [NotasController],
  providers: [NotasService], // sin esto: "Nest can't resolve dependencies"
})
export class NotasModule {}`,
      },
      {
        title: 'Proveedores personalizados',
        text: 'Un proveedor no tiene por qué ser una clase. Con <code>useValue</code> registras un valor fijo, con <code>useFactory</code> lo calculas al arrancar y con <code>useClass</code> eliges qué clase usar. Se identifican con un <b>token</b> (un texto o un símbolo) y se piden con <code>@Inject(TOKEN)</code>. Es la base de la configuración y de los mocks en las pruebas.',
        file: 'envios.module.ts',
        code: `import { Inject, Injectable, Module } from '@nestjs/common';

export const PRECIO_POR_KILO = 'PRECIO_POR_KILO';

@Injectable()
export class EnviosService {
  constructor(@Inject(PRECIO_POR_KILO) private readonly precio: number) {}

  calcular(kilos: number) {
    return this.precio * kilos;
  }
}

@Module({
  providers: [
    EnviosService,
    { provide: PRECIO_POR_KILO, useValue: 4.5 },
    { provide: 'FECHA_ARRANQUE', useFactory: () => new Date() },
  ],
})
export class EnviosModule {}`,
      },
    ],
    quiz: [
      { q: 'Por defecto, ¿cuántas instancias de un servicio crea Nest?', options: ['Una por petición', 'Una para toda la aplicación', 'Una por cada controlador que la use', 'Ninguna: hay que crearla con <code>new</code>'], answer: 1, why: 'Los proveedores son <i>singleton</i> por defecto: se crean una vez y se comparten.' },
      { q: 'Ves el error <code>Nest can\'t resolve dependencies of the TareasController (?)</code>. ¿Qué falta casi siempre?', options: ['Un <code>return</code>', 'Registrar el servicio en <code>providers</code> del módulo', 'Un <code>@Get</code>', 'Reiniciar el servidor'], answer: 1, why: 'Nest no encuentra quién le proporciona esa dependencia en el módulo del controlador.' },
      { q: '¿Por qué no hacer <code>new TareasService()</code> dentro del controlador?', options: ['Da error de sintaxis', 'Cada controlador tendría su propia copia y no podrías sustituirla en las pruebas', 'Es más lento', 'TypeScript no lo permite'], answer: 1, why: 'Con la inyección, Nest decide qué instancia entregar: la compartida en la app o un mock en una prueba.' },
    ],
  },

  // ───────────────────────────── 04 ─────────────────────────────
  {
    id: 'nest-modulos',
    title: 'Módulos',
    summary: 'Dividir la app por funcionalidades, compartir proveedores y configurar módulos al importarlos.',
    activities: ['modulos-pedidos'],
    sections: [
      {
        title: 'Módulos de funcionalidad',
        text: 'Lo habitual es un módulo por área del dominio: usuarios, productos, pedidos… Los proveedores de un módulo son <b>privados</b>: solo los ven sus propias piezas. Para que otro módulo pueda usarlos, ponlos en <code>exports</code>.',
        file: 'usuarios.module.ts',
        code: `import { Injectable, Module } from '@nestjs/common';

@Injectable()
export class UsuariosService {
  buscarPorEmail(email: string) {
    return { id: 1, email };
  }
}

@Module({
  providers: [UsuariosService],
  exports: [UsuariosService], // visible para quien importe UsuariosModule
})
export class UsuariosModule {}`,
      },
      {
        title: 'Importar otros módulos',
        text: 'Un módulo que necesita algo de otro lo pone en <code>imports</code> y recibe lo que ese módulo exporta. El módulo raíz (<code>AppModule</code>) importa los módulos de funcionalidad para unir la aplicación. En <code>imports</code> solo van módulos: los controladores y los servicios tienen sus propios arrays.',
        file: 'auth.module.ts',
        code: `import { Injectable, Module } from '@nestjs/common';
import { UsuariosModule, UsuariosService } from './usuarios.module';

@Injectable()
export class AuthService {
  constructor(private readonly usuarios: UsuariosService) {}

  login(email: string) {
    return this.usuarios.buscarPorEmail(email);
  }
}

@Module({
  imports: [UsuariosModule], // trae lo que UsuariosModule exporta
  providers: [AuthService],
})
export class AuthModule {}

@Module({
  imports: [UsuariosModule, AuthModule], // el módulo raíz une la app
})
export class AppModule {}`,
      },
      {
        title: 'Módulos globales y dinámicos',
        text: 'Con <code>@Global()</code>, lo que exporta un módulo está disponible en toda la app sin importarlo en cada sitio (úsalo con moderación). Un <b>módulo dinámico</b> recibe opciones al importarse con un método estático como <code>forRoot()</code>. Así funcionan <code>ConfigModule.forRoot()</code>, <code>JwtModule.register()</code> y <code>TypeOrmModule.forRoot()</code>.',
        file: 'correo.module.ts',
        code: `import { DynamicModule, Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [{ provide: 'APP_NOMBRE', useValue: 'CodeRush' }],
  exports: ['APP_NOMBRE'],
})
export class ComunModule {}

@Module({})
export class CorreoModule {
  // Se configura al importarlo: imports: [CorreoModule.forRoot({ remitente: 'hola@app.com' })]
  static forRoot(opciones: { remitente: string }): DynamicModule {
    return {
      module: CorreoModule,
      providers: [{ provide: 'OPCIONES_CORREO', useValue: opciones }],
      exports: ['OPCIONES_CORREO'],
    };
  }
}`,
      },
    ],
    quiz: [
      { q: '<code>ProductosService</code> está en <code>providers</code> de <code>ProductosModule</code>. ¿Puede usarlo <code>PedidosModule</code>?', options: ['Sí, siempre', 'Solo si <code>ProductosModule</code> lo exporta y <code>PedidosModule</code> importa <code>ProductosModule</code>', 'Solo si está en <code>controllers</code>', 'Solo con <code>@Global</code>'], answer: 1, why: 'Hacen falta las dos cosas: exportarlo desde su módulo e importar ese módulo donde se usa.' },
      { q: '¿Qué va en el array <code>imports</code> de un módulo?', options: ['Servicios', 'Otros módulos', 'Controladores', 'DTOs'], answer: 1, why: 'Solo módulos (también los dinámicos, como <code>ConfigModule.forRoot()</code>).' },
      { q: '¿Qué tienen en común <code>ConfigModule.forRoot()</code> y <code>TypeOrmModule.forRoot()</code>?', options: ['Nada', 'Son módulos dinámicos: se configuran con opciones al importarlos', 'Son controladores', 'Solo funcionan en <code>main.ts</code>'], answer: 1, why: 'Devuelven un <code>DynamicModule</code> con proveedores preparados según las opciones.' },
    ],
  },

  // ───────────────────────────── 05 ─────────────────────────────
  {
    id: 'nest-validacion',
    title: 'DTOs y validación',
    summary: 'Describir los datos de entrada con class-validator y rechazar lo inválido con ValidationPipe.',
    activities: ['validacion-dto'],
    sections: [
      {
        title: 'Un DTO con class-validator',
        text: 'Un <b>DTO</b> (Data Transfer Object) es una clase que describe la forma de los datos que llegan. Con los decoradores de <code>class-validator</code> declaras las reglas de cada propiedad. Tiene que ser una <b>clase</b> y no una interfaz: las interfaces desaparecen al compilar y Nest no podría leer sus reglas.',
        file: 'crear-cliente.dto.ts',
        code: `import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  @Max(120)
  edad: number;

  @IsOptional() // si llega, debe ser texto; si no llega, no pasa nada
  @IsString()
  telefono?: string;
}`,
      },
      {
        title: 'Activar ValidationPipe',
        text: 'Los decoradores no hacen nada por sí solos: hace falta <code>ValidationPipe</code>, normalmente global. Si algo no cumple las reglas, responde <b>400</b> con la lista de errores, y tu método ni se ejecuta. Opciones clave: <code>whitelist</code> quita las propiedades sin decoradores, <code>forbidNonWhitelisted</code> responde 400 si llegan, y <code>transform</code> convierte el cuerpo en una instancia del DTO.',
        file: 'clientes.controller.ts',
        code: `import { Body, Controller, INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { CrearClienteDto } from './crear-cliente.dto';

@Controller('clientes')
export class ClientesController {
  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return dto; // si llega aquí, los datos ya son válidos
  }
}

// En main.ts (o en configurar(app) dentro de CodeRush)
export function configurar(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}`,
      },
      {
        title: 'Objetos anidados y DTOs derivados',
        text: 'Para validar objetos dentro de otros, <code>@ValidateNested()</code> necesita saber de qué clase es cada uno: eso lo indica <code>@Type()</code> de <code>class-transformer</code>. Para no repetir reglas, <code>PartialType</code> crea un DTO con las mismas propiedades pero todas opcionales, ideal para <code>PATCH</code>. Viene en <code>@nestjs/mapped-types</code>, o en <code>@nestjs/swagger</code> si usas Swagger.',
        file: 'pedido.dto.ts',
        code: `import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class LineaDto {
  @IsInt() productoId: number;
  @IsInt() @Min(1) cantidad: number;
}

export class CrearPedidoDto {
  @IsString()
  cliente: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaDto) // convierte cada objeto en LineaDto para validarlo
  lineas: LineaDto[];
}

// Mismas reglas, todas las propiedades opcionales
export class ActualizarPedidoDto extends PartialType(CrearPedidoDto) {}`,
      },
    ],
    quiz: [
      { q: 'Pones <code>@IsEmail()</code> en el DTO, pero un email inválido se acepta igual. ¿Qué falta?', options: ['Un <code>@Post</code>', 'Activar <code>ValidationPipe</code>', 'Instalar Swagger', 'Un <code>return</code>'], answer: 1, why: 'El pipe es quien lee los decoradores y valida. Sin él, las reglas se ignoran.' },
      { q: '¿Qué hace la opción <code>whitelist: true</code>?', options: ['Valida solo emails', 'Elimina del cuerpo las propiedades que no tienen decoradores en el DTO', 'Permite cualquier dato', 'Convierte números'], answer: 1, why: 'Evita que se cuelen datos no previstos (como <code>rol: "admin"</code>). Con <code>forbidNonWhitelisted</code> además se rechazan.' },
      { q: 'Para un <code>PATCH</code> en el que todas las propiedades son opcionales, lo más práctico es…', options: ['Copiar el DTO y borrar los decoradores', '<code>class ActualizarDto extends PartialType(CrearDto) {}</code>', 'Usar <code>any</code>', 'No validar'], answer: 1, why: 'Reutilizas las reglas sin duplicarlas: si cambias el DTO de creación, el de actualización lo sigue.' },
    ],
  },

  // ───────────────────────────── 06 ─────────────────────────────
  {
    id: 'nest-errores',
    title: 'Excepciones y filtros',
    summary: 'Responder errores HTTP con las excepciones de Nest y personalizar su formato.',
    activities: ['crud-tareas', 'filtro-excepciones'],
    sections: [
      {
        title: 'Excepciones HTTP integradas',
        text: 'Para responder con un error, <b>lanza</b> una excepción desde cualquier punto: un controlador, un servicio o un guard. Nest la atrapa y envía el código y un cuerpo estándar. Cualquier otro error, como un <code>TypeError</code> por un bug, se convierte en <b>500</b> "Internal server error", y el detalle queda solo en los logs del servidor.',
        file: 'cuentas.service.ts',
        code: `import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CuentasService {
  private cuentas = [{ id: 1, titular: 'Ana', saldo: 100 }];

  retirar(id: number, monto: number) {
    const cuenta = this.cuentas.find((c) => c.id === id);
    if (!cuenta) throw new NotFoundException(\`La cuenta \${id} no existe\`); // 404
    if (monto <= 0) throw new BadRequestException('El monto debe ser positivo'); // 400
    if (monto > cuenta.saldo) throw new ConflictException('Saldo insuficiente'); // 409
    cuenta.saldo -= monto;
    return cuenta;
  }
}
// Un 404 responde: { "statusCode": 404, "message": "La cuenta 9 no existe", "error": "Not Found" }`,
      },
      {
        title: 'Excepciones propias',
        text: 'Extiende <code>HttpException</code> para crear errores con nombre propio y con el cuerpo que necesites. <code>HttpStatus</code> tiene todos los códigos con nombre, para no escribir números sueltos.',
        file: 'limite.exception.ts',
        code: `import { HttpException, HttpStatus } from '@nestjs/common';

export class LimiteExcedidoException extends HttpException {
  constructor(limite: number) {
    super({ codigo: 'LIMITE', mensaje: \`Máximo \${limite} por día\` }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

// throw new LimiteExcedidoException(3)
// → 429 { "codigo": "LIMITE", "mensaje": "Máximo 3 por día" }`,
      },
      {
        title: 'Filtros de excepciones',
        text: 'Un <b>filtro</b> decide cómo se responde a un error. <code>@Catch(Tipo)</code> indica qué errores atrapa; sin argumentos los atrapa todos. Desde <code>host.switchToHttp()</code> accedes a la petición y a la respuesta. Se aplica a toda la app con <code>app.useGlobalFilters()</code>, o a un controlador o método con <code>@UseFilters()</code>.',
        file: 'todo-error.filter.ts',
        code: `import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch() // sin argumentos: atrapa cualquier error
export class TodoErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse();
    const esHttp = error instanceof HttpException;
    const estado = esHttp ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    respuesta.status(estado).json({
      ok: false,
      codigo: estado,
      detalle: esHttp ? error.message : 'Error interno',
    });
  }
}

// Global:      app.useGlobalFilters(new TodoErrorFilter());
// Localizado:  @UseFilters(TodoErrorFilter) sobre un controlador o método`,
      },
    ],
    quiz: [
      { q: '¿Qué responde Nest si un método lanza <code>new NotFoundException(\'No está\')</code>?', options: ['500', '404 con <code>{ statusCode, message, error }</code>', '200 vacío', 'El servidor se cae'], answer: 1, why: 'Las excepciones HTTP llevan su código y Nest construye la respuesta estándar.' },
      { q: 'Un método lanza un <code>TypeError</code> por un bug. ¿Qué recibe el cliente?', options: ['El mensaje del <code>TypeError</code>', '500 "Internal server error"; el detalle queda en los logs', '404', '400'], answer: 1, why: 'Nest no expone los detalles de errores inesperados: podrían revelar información interna.' },
      { q: '¿Qué atrapa <code>@Catch(HttpException)</code>?', options: ['Todos los errores', 'Solo las excepciones HTTP (<code>NotFoundException</code>, <code>BadRequestException</code>…)', 'Solo los errores 500', 'Nada'], answer: 1, why: 'Las excepciones HTTP heredan de <code>HttpException</code>. Para atrapar todo, usa <code>@Catch()</code> sin argumentos.' },
    ],
  },

  // ───────────────────────────── 07 ─────────────────────────────
  {
    id: 'nest-ciclo',
    title: 'Middleware, guards, interceptores y pipes',
    summary: 'Las piezas que actúan antes y después del controlador, y en qué orden.',
    activities: ['guard-api-key', 'interceptor-respuesta', 'calculadora-query', 'jwt-login'],
    sections: [
      {
        title: 'El recorrido de una petición',
        text: 'Antes de llegar a tu método, una petición atraviesa varias capas, siempre en este orden: <b>middleware</b> → <b>guards</b> (¿puede pasar?) → <b>interceptores</b> (antes) → <b>pipes</b> (transforman y validan los argumentos) → <b>controlador</b> → <b>interceptores</b> (después, con la respuesta). Si algo lanza un error, lo atrapan los <b>filtros</b>. El middleware es la capa más simple: recibe la petición y llama a <code>next()</code>.',
        file: 'registro.middleware.ts',
        code: `import { Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';

@Injectable()
export class RegistroMiddleware implements NestMiddleware {
  use(req: { method: string; url: string }, res: unknown, next: () => void) {
    console.log(\`\${req.method} \${req.url}\`);
    next(); // sin next() la petición se queda colgada
  }
}

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RegistroMiddleware).forRoutes('libros');
  }
}`,
      },
      {
        title: 'Guards: ¿puede pasar?',
        text: 'Un guard implementa <code>CanActivate</code>: si <code>canActivate</code> devuelve <code>true</code>, la petición sigue; si devuelve <code>false</code>, Nest responde <b>403</b>. Para responder 401 (no autenticado), lanza <code>UnauthorizedException</code>. Con <code>SetMetadata</code> puedes marcar rutas (por ejemplo, con los roles que piden) y leer esa marca desde el guard con <code>Reflector</code>.',
        file: 'roles.guard.ts',
        code: `import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const requeridos = this.reflector.get<string[]>('roles', contexto.getHandler());
    if (!requeridos) return true; // la ruta no pide roles
    const { usuario } = contexto.switchToHttp().getRequest();
    return requeridos.includes(usuario?.rol); // false → 403 Forbidden
  }
}

// Uso:  @Get('informes') @UseGuards(RolesGuard) @Roles('admin') informes() { … }`,
      },
      {
        title: 'Interceptores y pipes propios',
        text: 'Un <b>interceptor</b> envuelve la ejecución del método: puede hacer algo antes, y después transformar la respuesta con operadores de <code>rxjs</code> (<code>map</code>, <code>tap</code>…), porque <code>next.handle()</code> es un Observable. Un <b>pipe</b> propio implementa <code>PipeTransform</code>: recibe el valor, lo valida o lo convierte, y devuelve el resultado (o lanza un 400).',
        file: 'tiempo.interceptor.ts',
        code: `import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor, PipeTransform } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TiempoInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, next: CallHandler): Observable<unknown> {
    const inicio = Date.now(); // antes del controlador
    return next.handle().pipe(
      tap(() => console.log(\`Respondió en \${Date.now() - inicio} ms\`)), // después
    );
  }
}

@Injectable()
export class CodigoPostalPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (valor.length !== 5 || Number.isNaN(Number(valor))) {
      throw new BadRequestException('El código postal debe tener 5 dígitos');
    }
    return valor;
  }
}

// @Get(':cp') buscar(@Param('cp', CodigoPostalPipe) cp: string) { … }`,
      },
    ],
    quiz: [
      { q: '¿En qué orden actúan sobre una petición?', options: ['Pipes → guards → controlador', 'Middleware → guards → interceptores → pipes → controlador', 'Controlador → guards → pipes', 'Guards → middleware → controlador'], answer: 1, why: 'Primero se decide si puede pasar (guards); los pipes preparan los argumentos justo antes del método.' },
      { q: 'Un guard devuelve <code>false</code>. ¿Qué responde Nest?', options: ['401', '403 Forbidden', '404', '200'], answer: 1, why: '<code>false</code> significa "prohibido". Para 401, lanza <code>UnauthorizedException</code> desde el guard.' },
      { q: '¿Qué pieza usarías para cambiar el formato de todas las respuestas correctas?', options: ['Un guard', 'Un interceptor', 'Un pipe', 'Un filtro de excepciones'], answer: 1, why: 'El interceptor recibe la respuesta del método y puede transformarla. Los filtros solo actúan ante errores.' },
    ],
  },

  // ───────────────────────────── 08 ─────────────────────────────
  {
    id: 'nest-config',
    title: 'Configuración con @nestjs/config',
    summary: 'Variables de entorno, archivos .env y configuración validada al arrancar.',
    activities: ['configuracion'],
    sections: [
      {
        title: 'ConfigModule y ConfigService',
        text: '<code>ConfigModule.forRoot()</code> carga el archivo <code>.env</code> y las variables de entorno. Después inyectas <code>ConfigService</code> y lees cada valor con <code>get()</code>, que acepta un valor por defecto. Recuerda que las variables de entorno siempre son <b>texto</b>: convierte los números y los booleanos. Con <code>isGlobal: true</code> no tienes que importar el módulo en cada sitio.',
        file: 'app.module.ts',
        code: `import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Controller('estado')
export class EstadoController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  estado() {
    return {
      entorno: this.config.get<string>('NODE_ENV', 'development'),
      puerto: Number(this.config.get('PORT', 3000)), // las variables son texto
    };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [EstadoController],
})
export class AppModule {}`,
      },
      {
        title: 'El archivo .env',
        text: 'Cada entorno (tu equipo, pruebas, producción) tiene sus propios valores: guárdalos en un <code>.env</code> en la raíz del proyecto, <b>fuera del repositorio</b> (añádelo a <code>.gitignore</code>). Sube en su lugar un <code>.env.example</code> con las claves y sin valores secretos, para que el equipo sepa qué definir.',
        file: '.env',
        lang: 'shell',
        code: `# No subas este archivo al repositorio
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://usuario:clave@localhost:5432/tienda
JWT_SECRET=cambia-esto-en-produccion`,
      },
      {
        title: 'Configuración agrupada y validada',
        text: 'Con <code>registerAs</code> agrupas valores relacionados bajo un nombre (<code>config.get(\'db.url\')</code>). Con <code>validate</code> compruebas el entorno al arrancar: es mejor que la app no arranque a que falle más tarde por una variable que falta. <code>getOrThrow()</code> lanza un error claro si el valor no existe.',
        file: 'app.module.ts',
        code: `import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';

export const baseDeDatos = registerAs('db', () => ({
  url: process.env.DATABASE_URL,
  registros: process.env.DB_LOGS === 'true',
}));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [baseDeDatos], // config.get('db.url')
      validate: (env) => {
        if (!env.JWT_SECRET) throw new Error('Falta JWT_SECRET en el entorno');
        return env;
      },
    }),
  ],
})
export class AppModule {}

// En un servicio: this.config.getOrThrow<string>('db.url')`,
      },
    ],
    quiz: [
      { q: 'Con <code>PORT=3000</code> en el <code>.env</code>, ¿de qué tipo es <code>config.get(\'PORT\')</code>?', options: ['<code>number</code>', '<code>string</code>: las variables de entorno siempre son texto', '<code>boolean</code>', '<code>undefined</code>'], answer: 1, why: 'El sistema operativo guarda las variables como texto. Conviértelas con <code>Number()</code> o valida y transforma el entorno.' },
      { q: '¿Para qué sirve <code>isGlobal: true</code>?', options: ['Para leer las variables del sistema', 'Para inyectar <code>ConfigService</code> en cualquier módulo sin volver a importar <code>ConfigModule</code>', 'Para cifrar el <code>.env</code>', 'Para usar varios <code>.env</code>'], answer: 1, why: 'Registra el módulo como global, igual que <code>@Global()</code>.' },
      { q: '¿Por qué no se sube el <code>.env</code> al repositorio?', options: ['Pesa mucho', 'Contiene secretos y cada entorno tiene los suyos', 'Git no lo permite', 'Nest lo borra'], answer: 1, why: 'Una clave subida a un repositorio debe considerarse filtrada, aunque después la borres.' },
    ],
  },

  // ───────────────────────────── 09 ─────────────────────────────
  {
    id: 'nest-typeorm',
    title: 'Bases de datos con TypeORM',
    summary: 'Entidades, conexión, repositorios y consultas con el ORM más usado en Nest.',
    activities: ['typeorm-libros'],
    sections: [
      {
        title: 'Entidades',
        text: 'Una <b>entidad</b> es una clase que representa una tabla: cada propiedad con <code>@Column()</code> es una columna. <code>@PrimaryGeneratedColumn()</code> crea un id que se autoincrementa. Las relaciones se declaran con <code>@ManyToOne</code>, <code>@OneToMany</code> y <code>@ManyToMany</code>.',
        file: 'entidades.ts',
        code: `import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Autor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Articulo, (articulo) => articulo.autor)
  articulos: Articulo[];
}

@Entity()
export class Articulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  titulo: string;

  @Column({ default: false })
  publicado: boolean;

  @CreateDateColumn()
  creado: Date;

  @ManyToOne(() => Autor, (autor) => autor.articulos)
  autor: Autor;
}`,
      },
      {
        title: 'Conectar y registrar',
        text: '<code>TypeOrmModule.forRoot()</code> abre la conexión una vez, en el módulo raíz. Su versión <code>forRootAsync</code> permite leer la URL desde <code>ConfigService</code>. <code>forFeature([Entidad])</code> registra los repositorios que podrá inyectar cada módulo. <code>synchronize: true</code> crea las tablas automáticamente: es cómodo en desarrollo, pero en producción usa <b>migraciones</b>.',
        file: 'app.module.ts',
        code: `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Articulo, Autor } from './entidades';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // en producción, migraciones
      }),
    }),
    TypeOrmModule.forFeature([Articulo, Autor]), // habilita @InjectRepository
  ],
})
export class AppModule {}`,
      },
      {
        title: 'Repositorios y consultas',
        text: 'El <b>repositorio</b> de una entidad tiene los métodos para leer y escribir: <code>find</code>, <code>findOneBy</code>, <code>save</code> (inserta, o actualiza si ya tiene id), <code>delete</code>… Las consultas más complejas se escriben con el <code>QueryBuilder</code>. Ojo: <code>findOneBy</code> devuelve <code>null</code> si no encuentra nada, así que el 404 lo decides tú.',
        file: 'articulos.service.ts',
        code: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Articulo } from './entidades';

@Injectable()
export class ArticulosService {
  constructor(@InjectRepository(Articulo) private readonly repo: Repository<Articulo>) {}

  publicados() {
    return this.repo.find({ where: { publicado: true }, order: { creado: 'DESC' }, relations: { autor: true } });
  }

  async publicar(id: number) {
    const articulo = await this.repo.findOneBy({ id });
    if (!articulo) throw new NotFoundException();
    articulo.publicado = true;
    return this.repo.save(articulo); // UPDATE porque ya tiene id
  }

  contarPorAutor() {
    return this.repo
      .createQueryBuilder('a')
      .select('a.autorId', 'autor')
      .addSelect('COUNT(*)', 'total')
      .groupBy('a.autorId')
      .getRawMany();
  }
}`,
      },
    ],
    quiz: [
      { q: 'Inyectas <code>@InjectRepository(Libro)</code> y Nest no puede resolverlo. ¿Qué falta?', options: ['<code>@Entity</code>', '<code>TypeOrmModule.forFeature([Libro])</code> en el módulo', 'Un <code>@Column</code>', '<code>synchronize</code>'], answer: 1, why: '<code>forFeature</code> es lo que crea el proveedor del repositorio en ese módulo.' },
      { q: '¿Qué hace <code>synchronize: true</code>?', options: ['Hace copias de seguridad', 'Crea y modifica las tablas según las entidades al arrancar: cómodo en desarrollo, peligroso en producción', 'Sincroniza varios servidores', 'Valida los datos'], answer: 1, why: 'Un cambio en una entidad podría borrar una columna con datos reales. En producción se usan migraciones.' },
      { q: '¿Qué devuelve <code>repo.findOneBy({ id: 99 })</code> si no existe?', options: ['Lanza <code>NotFoundException</code>', '<code>null</code>: tú decides si responder 404', 'Un objeto vacío', 'Un error 500'], answer: 1, why: 'TypeORM no sabe de HTTP. Comprueba el resultado y lanza <code>NotFoundException</code> si corresponde.' },
    ],
  },

  // ───────────────────────────── 10 ─────────────────────────────
  {
    id: 'nest-jwt',
    title: 'Autenticación con JWT',
    summary: 'Emitir y verificar tokens, registrar JwtModule y guardar contraseñas de forma segura.',
    activities: ['jwt-login'],
    sections: [
      {
        title: 'Emitir y verificar tokens',
        text: 'Un <b>JWT</b> tiene tres partes: cabecera, contenido (<i>payload</i>) y firma. El contenido se puede <b>leer</b> sin la clave (solo está codificado en base64), pero no se puede <b>modificar</b> sin invalidar la firma. Por eso pon en él identificadores y roles, nunca contraseñas. <code>JwtService</code> firma con <code>signAsync</code> y comprueba con <code>verifyAsync</code>, que <b>lanza un error</b> si el token es falso o ha caducado.',
        file: 'tokens.service.ts',
        code: `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokensService {
  constructor(private readonly jwt: JwtService) {}

  emitir(usuarioId: number, rol: string) {
    // "sub" (subject) es el nombre estándar para el id del usuario
    return this.jwt.signAsync({ sub: usuarioId, rol });
  }

  async leer(token: string) {
    try {
      return await this.jwt.verifyAsync<{ sub: number; rol: string }>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o caducado');
    }
  }
}`,
      },
      {
        title: 'Registrar JwtModule',
        text: 'El módulo necesita la clave con la que se firma: léela de la configuración y nunca la escribas en el código. Con <code>registerAsync</code> puedes inyectar <code>ConfigService</code>. Una caducidad corta (<code>expiresIn</code>) limita el daño si un token se filtra.',
        file: 'auth.module.ts',
        code: `import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
})
export class AuthModule {}`,
      },
      {
        title: 'Contraseñas y el flujo completo',
        text: 'Las contraseñas nunca se guardan tal cual: se guarda un <b>hash con sal</b>, que no se puede revertir. Aquí se usa <code>scrypt</code>, que viene con Node; la librería <code>bcrypt</code> es otra opción muy popular. El flujo completo: el cliente envía usuario y clave a <code>/auth/login</code>, el servidor comprueba el hash y firma un JWT, y el cliente lo envía en cada petición en la cabecera <code>Authorization: Bearer &lt;token&gt;</code>, donde un guard lo verifica.',
        file: 'claves.ts',
        code: `import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashear(clave: string) {
  const sal = randomBytes(16).toString('hex');
  return \`\${sal}:\${scryptSync(clave, sal, 64).toString('hex')}\`;
}

export function comprobar(clave: string, guardado: string) {
  const [sal, hash] = guardado.split(':');
  // timingSafeEqual compara sin revelar pistas por el tiempo que tarda
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(clave, sal, 64));
}`,
      },
    ],
    quiz: [
      { q: '¿Se puede leer el contenido de un JWT sin la clave secreta?', options: ['No, está cifrado', 'Sí: solo está codificado. La firma impide modificarlo, no leerlo', 'Solo el servidor puede', 'Solo si ha caducado'], answer: 1, why: 'Cualquiera puede decodificar el payload. Nunca pongas datos sensibles en él.' },
      { q: '¿Dónde envía el cliente el token normalmente?', options: ['En la URL', 'En la cabecera <code>Authorization: Bearer &lt;token&gt;</code>', 'En el cuerpo de cada GET', 'Siempre en una cookie'], answer: 1, why: 'Es la convención de los tokens <i>Bearer</i>, y la que esperan Swagger y Passport.' },
      { q: '<code>verifyAsync</code> recibe un token manipulado y no está dentro de un <code>try/catch</code>. ¿Qué pasa?', options: ['Devuelve <code>null</code>', 'Lanza un error y el cliente recibe 500 en vez de 401', 'Devuelve el payload', 'Nada'], answer: 1, why: 'El error de la librería no es una excepción HTTP: atrápalo y lanza <code>UnauthorizedException</code>.' },
    ],
  },

  // ───────────────────────────── 11 ─────────────────────────────
  {
    id: 'nest-swagger',
    title: 'Documentar la API con Swagger',
    summary: 'Generar documentación OpenAPI interactiva a partir de tus controladores y DTOs.',
    activities: ['swagger-docs'],
    sections: [
      {
        title: 'Generar la documentación',
        text: '<code>@nestjs/swagger</code> recorre tus controladores y genera un documento <b>OpenAPI</b>. <code>SwaggerModule.setup(\'docs\', …)</code> publica una interfaz web en <code>/docs</code>, donde se pueden probar las rutas, y el JSON en <code>/docs-json</code>, que sirve para generar clientes automáticamente.',
        file: 'swagger.ts',
        code: `import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configurarSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API de la tienda')
    .setDescription('Productos, pedidos y clientes')
    .setVersion('2.1')
    .addBearerAuth() // botón "Authorize" para probar rutas con JWT
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento); // interfaz en /docs, JSON en /docs-json
}`,
      },
      {
        title: 'Describir rutas y modelos',
        text: '<code>@ApiTags</code> agrupa las rutas, <code>@ApiOperation</code> las describe y <code>@ApiResponse</code> documenta cada respuesta posible. En los DTOs, <code>@ApiProperty</code> hace que la propiedad aparezca en el esquema, con su ejemplo y su descripción. <code>@ApiBearerAuth</code> indica que la ruta pide token.',
        file: 'clientes.controller.ts',
        code: `import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';

export class CrearClienteDto {
  @ApiProperty({ example: 'Ana Pérez', description: 'Nombre completo' })
  nombre: string;

  @ApiPropertyOptional({ example: 'ana@correo.com' })
  email?: string;
}

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
  @Post()
  @ApiOperation({ summary: 'Registrar un cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  crear(@Body() dto: CrearClienteDto) {
    return dto;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un cliente' })
  @ApiResponse({ status: 404, description: 'No existe' })
  uno(@Param('id') id: string) {
    return { id };
  }
}`,
      },
      {
        title: 'Menos repetición',
        text: 'El <b>plugin de la CLI</b> añade <code>@ApiProperty</code> automáticamente a partir de los tipos de TypeScript, así que solo tienes que escribir los ejemplos y descripciones. Se activa en <code>nest-cli.json</code>. Si usas Swagger, importa <code>PartialType</code> desde <code>@nestjs/swagger</code>: así el DTO derivado también conserva la documentación.',
        file: 'nest-cli.json',
        lang: 'json',
        code: `{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}`,
      },
    ],
    quiz: [
      { q: '¿Qué decorador hace que una propiedad del DTO aparezca en el esquema de Swagger?', options: ['<code>@IsString</code>', '<code>@ApiProperty</code>', '<code>@Column</code>', '<code>@Body</code>'], answer: 1, why: 'Swagger no lee los decoradores de validación: necesita <code>@ApiProperty</code> (o el plugin de la CLI).' },
      { q: 'Con <code>SwaggerModule.setup(\'docs\', app, documento)</code>, ¿dónde está el JSON de OpenAPI?', options: ['<code>/docs</code>', '<code>/docs-json</code>', '<code>/swagger.json</code>', '<code>/api</code>'], answer: 1, why: 'La interfaz web queda en <code>/docs</code> y el documento en <code>/docs-json</code> (y <code>/docs-yaml</code>).' },
      { q: 'En un proyecto con Swagger, ¿por qué importar <code>PartialType</code> desde <code>@nestjs/swagger</code>?', options: ['Es más rápido', 'Así el DTO derivado también conserva la documentación de sus propiedades', 'No hay ninguna diferencia', 'El otro paquete no existe'], answer: 1, why: 'La versión de Swagger copia también los metadatos de <code>@ApiProperty</code>.' },
    ],
  },

  // ───────────────────────────── 12 ─────────────────────────────
  {
    id: 'nest-testing',
    title: 'Pruebas con @nestjs/testing',
    summary: 'Pruebas unitarias con módulos de prueba, mocks de dependencias y pruebas de extremo a extremo.',
    activities: [],
    sections: [
      {
        title: 'Pruebas unitarias de un servicio',
        text: '<code>Test.createTestingModule()</code> crea un módulo de Nest aislado para la prueba, con la inyección de dependencias funcionando, y <code>get()</code> te entrega la instancia. Los proyectos creados con la CLI ya traen <b>Jest</b> configurado: <code>npm test</code> ejecuta los archivos <code>*.spec.ts</code>.',
        file: 'notas.service.spec.ts',
        code: `import { Test } from '@nestjs/testing';
import { NotasService } from './notas.service';

describe('NotasService', () => {
  let servicio: NotasService;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      providers: [NotasService],
    }).compile();
    servicio = modulo.get(NotasService);
  });

  it('crea notas con ids consecutivos', () => {
    expect(servicio.crear('a').id).toBe(1);
    expect(servicio.crear('b').id).toBe(2);
  });
});`,
      },
      {
        title: 'Sustituir dependencias con mocks',
        text: 'Para probar un servicio sin base de datos, regístrale un <b>mock</b>: un objeto con los mismos métodos que devuelve datos preparados. <code>getRepositoryToken(Entidad)</code> es el token con el que TypeORM registra cada repositorio. <code>jest.fn()</code> crea funciones falsas que recuerdan cómo se las llamó.',
        file: 'articulos.service.spec.ts',
        code: `import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ArticulosService } from './articulos.service';
import { Articulo } from './entidades';

it('publica un artículo existente', async () => {
  const repo = {
    findOneBy: jest.fn().mockResolvedValue({ id: 1, publicado: false }),
    save: jest.fn((a) => Promise.resolve(a)),
  };
  const modulo = await Test.createTestingModule({
    providers: [ArticulosService, { provide: getRepositoryToken(Articulo), useValue: repo }],
  }).compile();

  const resultado = await modulo.get(ArticulosService).publicar(1);
  expect(resultado.publicado).toBe(true);
  expect(repo.save).toHaveBeenCalledTimes(1);
});`,
      },
      {
        title: 'Pruebas de extremo a extremo',
        text: 'Una prueba <b>e2e</b> arranca la aplicación completa y le hace peticiones HTTP reales con <code>supertest</code>. Es exactamente lo que hace CodeRush para revisar tus actividades: arranca tu <code>AppModule</code>, envía cada petición y compara el código de estado y el cuerpo con lo esperado.',
        file: 'tareas.e2e-spec.ts',
        typed: false,
        code: `import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tareas (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /tareas crea una tarea', () =>
    request(app.getHttpServer())
      .post('/tareas')
      .send({ titulo: 'Leer' })
      .expect(201)
      .expect({ id: 1, titulo: 'Leer', hecha: false }));
});`,
      },
    ],
    quiz: [
      { q: '¿Qué hace <code>Test.createTestingModule({ … }).compile()</code>?', options: ['Compila TypeScript', 'Crea un módulo de Nest aislado para la prueba, con la inyección de dependencias funcionando', 'Arranca el servidor en producción', 'Genera Swagger'], answer: 1, why: 'Te permite montar solo las piezas que quieres probar, con sus dependencias reales o simuladas.' },
      { q: '¿Para qué sirve <code>{ provide: X, useValue: mock }</code> en una prueba?', options: ['Para borrar X', 'Para sustituir X por una versión falsa y probar sin base de datos ni servicios externos', 'Para exportar X', 'Para validar'], answer: 1, why: 'Las pruebas unitarias deben ser rápidas y deterministas: los mocks evitan depender de sistemas externos.' },
      { q: '¿Qué comprueba una prueba e2e con <code>supertest</code>?', options: ['Una función suelta', 'La aplicación completa respondiendo a peticiones HTTP reales', 'El estilo del código', 'Solo los DTOs'], answer: 1, why: 'Recorre todo el camino: pipes, guards, controladores, servicios y la respuesta final.' },
    ],
  },
];

// ───────────── Librerías más usadas ─────────────
// typed: true → el paquete está instalado en CodeRush y el ejemplo se compila con sus tipos reales.
export const NEST_LIBRARIES = [
  {
    id: 'config', name: '@nestjs/config', category: 'Configuración', install: 'npm i @nestjs/config', typed: true, lesson: 'nest-config', activity: 'configuracion',
    what: 'Carga las variables de entorno y los archivos <code>.env</code>, con valores por defecto y validación al arrancar.',
    when: 'En cualquier proyecto: claves, URLs de bases de datos y puertos no deben estar escritos en el código.',
    snippet: `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })] })
export class AppModule {}
// Después: constructor(private config: ConfigService) {} → this.config.get('PORT')`,
  },
  {
    id: 'class-validator', name: 'class-validator + class-transformer', category: 'Validación', install: 'npm i class-validator class-transformer', typed: true, lesson: 'nest-validacion', activity: 'validacion-dto',
    what: 'Reglas de validación con decoradores en los DTOs (<code>@IsEmail</code>, <code>@Min</code>…) y conversión de objetos planos en instancias de clase.',
    when: 'Siempre que recibas datos del cliente. Funciona junto con <code>ValidationPipe</code>.',
    snippet: `import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString() @MinLength(3) nombre: string;
  @IsEmail() email: string;
}`,
  },
  {
    id: 'typeorm', name: '@nestjs/typeorm + typeorm', category: 'Base de datos (SQL)', install: 'npm i @nestjs/typeorm typeorm pg', typed: true, lesson: 'nest-typeorm', activity: 'typeorm-libros',
    what: 'ORM con entidades decoradas y repositorios. Funciona con PostgreSQL, MySQL, SQLite, SQL Server y otros (instala el driver de tu base, como <code>pg</code>).',
    when: 'Es la opción más documentada en Nest para bases de datos relacionales.',
    snippet: `import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn() id: number;
  @Column() nombre: string;
  @Column('decimal') precio: number;
}`,
  },
  {
    id: 'prisma', name: 'Prisma', category: 'Base de datos (SQL)', install: 'npm i @prisma/client && npm i -D prisma', typed: false,
    what: 'ORM con su propio archivo de esquema (<code>schema.prisma</code>), del que genera un cliente con tipos exactos para cada consulta. Incluye migraciones.',
    when: 'Alternativa muy popular a TypeORM, con un autocompletado excelente. En Nest se envuelve en un servicio inyectable.',
    snippet: `import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
// En un servicio: this.prisma.producto.findMany({ where: { precio: { lt: 100 } } })`,
  },
  {
    id: 'mongoose', name: '@nestjs/mongoose + mongoose', category: 'Base de datos (NoSQL)', install: 'npm i @nestjs/mongoose mongoose', typed: false,
    what: 'Integración con MongoDB: define los esquemas con decoradores e inyecta modelos con <code>@InjectModel</code>.',
    when: 'Si tu base de datos es MongoDB o tus datos son documentos con estructura flexible.',
    snippet: `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Gato {
  @Prop({ required: true }) nombre: string;
  @Prop() edad: number;
}
export const GatoSchema = SchemaFactory.createForClass(Gato);
// MongooseModule.forFeature([{ name: Gato.name, schema: GatoSchema }])`,
  },
  {
    id: 'jwt', name: '@nestjs/jwt', category: 'Autenticación', install: 'npm i @nestjs/jwt', typed: true, lesson: 'nest-jwt', activity: 'jwt-login',
    what: 'Firma y verifica JSON Web Tokens con <code>JwtService</code>.',
    when: 'Para autenticar APIs sin sesiones de servidor: el cliente guarda el token y lo envía en cada petición.',
    snippet: `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1h' } })],
})
export class AuthModule {}
// this.jwt.signAsync({ sub: usuario.id }) · this.jwt.verifyAsync(token)`,
  },
  {
    id: 'passport', name: '@nestjs/passport + passport-jwt', category: 'Autenticación', install: 'npm i @nestjs/passport passport passport-jwt', typed: false,
    what: 'Integra Passport, que tiene estrategias de autenticación listas para usar: JWT, usuario y contraseña, Google, GitHub…',
    when: 'Cuando quieres varias formas de iniciar sesión o un login social. Para un JWT simple, un guard propio basta.',
    snippet: `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: process.env.JWT_SECRET });
  }
  validate(payload: { sub: number }) {
    return { id: payload.sub }; // queda en req.user
  }
}
// En la ruta: @UseGuards(AuthGuard('jwt'))`,
  },
  {
    id: 'swagger', name: '@nestjs/swagger', category: 'Documentación', install: 'npm i @nestjs/swagger', typed: true, lesson: 'nest-swagger', activity: 'swagger-docs',
    what: 'Genera documentación OpenAPI y una interfaz web interactiva a partir de los controladores y los DTOs.',
    when: 'En cualquier API que vayan a usar otras personas (o tú, dentro de unos meses).',
    snippet: `import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function documentar(app: INestApplication) {
  const config = new DocumentBuilder().setTitle('Mi API').setVersion('1.0').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}`,
  },
  {
    id: 'testing', name: '@nestjs/testing + Jest + supertest', category: 'Pruebas', install: 'npm i -D @nestjs/testing jest supertest', typed: false, lesson: 'nest-testing',
    what: 'Módulos de prueba con inyección de dependencias, mocks de proveedores y peticiones HTTP reales contra la app.',
    when: 'Desde el primer día: la CLI de Nest ya crea un archivo de prueba por cada pieza.',
    snippet: `import { Test } from '@nestjs/testing';
import { TareasService } from './tareas.service';

it('crea tareas', async () => {
  const modulo = await Test.createTestingModule({ providers: [TareasService] }).compile();
  expect(modulo.get(TareasService).crear('Leer').id).toBe(1);
});`,
  },
  {
    id: 'throttler', name: '@nestjs/throttler', category: 'Seguridad', install: 'npm i @nestjs/throttler', typed: false,
    what: 'Limita cuántas peticiones puede hacer un cliente en un intervalo (<i>rate limiting</i>) y responde 429 cuando se pasa.',
    when: 'Para frenar abusos y ataques de fuerza bruta, sobre todo en el login.',
    snippet: `import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])], // 10 peticiones por minuto
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}`,
  },
  {
    id: 'helmet', name: 'helmet', category: 'Seguridad', install: 'npm i helmet', typed: false,
    what: 'Añade cabeceras HTTP de seguridad (contra clickjacking, rastreo de tipos MIME y otros ataques) con una sola línea.',
    when: 'En cualquier API expuesta a internet. Se configura en <code>main.ts</code>.',
    snippet: `import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  await app.listen(3000);
}
bootstrap();`,
  },
  {
    id: 'bcrypt', name: 'bcrypt', category: 'Seguridad', install: 'npm i bcrypt && npm i -D @types/bcrypt', typed: false, lesson: 'nest-jwt',
    what: 'Calcula hashes de contraseñas con sal y un coste ajustable, y los compara de forma segura.',
    when: 'Para guardar contraseñas de usuarios. Nunca las guardes en texto plano.',
    snippet: `import * as bcrypt from 'bcrypt';

export async function registrar(clave: string) {
  return bcrypt.hash(clave, 10); // 10 = coste: más alto, más lento de atacar
}

export async function login(clave: string, hashGuardado: string) {
  return bcrypt.compare(clave, hashGuardado);
}`,
  },
  {
    id: 'schedule', name: '@nestjs/schedule', category: 'Tareas programadas', install: 'npm i @nestjs/schedule', typed: false,
    what: 'Ejecuta métodos periódicamente con expresiones cron, intervalos o temporizadores.',
    when: 'Limpiezas nocturnas, informes diarios, recordatorios por correo…',
    snippet: `import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LimpiezaService {
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  borrarSesionesCaducadas() {
    console.log('Limpiando sesiones…');
  }
}
// Registra ScheduleModule.forRoot() en AppModule`,
  },
  {
    id: 'cache', name: '@nestjs/cache-manager', category: 'Rendimiento', install: 'npm i @nestjs/cache-manager cache-manager', typed: false,
    what: 'Guarda en caché respuestas o valores calculados, en memoria o en Redis.',
    when: 'Para consultas costosas que cambian poco, como catálogos o configuraciones.',
    snippet: `import { Controller, Get, Module, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';

@Controller('catalogo')
@UseInterceptors(CacheInterceptor) // guarda la respuesta de cada GET
export class CatalogoController {
  @Get()
  todo() {
    return [{ id: 1, nombre: 'Teclado' }];
  }
}

@Module({ imports: [CacheModule.register({ ttl: 30_000 })], controllers: [CatalogoController] })
export class CatalogoModule {}`,
  },
  {
    id: 'axios', name: '@nestjs/axios', category: 'Integraciones', install: 'npm i @nestjs/axios axios', typed: false,
    what: 'Cliente HTTP inyectable (<code>HttpService</code>) para llamar a otras APIs desde tus servicios.',
    when: 'Para consumir servicios externos: pagos, clima, otras APIs de tu empresa…',
    snippet: `import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ClimaService {
  constructor(private readonly http: HttpService) {}

  async actual(ciudad: string) {
    const { data } = await firstValueFrom(this.http.get('https://api.ejemplo.com/clima', { params: { ciudad } }));
    return data;
  }
}
// Registra HttpModule en los imports del módulo`,
  },
];

export const nestLessonById = new Map(NEST_LESSONS.map((l) => [l.id, l]));
export const nestLessonsForActivity = (id) => NEST_LESSONS.filter((l) => l.activities.includes(id));

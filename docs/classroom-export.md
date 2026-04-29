# Exportar alumnos de Google Classroom con Apps Script

Este es el camino que vamos a usar en lugar de Takeout. Es más rápido, más
preciso y repetible. Lo hacés **una vez por cada cuenta de Gmail** (7 veces).

## Qué hace

Recorre todos los cursos donde la cuenta es **profesor** (u owner), lista todos
los alumnos con nombre y email, y los vuelca en un Google Sheet nuevo listo
para descargar como CSV.

Columnas del Sheet: `email`, `nombre`, `apellido`, `telefono`, `fuente`,
`curso`, `notas`, `fecha_registro`. Mismo formato que
`data/usuarios-wordpress.csv`.

## Pre-requisitos en cada cuenta

1. Estar logueado en la cuenta de Gmail correspondiente (la que administra
   los cursos).
2. Tener Google Classroom habilitado (si ya tenés cursos ahí, está).

## Paso a paso (repetir por cada cuenta)

### 1. Abrir el editor de Apps Script

Andá a [script.google.com](https://script.google.com) **estando logueado en
la cuenta que vas a exportar**. Click en **Nuevo proyecto**.

### 2. Pegar el código

Borrá el contenido por defecto de `Código.gs` y pegá esto:

```javascript
/**
 * Exporta alumnos de Google Classroom de la cuenta actual
 * a un Google Sheet nuevo en tu Drive.
 *
 * Columnas: email, nombre, apellido, telefono, fuente, curso, notas, fecha_registro.
 *
 * Antes de correr: habilitar "Classroom API" como Advanced Service.
 *   En el editor: Servicios (+) -> Google Classroom API -> Agregar.
 */
function exportarAlumnosClassroom() {
  const miEmail = Session.getActiveUser().getEmail();
  const fuente = 'classroom:' + miEmail;
  const filas = [
    ['email', 'nombre', 'apellido', 'telefono', 'fuente',
     'curso', 'notas', 'fecha_registro']
  ];

  let pageToken = null;
  const cursos = [];
  do {
    const resp = Classroom.Courses.list({
      teacherId: 'me',
      pageSize: 100,
      pageToken: pageToken
    });
    if (resp.courses) cursos.push.apply(cursos, resp.courses);
    pageToken = resp.nextPageToken;
  } while (pageToken);

  Logger.log('Cursos encontrados: ' + cursos.length);

  for (const curso of cursos) {
    Logger.log('-> ' + curso.name + ' (' + curso.courseState + ')');
    let token = null;
    do {
      let resp;
      try {
        resp = Classroom.Courses.Students.list(curso.id, {
          pageSize: 100,
          pageToken: token
        });
      } catch (e) {
        Logger.log('   ERROR listando alumnos: ' + e);
        break;
      }
      const alumnos = resp.students || [];
      for (const a of alumnos) {
        const p = a.profile || {};
        const n = p.name || {};
        const email = (p.emailAddress || '').toLowerCase().trim();
        if (!email) continue;
        filas.push([
          email,
          (n.givenName || '').trim(),
          (n.familyName || '').trim(),
          '',
          fuente,
          curso.name || '',
          'curso_id=' + curso.id + '; courseState=' + curso.courseState,
          ''
        ]);
      }
      token = resp.nextPageToken;
    } while (token);
  }

  const nombreArchivo = 'tmyh-classroom-' + miEmail + '-' +
    Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd-HHmm');
  const ss = SpreadsheetApp.create(nombreArchivo);
  const sh = ss.getActiveSheet();
  sh.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, filas[0].length);

  Logger.log('OK. Filas totales (sin header): ' + (filas.length - 1));
  Logger.log('Sheet creado: ' + ss.getUrl());
}
```

### 3. Habilitar la API de Classroom como servicio avanzado

En el editor de Apps Script, a la izquierda, click en **Servicios (+)**.
Buscá **Google Classroom API**. Identificador `Classroom`. **Agregar**.

### 4. Ejecutar

Arriba: seleccioná la función `exportarAlumnosClassroom` y click en
**Ejecutar**.

- La primera vez te pide permisos. Autorizá con la misma cuenta.
  Google te va a mostrar el cartel "La aplicación no está verificada" —
  click en **Avanzado -> Ir a (nombre proyecto)** y aceptá.
- Tarda entre 10 segundos y un par de minutos según la cantidad de cursos.
- Mirá los logs (`Ver -> Registros` o `Ctrl+Enter`). Al final dice algo como:

  ```text
  OK. Filas totales (sin header): 312
  Sheet creado: https://docs.google.com/spreadsheets/d/...
  ```

### 5. Descargar como CSV

Abrí ese Sheet. Menú **Archivo -> Descargar -> Valores separados por comas
(.csv)**. Guardalo en:

```text
C:\Users\Juan\Desktop\TMyH\data\classroom\<cuenta>.csv
```

Reemplazando `<cuenta>` por un alias corto de la cuenta (`emanuel`, `tmyh`,
etc.), sin espacios. Ej: `data/classroom/emanuel.csv`.

### 6. Repetir los pasos 1 a 5 en las otras 6 cuentas

Cada cuenta produce su propio CSV. Al final vas a tener 7 archivos en
`data/classroom/`.

## Siguiente paso

Cuando tengas los 7 CSVs, corré:

```powershell
py scripts\merge_classroom_csvs.py
py scripts\upload_contactos_to_supabase.py data\usuarios-classroom.csv
```

El primero consolida los 7 CSVs en `data/usuarios-classroom.csv`
(deduplicando por email dentro de cada cuenta, pero dejando las
`inscripciones` separadas por curso). El segundo sube todo a Supabase
con upsert por email y crea las `inscripciones` automaticamente.

## Notas

- Solo lista cursos donde la cuenta es **profesor**. Si sos solo alumno de
  un curso, no aparece (que es lo que queremos).
- Los alumnos sin email publico no se exportan (Classroom a veces tiene
  invitados via link que no revelan el email hasta que se unen).
- Si un curso esta en estado `ARCHIVED`, los alumnos siguen apareciendo
  mientras no lo hayan borrado. Se exporta igual.

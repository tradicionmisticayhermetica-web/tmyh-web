# Unificación de usuarios (Classroom + WordPress/UM → Supabase)

Plan de trabajo en bullets. Sin tablas markdown para evitar problemas de renderizado.

## Objetivo

- Centralizar datos de alumnos/contactos desde varias fuentes (aprox. 7 cuentas Gmail con Google Classroom, usuarios de WordPress con Ultimate Member).
- Guardar en una base Postgres en **Supabase** para reutilizar (login futuro, CRM, automatizaciones).
- Campos mínimos deseados: nombre, apellido, email, curso(s) tomado(s), teléfono si existía, y trazabilidad de **origen** de cada dato.

## Contexto útil

- Sitio WordPress: [tradicionmisticayhermetica.com](https://www.tradicionmisticayhermetica.com/).
- Volumen estimado: del orden de **~2000 personas**; el flujo debe ser por **CSV / script**, no carga manual fila a fila.

## Orden de tareas (checklist)

### Fase 0 — Decisión de modelo

- Elegir si un **mismo email** puede tener varias inscripciones a distintos cursos (recomendado: sí) o un solo registro con cursos concatenados.
- Si eliges varias inscripciones: tabla `contactos` + tabla `inscripciones` (o equivalente).
- Si eliges un solo registro por email: una tabla con columna `cursos` (texto o JSON) y reglas claras de fusión al importar.

### Fase 1 — Proyecto Supabase

- Crear proyecto en Supabase (revisar límites y precios actuales en la documentación oficial de Supabase).
- Definir tablas y columnas acorde a la Fase 0.
- Activar **RLS** en tablas expuestas al cliente; si solo usarás el Dashboard y scripts locales con clave privilegiada, definir igualmente quién puede leer/escribir y no exponer `service_role` en frontend.

### Fase 2 — Exportar desde Google Classroom (por cada cuenta)

- Classroom no ofrece un único “exportar todos los alumnos de todas mis cuentas”; operar **por cuenta** y/o **por curso**.
- Opción A: **Google Takeout** incluyendo datos de Classroom; luego normalizar archivos a CSV con columnas uniformes.
- Opción B: exportes desde la propia interfaz de Classroom (calificaciones/listas) cuando aporten email o identificadores útiles.
- Opción C (más automatizable): **Google Apps Script** + API de Classroom con OAuth, iterando cursos y miembros por cuenta.
- Repetir o scriptar para las **~7 cuentas** hasta tener un CSV unificado o varios CSV con el mismo esquema de columnas.

### Fase 3 — Exportar desde WordPress + Ultimate Member (Donweb)

- Exportar usuarios vía **plugin** compatible con UM que genere CSV (incluyendo user meta: teléfono, etc.).
- Alternativa: export desde **phpMyAdmin** de `wp_users` y `wp_usermeta` y convertir a CSV en hoja de cálculo o script.
- Documentar qué **claves de meta** de UM corresponden a teléfono y a otros campos para mapearlos al esquema de Supabase.

### Fase 4 — Normalización y deduplicación

- Normalizar emails: minúsculas, sin espacios, validación básica.
- Decidir regla de fusión: mismo email en Classroom y WordPress → un contacto, varias filas de inscripción o un solo registro enriquecido.
- Unificar nombres de cursos (misma ortografía / mismo código interno) para no fragmentar reportes.

### Fase 5 — Importación a Supabase

- Generar CSV final en **UTF-8** con cabeceras alineadas al esquema.
- Importar vía **Table Editor → Import** en Supabase o vía `COPY` / script con `upsert` según tamaño y necesidad de re-ejecutar.

### Fase 6 — Verificación

- Contar filas por fuente antes y después.
- Buscar duplicados por email y casos sin email.
- Revisar una muestra manual (por ejemplo 20 filas) de cada fuente.

### Fase 7 — Legal y comunicación (RGPD / buenas prácticas)

- Definir base jurídica del tratamiento y uso previsto (solo gestión de curso vs. marketing vs. nueva cuenta en otra plataforma).
- Informar al alumnado si el uso de los datos cambia de forma relevante.
- Restringir acceso a claves de Supabase; backups y quién administra la base.

## Notas rápidas (sin tablas)

- **Supabase**: Postgres gestionado; plan gratuito suele ser suficiente para miles de filas de este tipo; escalar según tráfico y almacenamiento cuando lo necesites.
- **Classroom con Gmail personal vs Workspace**: influye en qué herramientas de administración central existen; ajusta la Fase 2 según tu caso real.
- **WordPress**: UM guarda mucho en `wp_usermeta`; la exportación buena es la que trae esas columnas ya “aplanadas”.

## Próximos datos que conviene concretar (para afinar el esquema SQL)

- Tipo de cuentas Google: personales `@gmail.com` vs Google Workspace.
- Modelo elegido en Fase 0: contactos + inscripciones vs una sola tabla plana.
- Si el teléfono en UM es obligatorio u opcional y bajo qué nombre de meta aparece en el CSV.

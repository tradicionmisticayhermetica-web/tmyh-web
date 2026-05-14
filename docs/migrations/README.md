# Migraciones — guía y convenciones

Migraciones SQL para Supabase. Se aplican manualmente desde el **SQL
Editor** del dashboard en orden numérico (`001`, `002`, …). Cada archivo
es idempotente (usa `create table if not exists`, `create or replace
function`, etc.) para poder re-aplicar sin romper nada si ya corrió.

---

## Convención de nombres

```
<NN>_<descripcion_corta_snake_case>.sql
```

- `NN` = número de 3 dígitos consecutivo (próximo disponible).
- Descripción breve en español, separada por `_`, sin tildes.
- Ej: `022_cursos_progreso_alumno.sql`.

---

## Estructura recomendada

Cada migración debería tener este orden de secciones:

1. **Cabecera comentada** explicando el "por qué" del cambio.
2. **`create table if not exists`** con `comment on` para columnas
   clave.
3. **Índices** (`create index if not exists`).
4. **Triggers** (`drop trigger if exists ... ; create trigger ...`).
5. **RLS** (`alter table ... enable row level security`) + políticas.
6. **GRANTs explícitos** sobre la tabla a los 3 roles del Data API
   (`anon`, `authenticated`, `service_role`).
7. **Funciones (RPC)** con `security definer`, `set search_path =
   public`.
8. **`GRANT EXECUTE`** sobre cada función a los roles que la consumen.

---

## ⚠️ Cambio importante: GRANTs explícitos (octubre 2026)

A partir del **30 de octubre 2026**, Supabase **deja de otorgar
permisos automáticos** sobre tablas nuevas del schema `public` al Data
API (`supabase-js`, REST, GraphQL).

- **Tablas existentes**: mantienen sus permisos actuales, no se rompen.
- **Tablas nuevas** creadas sin `GRANT` explícito: van a tirar error
  PostgREST 42501.

**Por eso desde ahora toda migración que cree tablas DEBE incluir los
`GRANT` explícitos** (sección 6 de la estructura recomendada arriba).

---

## Template para futuras migraciones

Mirá [`_template.sql`](./_template.sql) para una migración mínima con:

- RLS habilitada.
- Política básica (solo admin lee/escribe).
- GRANTs explícitos sobre la tabla.
- Estructura comentada en español.

---

## Cómo aplicar

1. Abrir el SQL Editor del proyecto en
   [supabase.com/dashboard](https://supabase.com/dashboard).
2. Pegar el contenido del `.sql`.
3. Ejecutar (botón `Run` o `Ctrl+Enter`).
4. Verificar que devuelve "Success. No rows returned" (o filas según
   el caso).
5. Marcarla como aplicada en `docs/PENDIENTES.md` o en el commit que
   la introduce.

---

## Auditoría rápida del estado actual de grants

Cuando haya dudas sobre si una tabla tiene los permisos correctos
para el Data API, pegar este script en el SQL Editor y ver el output:

```sql
-- Tablas del schema public que NO tienen GRANT a roles del Data API.
-- Si una tabla aparece aca, hay que agregarle GRANTs antes de oct/2026.
select
    t.table_name,
    coalesce(string_agg(distinct g.grantee, ', '), '(sin grants)') as grantees
from information_schema.tables t
left join information_schema.role_table_grants g
       on g.table_schema = t.table_schema
      and g.table_name   = t.table_name
      and g.grantee     in ('anon', 'authenticated', 'service_role')
where t.table_schema = 'public'
  and t.table_type   = 'BASE TABLE'
group by t.table_name
order by t.table_name;
```

Para ver los permisos detallados de UNA tabla:

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name   = 'tu_tabla_aca'
order by grantee, privilege_type;
```

---

## Recursos

- [Documentación oficial del cambio Data API
  defaults](https://supabase.com/blog/restricting-data-api-access).
- **Security Advisor** del dashboard de Supabase
  (`Dashboard → Database → Security Advisor`) detecta tablas sin RLS
  habilitada y otros problemas comunes.

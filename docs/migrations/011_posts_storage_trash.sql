-- =============================================================================
-- Migracion 011: Storage RLS + papelera + posts historicos
-- =============================================================================
-- 1. Storage RLS: permite a los admins subir imagenes al bucket blog-images.
-- 2. Papelera: agrega columna eliminado_en a posts + estado 'papelera'.
-- 3. Posts historicos: inserta los 3 posts hardcodeados del sitio viejo en
--    la tabla posts (con HTML generado desde los parrafos originales) para
--    que no se pierdan y sean editables desde el panel.
--
-- Idempotente. Aplicar en SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Storage RLS: blog-images
-- =============================================================================
-- Lectura publica (cualquiera puede ver las imagenes del blog)
drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read"
on storage.objects for select
using ( bucket_id = 'blog-images' );

-- Solo admins pueden subir imagenes
drop policy if exists "blog_images_admin_insert" on storage.objects;
create policy "blog_images_admin_insert"
on storage.objects for insert
with check (
    bucket_id = 'blog-images'
    and public.es_admin()
);

-- Solo admins pueden actualizar o reemplazar
drop policy if exists "blog_images_admin_update" on storage.objects;
create policy "blog_images_admin_update"
on storage.objects for update
using (
    bucket_id = 'blog-images'
    and public.es_admin()
);

-- Solo admins pueden eliminar imagenes
drop policy if exists "blog_images_admin_delete" on storage.objects;
create policy "blog_images_admin_delete"
on storage.objects for delete
using (
    bucket_id = 'blog-images'
    and public.es_admin()
);

-- =============================================================================
-- 2. Papelera de posts
-- =============================================================================
-- Agrega columna eliminado_en. NULL = no eliminado. Con valor = en papelera.
-- Los posts en papelera se eliminan definitivamente con DELETE en BBDD (el
-- admin lo decide desde el panel) o automaticamente a los 30 dias via pg_cron.
alter table public.posts
    add column if not exists eliminado_en timestamptz default null;

comment on column public.posts.eliminado_en is
    'Cuando el admin mueve un post a la papelera se setea a now(). NULL = activo.
    Los posts con este valor se ocultan del blog publico y del listado normal.
    El admin los puede ver en la seccion Papelera y restaurarlos o eliminarlos
    definitivamente. Limpieza automatica a los 30 dias via pg_cron (si se activa).';

create index if not exists posts_eliminado_idx
    on public.posts (eliminado_en)
    where eliminado_en is not null;

-- Actualizar la RLS publica para excluir posts en papelera
drop policy if exists posts_public_select on public.posts;
create policy posts_public_select on public.posts
    for select using (
        (estado = 'publicado' and eliminado_en is null)
        or public.es_admin()
    );

-- RPC para mover a papelera (soft delete)
create or replace function public.mover_post_a_papelera(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.posts
       set eliminado_en = now(),
           estado = 'archivado'
     where id = p_post_id;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

-- RPC para restaurar desde papelera
create or replace function public.restaurar_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_admin() then
        return jsonb_build_object('ok', false, 'error', 'sin_permisos');
    end if;

    update public.posts
       set eliminado_en = null,
           estado = 'borrador'
     where id = p_post_id;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'no_encontrado');
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.mover_post_a_papelera(uuid) from public;
grant execute on function public.mover_post_a_papelera(uuid) to authenticated;
revoke all on function public.restaurar_post(uuid) from public;
grant execute on function public.restaurar_post(uuid) to authenticated;

-- =============================================================================
-- 3. Insertar posts historicos del sitio (los que estaban hardcodeados)
-- =============================================================================
-- upsert por slug para que sea idempotente.

insert into public.posts (
    slug, titulo, extracto, contenido_html, estado, etiquetas, publicado_en
) values
(
    'memento-mori',
    'Memento Mori',
    'Recuerda que morirás. Una reflexión sobre la putrefacción alquímica, la vanitas de la existencia y la reconstrucción del templo del Ser Humano.',
    '<p>Memento Mori es una frase latina que significa «Recuerda que morirás» o «Recuerda morir», en el sentido de que debemos recordar nuestra mortalidad como seres humanos. Era una peculiar costumbre de la Antigua Roma que cuando un general desfilaba victorioso por las calles de Roma, un siervo se encargaba de advertirlo al grito: «Respice post te! Hominem te esse memento!» — «¡Mira tras de ti! Recuerda que eres un hombre» (y no un dios).</p>
<p>Esta imagen ineludiblemente nos refiere a la etapa de la putrefacción alquímica, para así persuadirnos de la vanitas de la existencia y lo perecedero de los cuerpos. La naturaleza se descompone, mas el alma es inmortal. El espíritu habita brevemente en cada cuerpo y debemos aprovechar cada instante del tiempo que se nos ha concedido para hacer de esta experiencia algo trascendente.</p>
<p>Nicolas Barnaud, en su obra Theatrum Quimicum, dice: «Se trata aquí de una tumba que no encierra cadáver; es un cadáver que no está encerrado en un sepulcro, porque el cadáver y el sepulcro no hacen más que uno…». Así este autor nos hace entender que solo existe una materia que nos compone, y amalgamada en ella los siete cuerpos pasionales que deben disolverse y junto con ellos los siete errores entenebrecedores del alma, más conocidos como «pecados capitales», los cuales se oponen a las siete virtudes del alma (cuatro cardinales y tres teologales).</p>
<p>Es fundamental entender en qué consiste esta muerte que debe darse antes de la muerte, para así resurgir de entre los escombros del falso «yo» cual Ave Fénix. El proceso de iluminación requiere un arduo trabajo de demolición (disolución) que se lleva a cabo en nuestra precaria cabaña adámica, produciendo el derrumbe de sus frágiles muros y su podrida techumbre.</p>
<p>Una vez concretada esa tarea, comienza la reconstrucción del templo del Ser Humano: con bases sólidas que garanticen la elevación hacia lo divino, grandes y perfumadas estancias para dar cobijo a las virtudes y profundos calabozos para condenar a los siniestros vicios. Nada tiene que ver con ser mejor o más feliz, sino con la completa erradicación de la falsedad que se monta sobre el delirante andamiaje de la pretensión.</p>',
    'publicado',
    ARRAY['hermetismo', 'alquimia'],
    '2025-07-24T00:00:00-03:00'::timestamptz
),
(
    'sobre-la-iniciacion',
    'Sobre la iniciación',
    '«Initium» significa «entrada» o «comienzo». Sobre la iniciación como influencia espiritual que debe ser comunicada, y la diferencia entre el hecho y su trabajo ulterior.',
    '<p>Un tema recurrente dentro de la espiritualidad tiene que ver con el fenómeno que ha sido llamado «iniciación».</p>
<p>Iniciación, «initium» como lo indica su etimología, significa «entrada» o «comienzo». R. Guénon nos comentaba al respecto: «Algunos confunden el hecho mismo de la iniciación, entendida en su sentido estrictamente etimológico, con el trabajo que hay que llevar a cabo ulteriormente para que esa iniciación devenga en efectiva.»</p>
<p>Una iniciación es una influencia espiritual que debe ser comunicada por proximidad con un sabio, un santo iniciado, o incluso por alguna reliquia u objeto que le haya pertenecido.</p>
<p>Esta transmisión siempre debe darse por contacto: con las manos, los pies o el soplo directo sobre la cabeza. Ocasionalmente también puede darse que haya una intervención directa de la divinidad sobre el que sea capaz de recibirla. No obstante, el obstáculo mayor que interfiere en la recepción de esta influencia es, ni más ni menos, el intelecto razonador.</p>
<p>Es así que muchos son los iniciados pero pocos los que efectivamente han sido inflamados del espíritu, siendo capaces de transferir las influencias magnéticas necesarias que despierten bien la visión profética, bien los poderes ocultos residentes en el género humano.</p>
<p>Si alguien dotado ha logrado ser debidamente iniciado, es capaz de despertar el espíritu aletargado en otros. Pero como bien dijo un sabio, el espíritu se ha reservado el privilegio de soplar donde quiere y a quien quiere, así como se sopla una débil brasa para hacer un fuego, y finalmente que éste devenga en hoguera.</p>',
    'publicado',
    ARRAY['hermetismo', 'iniciacion'],
    '2022-10-25T00:00:00-03:00'::timestamptz
),
(
    'sobre-el-hermetismo',
    'Sobre el Hermetismo',
    'El hermetismo no es una doctrina antigua «supersticiosa». Es una ciencia real que devela el poder metafísico residente en el ser humano, uniendo lo interior y lo exterior.',
    '<p>Como alguna vez lo hemos mencionado, el hermetismo no se reduce a una doctrina antigua entendida y etiquetada muchas veces como «supersticiosa». Muy por el contrario, nos permitimos decir que el conocimiento legado por los sabios se encuentra dentro de los cánones más elevados del empirismo, puesto que es el conocimiento real que cumple la función de develar y experimentar el poder metafísico residente en el ser humano, valiéndose de secretos celosamente guardados por naturaleza.</p>
<p>A través de la resonancia natural estudia y conoce las distintas correspondencias entre los fragmentos que componen todo lo creado como un cuerpo total y absoluto, basándose en lo infinitesimal: en lo micro y reproducido en lo macro.</p>
<p>Sí, el hermetismo es una ciencia capaz de dar peso y medida a lo inefable, logrando de esta manera hacer visible lo que por invisible (a ojos profanos) se rechaza de manera categórica por ignorancia. La sacra ciencia no sólo se ocupa del plano interior, espiritual o metafísico; también del plano sensorial, exterior y físico, uniendo lo que ilusoriamente está separado. Ambos aspectos de la creación son sólo en apariencia contrarios o antagónicos, pero juntos componen una sola y única cosa.</p>
<p>Es así como los eruditos, los sofistas y otros simples sopladores hacen mal uso del conocimiento legado por Hermes, Platón y otros tantos filósofos naturalistas, intentando engendrar, por desconocimiento, seudorreligiones de una mística extraña que hunde sus cimientos en sincretismos vanos de símbolos arcaicos, significándolos y revistiéndolos de conceptos humanos, sociales, y por completo carentes de la hermenéutica tradicional y trascendente.</p>
<p>Tomemos el caso de las religiones, que han desencarnado en bloque todo el conocimiento que en ellas se ocultó por temor, volviéndose enteramente de orden exotérico en sus símbolos litúrgicos; símbolos que, en definitiva, muy pocos comprenden en su sentido último y verdadero.</p>
<p>La mística y la ciencia hermética no deben separarse, porque en definitiva, al igual que el cielo y la tierra, deben ser complementos para la unión en el sendero que finaliza en la verdad única, Realidad sustancial y tangible ya desde aquí abajo.</p>',
    'publicado',
    ARRAY['hermetismo'],
    '2022-10-25T00:00:00-03:00'::timestamptz
)
on conflict (slug) do nothing;

-- =============================================================================
-- Smoke test
-- =============================================================================
-- select id, slug, estado, publicado_en from public.posts order by publicado_en desc;

import{a as m}from"./cursos-cms.Cmk_JGDp.js";import"./supabase.2Xnj7Pbd.js";const g={activo:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-400/40 rounded-sm bg-gold-400/5">Activo</span>',inactivo:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Inactivo</span>',proximo:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-300/30 rounded-sm">Próximo</span>',historico:'<span class="text-[9px] uppercase tracking-widest text-parchment-500 px-1.5 py-0.5 border border-parchment-500/20 rounded-sm">Histórico</span>',borrador:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Borrador</span>',archivado:'<span class="text-[9px] uppercase tracking-widest text-wine-400 px-1.5 py-0.5 border border-wine-500/30 rounded-sm">Archivado</span>'};let o=[],n="todos",p="";const s=document.getElementById("lista-cursos"),c=document.getElementById("buscador"),i=document.getElementById("contador");function a(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function f(t){return g[t]??`<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">${a(t)}</span>`}function d(t){if(s){if(i&&(i.textContent=`${t.length} ${t.length===1?"curso":"cursos"}`),t.length===0){s.innerHTML=`
          <div class="card-altar p-12 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">No hay cursos en esta vista.</p>
            <a href="/area-reservada/cursos/editar" class="btn-gold mt-6 inline-flex">+ Nuevo curso</a>
          </div>`;return}s.innerHTML=t.map(e=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="font-display text-xl text-parchment-50">${a(e.titulo)}</span>
                ${f(e.estado)}
                ${e.id?"":'<span class="text-[9px] uppercase tracking-widest text-parchment-500 px-1.5 py-0.5 border border-parchment-500/20 rounded-sm">base</span>'}
              </div>
              <div class="text-xs text-parchment-500 font-mono">/cursos/${a(e.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${a(e.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                orden ${a(String(e.orden??100))} · ${a(e.modalidad)} · ${a(String(e.clases))} clases
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a href="/cursos/${encodeURIComponent(e.slug)}" target="_blank" rel="noopener" class="btn-ghost text-xs">Ver sitio</a>
              <a href="/area-reservada/cursos/editar?slug=${encodeURIComponent(e.slug)}" class="btn-gold text-xs">Editar</a>
            </div>
          </div>
        </article>
      `).join("")}}function l(){const t=n==="todos"?o:o.filter(r=>r.estado===n),e=p.trim().toLowerCase();if(!e)return d(t);const x=t.filter(r=>`${r.titulo} ${r.slug} ${r.descripcionCorta} ${r.modalidad} ${r.nivel}`.toLowerCase().includes(e));d(x)}function u(t){n=t,l()}(async()=>(o=await m(),u("todos")))();document.querySelectorAll(".filtro-btn").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(e=>e.classList.remove("is-active")),t.classList.add("is-active"),u(t.dataset.filtro??"todos")})});c?.addEventListener("input",()=>{p=c.value,l()});

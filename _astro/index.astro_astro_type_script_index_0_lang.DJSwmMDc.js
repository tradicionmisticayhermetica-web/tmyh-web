import{a as i}from"./cursos-cms.u0WSLQ7v.js";import"./supabase.2Xnj7Pbd.js";const d={activo:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-400/40 rounded-sm bg-gold-400/5">Activo</span>',inactivo:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Inactivo</span>',proximo:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-300/30 rounded-sm">Próximo</span>',historico:'<span class="text-[9px] uppercase tracking-widest text-parchment-500 px-1.5 py-0.5 border border-parchment-500/20 rounded-sm">Histórico</span>',borrador:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Borrador</span>',archivado:'<span class="text-[9px] uppercase tracking-widest text-wine-400 px-1.5 py-0.5 border border-wine-500/30 rounded-sm">Archivado</span>'};let a=[];const s=document.getElementById("lista-cursos"),n=document.getElementById("contador");function r(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function p(e){return d[e]??`<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">${r(e)}</span>`}function l(e){if(s){if(n&&(n.textContent=`${e.length} ${e.length===1?"curso":"cursos"}`),e.length===0){s.innerHTML=`
          <div class="card-altar p-12 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">No hay cursos en esta vista.</p>
            <a href="/area-reservada/cursos/editar" class="btn-gold mt-6 inline-flex">+ Nuevo curso</a>
          </div>`;return}s.innerHTML=e.map(t=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="font-display text-xl text-parchment-50">${r(t.titulo)}</span>
                ${p(t.estado)}
                ${t.id?"":'<span class="text-[9px] uppercase tracking-widest text-parchment-500 px-1.5 py-0.5 border border-parchment-500/20 rounded-sm">base</span>'}
              </div>
              <div class="text-xs text-parchment-500 font-mono">/cursos/${r(t.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${r(t.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                orden ${r(String(t.orden??100))} · ${r(t.modalidad)} · ${r(String(t.clases))} clases
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a href="/cursos/${encodeURIComponent(t.slug)}" target="_blank" rel="noopener" class="btn-ghost text-xs">Ver sitio</a>
              <a href="/area-reservada/cursos/editar?slug=${encodeURIComponent(t.slug)}" class="btn-gold text-xs">Editar</a>
            </div>
          </div>
        </article>
      `).join("")}}function o(e){const t=e==="todos"?a:a.filter(c=>c.estado===e);l(t)}(async()=>(a=await i(),o("todos")))();document.querySelectorAll(".filtro-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(t=>t.classList.remove("is-active")),e.classList.add("is-active"),o(e.dataset.filtro??"todos")})});

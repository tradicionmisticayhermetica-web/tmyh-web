import{h as n,f as l}from"./admin.BTAnY7sp.js";import"./supabase.2Xnj7Pbd.js";const a=document.getElementById("lista-posts"),i=document.getElementById("contador");let s=[];function r(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const d={publicado:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-400/40 rounded-sm bg-gold-400/5">Publicado</span>',borrador:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Borrador</span>',archivado:'<span class="text-[9px] uppercase tracking-widest text-parchment-600 px-1.5 py-0.5 border border-parchment-600/20 rounded-sm opacity-60">Archivado</span>'};function p(t){if(a){if(i&&(i.textContent=`${t.length} ${t.length===1?"post":"posts"}`),t.length===0){a.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">No hay posts en esta vista.</p>
            <a href="/area-reservada/blog/nuevo" class="btn-gold mt-6 inline-flex">+ Nuevo post</a>
          </div>`;return}a.innerHTML=t.map(e=>`
        <a href="/area-reservada/blog/editar?id=${e.id}"
           class="block px-6 py-5 hover:bg-gold-400/5 transition">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <span class="font-display text-parchment-50">${r(e.titulo)}</span>
                ${d[e.estado]??""}
              </div>
              <div class="text-xs text-parchment-500 font-mono">/${r(e.slug)}</div>
              ${e.extracto?`<p class="text-sm text-parchment-300 mt-2 font-serif line-clamp-2 max-w-2xl">${r(e.extracto)}</p>`:""}
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right shrink-0">
              ${r(l(e.publicado_en??e.creado_en))}
            </div>
          </div>
        </a>`).join("")}}async function o(t){a&&(a.innerHTML='<div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>'),s=await n(200);const e=t==="todos"?s:s.filter(c=>c.estado===t);p(e)}document.querySelectorAll(".filtro-btn").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(e=>e.classList.remove("is-active")),t.classList.add("is-active"),o(t.dataset.filtro??"todos")})});o("todos");

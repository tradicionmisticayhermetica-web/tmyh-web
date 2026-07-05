import{c as x,f}from"./admin.z3XL9Bjq.js";import"./supabase.BC3Mu_5F.js";const r=document.getElementById("lista-posts"),n=document.getElementById("buscador"),i=document.getElementById("contador");let o=[],c="todos",d="";function s(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const g={publicado:'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-400/40 rounded-sm bg-gold-400/5">Publicado</span>',borrador:'<span class="text-[9px] uppercase tracking-widest text-parchment-400 px-1.5 py-0.5 border border-parchment-400/30 rounded-sm">Borrador</span>',archivado:'<span class="text-[9px] uppercase tracking-widest text-parchment-600 px-1.5 py-0.5 border border-parchment-600/20 rounded-sm opacity-60">Archivado</span>'};function l(t){if(r){if(i&&(i.textContent=`${t.length} ${t.length===1?"post":"posts"}`),t.length===0){r.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">No hay posts en esta vista.</p>
            <a href="/area-reservada/blog/nuevo" class="btn-gold mt-6 inline-flex">+ Nuevo post</a>
          </div>`;return}r.innerHTML=t.map(e=>`
        <a href="/area-reservada/blog/editar?id=${e.id}"
           class="block px-6 py-5 hover:bg-gold-400/5 transition">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <span class="font-display text-parchment-50">${s(e.titulo)}</span>
                ${g[e.estado]??""}
              </div>
              <div class="text-xs text-parchment-500 font-mono">/${s(e.slug)}</div>
              ${e.extracto?`<p class="text-sm text-parchment-300 mt-2 font-serif line-clamp-2 max-w-2xl">${s(e.extracto)}</p>`:""}
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right shrink-0">
              ${s(f(e.publicado_en??e.creado_en))}
            </div>
          </div>
        </a>`).join("")}}function p(){const t=c==="todos"?o:o.filter(a=>a.estado===c),e=d.trim().toLowerCase();if(!e)return l(t);const m=t.filter(a=>`${a.titulo} ${a.slug} ${a.extracto??""}`.toLowerCase().includes(e));l(m)}async function u(t){c=t,r&&(r.innerHTML='<div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>'),o=await x(200),p()}document.querySelectorAll(".filtro-btn").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(e=>e.classList.remove("is-active")),t.classList.add("is-active"),u(t.dataset.filtro??"todos")})});n?.addEventListener("input",()=>{d=n.value,p()});u("todos");

import{p as o,l as c,r as l,e as d}from"./cursos-cms.u0WSLQ7v.js";import"./supabase.2Xnj7Pbd.js";const i=document.getElementById("lista-papelera");function n(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function u(t){if(!t)return"—";try{return new Date(t).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}async function s(){await o();const t=await c();if(i){if(t.length===0){i.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}i.innerHTML=t.map(e=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${n(e.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${n(e.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${n(e.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${n(u(e.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),i.querySelectorAll("[data-restaurar]").forEach(e=>{e.addEventListener("click",async()=>{const a=decodeURIComponent(e.dataset.restaurar??"");if(!a)return;const r=await l(a);if(!r.ok){alert(`No se pudo restaurar: ${r.error}`);return}await s()})}),i.querySelectorAll("[data-eliminar]").forEach(e=>{e.addEventListener("click",async()=>{const a=decodeURIComponent(e.dataset.eliminar??"");if(!a||!window.confirm("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer."))return;const r=await d(a);if(!r.ok){alert(`No se pudo eliminar: ${r.error}`);return}await s()})})}}s();

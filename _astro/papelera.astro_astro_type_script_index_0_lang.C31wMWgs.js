import{p as x,l as h,r as v,d as g,e as y}from"./cursos-cms.Cmk_JGDp.js";import"./supabase.2Xnj7Pbd.js";const s=document.getElementById("lista-papelera"),c=document.getElementById("status"),i=window.__tmyhLoader;function o(t,e){c&&(c.textContent=t,c.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),c.classList.add(e==="ok"?"text-gold-300":e==="error"?"text-wine-500":"text-parchment-300"))}function w(t){return new Promise(e=>{const r=document.getElementById("dialog-confirm"),n=document.getElementById("dialog-confirm-msg"),a=document.getElementById("dialog-confirm-ok"),d=document.getElementById("dialog-confirm-cancel");if(!r||!n||!a||!d)return e(window.confirm(t));n.textContent=t,r.classList.remove("hidden"),r.classList.add("flex");const m=()=>{r.classList.add("hidden"),r.classList.remove("flex"),a.removeEventListener("click",p),d.removeEventListener("click",f)},p=()=>{m(),e(!0)},f=()=>{m(),e(!1)};a.addEventListener("click",p),d.addEventListener("click",f)})}function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function E(t){if(!t)return"—";try{return new Date(t).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}async function u(){i?.show?.("Cargando papelera…");let t=[];try{await x(),t=await h()}finally{i?.hide?.()}if(s){if(t.length===0){s.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}s.innerHTML=t.map(e=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${l(e.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${l(e.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${l(e.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${l(E(e.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),s.querySelectorAll("[data-restaurar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.restaurar??"");if(r){i?.show?.("Restaurando curso…");try{const n=await v(r);if(!n.ok){o(`No se pudo restaurar: ${n.error}`,"error");return}const a=await g(`restaurar:${r}`);if(!a.ok){o(`Curso restaurado, pero falló el deploy automático (${a.error}).`,"error");return}o("Curso restaurado correctamente.","ok"),await u()}finally{i?.hide?.()}}})}),s.querySelectorAll("[data-eliminar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.eliminar??"");if(r&&await w("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer.")){i?.show?.("Eliminando curso…");try{const n=await y(r);if(!n.ok){o(`No se pudo eliminar: ${n.error}`,"error");return}const a=await g(`eliminar:${r}`);if(!a.ok){o(`Curso eliminado de base, pero falló el deploy automático (${a.error}).`,"error");return}o("Curso eliminado definitivamente.","ok"),await u()}finally{i?.hide?.()}}})})}}u();

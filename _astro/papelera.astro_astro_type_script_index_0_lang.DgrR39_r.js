import{p as h,l as w,r as v,d as y,e as E}from"./cursos-cms.n78xFG0w.js";import"./supabase.TwzBJLgx.js";const i=document.getElementById("lista-papelera"),c=document.getElementById("status");function o(t,e){c&&(c.textContent=t,c.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),c.classList.add(e==="ok"?"text-gold-300":e==="error"?"text-wine-500":"text-parchment-300"))}function m(t="Procesando…"){window.__tmyhLoader?.show?.(t)}function p(){window.__tmyhLoader?.hide?.()}async function s(t,e,r){let a=null;try{return await Promise.race([t,new Promise((n,l)=>{a=setTimeout(()=>{l(new Error(`timeout:${r}`))},e)})])}finally{a&&clearTimeout(a)}}function L(t){return new Promise(e=>{const r=document.getElementById("dialog-confirm"),a=document.getElementById("dialog-confirm-msg"),n=document.getElementById("dialog-confirm-ok"),l=document.getElementById("dialog-confirm-cancel");if(!r||!a||!n||!l)return e(window.confirm(t));a.textContent=t,r.classList.remove("hidden"),r.classList.add("flex");const f=()=>{r.classList.add("hidden"),r.classList.remove("flex"),n.removeEventListener("click",g),l.removeEventListener("click",x)},g=()=>{f(),e(!0)},x=()=>{f(),e(!1)};n.addEventListener("click",g),l.addEventListener("click",x)})}function d(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function k(t){if(!t)return"—";try{return new Date(t).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}async function u(){m("Cargando papelera…");let t=[];try{await s(h(),12e3,"purgar_papelera"),t=await s(w(),12e3,"listar_papelera")}catch(e){console.error("[cursos.papelera.cargar]",e),o("La papelera está tardando más de lo esperado. Reintentá en unos segundos.","error"),i&&(i.innerHTML=`
            <div class="card-altar p-12 text-center">
              <p class="text-parchment-300 font-serif italic">No se pudo cargar la papelera en tiempo razonable.</p>
              <button id="btn-reintentar-papelera" class="btn-gold mt-5">Reintentar</button>
            </div>`,document.getElementById("btn-reintentar-papelera")?.addEventListener("click",()=>{u()}));return}finally{p()}if(i){if(t.length===0){i.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}i.innerHTML=t.map(e=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${d(e.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${d(e.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${d(e.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${d(k(e.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),i.querySelectorAll("[data-restaurar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.restaurar??"");if(r){m("Restaurando curso…");try{const a=await s(v(r),12e3,"restaurar_curso");if(!a.ok){o(`No se pudo restaurar: ${a.error}`,"error");return}const n=await s(y(r,"restaurar"),12e3,"deploy_restaurar");if(!n.ok){o(`Curso restaurado, pero falló el deploy automático (${n.error}).`,"error");return}o("Curso restaurado correctamente.","ok"),await u()}finally{p()}}})}),i.querySelectorAll("[data-eliminar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.eliminar??"");if(r&&await L("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer.")){m("Eliminando curso…");try{const a=await s(E(r),12e3,"eliminar_curso");if(!a.ok){o(`No se pudo eliminar: ${a.error}`,"error");return}const n=await s(y(r,"eliminar"),12e3,"deploy_eliminar");if(!n.ok){o(`Curso eliminado de base, pero falló el deploy automático (${n.error}).`,"error");return}o("Curso eliminado definitivamente.","ok"),await u()}finally{p()}}})})}}u();

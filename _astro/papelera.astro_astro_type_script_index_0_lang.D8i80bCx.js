import{p as y,l as v,r as w,d as h,e as L}from"./cursos-cms.DF9RnEt0.js";import"./supabase.2Xnj7Pbd.js";const o=document.getElementById("lista-papelera"),c=document.getElementById("status");let i=null;function s(e,t){c&&(c.textContent=e,c.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),c.classList.add(t==="ok"?"text-gold-300":t==="error"?"text-wine-500":"text-parchment-300"))}function k(){if(i)return i;const e=document.createElement("div");return e.className="hidden fixed inset-0 z-[1400] items-center justify-center bg-night-950/78 backdrop-blur-[2px]",e.innerHTML=`
        <div class="card-altar px-8 py-7 text-center min-w-[300px]">
          <div class="loader-triad" aria-hidden="true">
            <span class="loader-sym m">☿</span>
            <span class="loader-sym a">🜍</span>
            <span class="loader-sym s">🜔</span>
          </div>
          <p class="loader-msg mt-5 text-xs tracking-widest uppercase text-parchment-200">Procesando…</p>
        </div>`,document.body.appendChild(e),i=e,e}function u(e="Procesando…"){const t=window.__tmyhLoader;if(t?.show){t.show(e);return}const r=k(),a=r.querySelector(".loader-msg");a&&(a.textContent=e),r.classList.remove("hidden"),r.classList.add("flex")}function m(){const e=window.__tmyhLoader;if(e?.hide){e.hide();return}i&&(i.classList.add("hidden"),i.classList.remove("flex"))}function E(e){return new Promise(t=>{const r=document.getElementById("dialog-confirm"),a=document.getElementById("dialog-confirm-msg"),n=document.getElementById("dialog-confirm-ok"),l=document.getElementById("dialog-confirm-cancel");if(!r||!a||!n||!l)return t(window.confirm(e));a.textContent=e,r.classList.remove("hidden"),r.classList.add("flex");const f=()=>{r.classList.add("hidden"),r.classList.remove("flex"),n.removeEventListener("click",x),l.removeEventListener("click",g)},x=()=>{f(),t(!0)},g=()=>{f(),t(!1)};n.addEventListener("click",x),l.addEventListener("click",g)})}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function C(e){if(!e)return"—";try{return new Date(e).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}async function p(){u("Cargando papelera…");let e=[];try{await y(),e=await v()}finally{m()}if(o){if(e.length===0){o.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}o.innerHTML=e.map(t=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${d(t.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${d(t.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${d(t.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${d(C(t.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),o.querySelectorAll("[data-restaurar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.restaurar??"");if(r){u("Restaurando curso…");try{const a=await w(r);if(!a.ok){s(`No se pudo restaurar: ${a.error}`,"error");return}const n=await h(`restaurar:${r}`);if(!n.ok){s(`Curso restaurado, pero falló el deploy automático (${n.error}).`,"error");return}s("Curso restaurado correctamente.","ok"),await p()}finally{m()}}})}),o.querySelectorAll("[data-eliminar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.eliminar??"");if(r&&await E("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer.")){u("Eliminando curso…");try{const a=await L(r);if(!a.ok){s(`No se pudo eliminar: ${a.error}`,"error");return}const n=await h(`eliminar:${r}`);if(!n.ok){s(`Curso eliminado de base, pero falló el deploy automático (${n.error}).`,"error");return}s("Curso eliminado definitivamente.","ok"),await p()}finally{m()}}})})}}p();

import{p as v,l as w,r as L,d as y,e as E}from"./cursos-cms.DF9RnEt0.js";import"./supabase.2Xnj7Pbd.js";const s=document.getElementById("lista-papelera"),d=document.getElementById("status");let l=null;function i(e,t){d&&(d.textContent=e,d.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),d.classList.add(t==="ok"?"text-gold-300":t==="error"?"text-wine-500":"text-parchment-300"))}function k(){if(l)return l;const e=document.createElement("div");return e.className="hidden fixed inset-0 z-[1400] items-center justify-center bg-night-950/78 backdrop-blur-[2px]",e.innerHTML=`
        <div class="card-altar px-8 py-7 text-center min-w-[300px]">
          <div class="loader-triad" aria-hidden="true">
            <span class="loader-sym m">☿</span>
            <span class="loader-sym a">🜍</span>
            <span class="loader-sym s">🜔</span>
          </div>
          <p class="loader-msg mt-5 text-xs tracking-widest uppercase text-parchment-200">Procesando…</p>
        </div>`,document.body.appendChild(e),l=e,e}function p(e="Procesando…"){const t=window.__tmyhLoader;if(t?.show){t.show(e);return}const r=k(),a=r.querySelector(".loader-msg");a&&(a.textContent=e),r.classList.remove("hidden"),r.classList.add("flex")}function f(){const e=window.__tmyhLoader;if(e?.hide){e.hide();return}l&&(l.classList.add("hidden"),l.classList.remove("flex"))}async function o(e,t,r){let a=null;try{return await Promise.race([e,new Promise((n,c)=>{a=setTimeout(()=>{c(new Error(`timeout:${r}`))},t)})])}finally{a&&clearTimeout(a)}}function b(e){return new Promise(t=>{const r=document.getElementById("dialog-confirm"),a=document.getElementById("dialog-confirm-msg"),n=document.getElementById("dialog-confirm-ok"),c=document.getElementById("dialog-confirm-cancel");if(!r||!a||!n||!c)return t(window.confirm(e));a.textContent=e,r.classList.remove("hidden"),r.classList.add("flex");const g=()=>{r.classList.add("hidden"),r.classList.remove("flex"),n.removeEventListener("click",x),c.removeEventListener("click",h)},x=()=>{g(),t(!0)},h=()=>{g(),t(!1)};n.addEventListener("click",x),c.addEventListener("click",h)})}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function C(e){if(!e)return"—";try{return new Date(e).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}async function m(){p("Cargando papelera…");let e=[];try{await o(v(),12e3,"purgar_papelera"),e=await o(w(),12e3,"listar_papelera")}catch(t){console.error("[cursos.papelera.cargar]",t),i("La papelera está tardando más de lo esperado. Reintentá en unos segundos.","error"),s&&(s.innerHTML=`
            <div class="card-altar p-12 text-center">
              <p class="text-parchment-300 font-serif italic">No se pudo cargar la papelera en tiempo razonable.</p>
              <button id="btn-reintentar-papelera" class="btn-gold mt-5">Reintentar</button>
            </div>`,document.getElementById("btn-reintentar-papelera")?.addEventListener("click",()=>{m()}));return}finally{f()}if(s){if(e.length===0){s.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}s.innerHTML=e.map(t=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${u(t.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${u(t.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${u(t.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${u(C(t.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),s.querySelectorAll("[data-restaurar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.restaurar??"");if(r){p("Restaurando curso…");try{const a=await o(L(r),12e3,"restaurar_curso");if(!a.ok){i(`No se pudo restaurar: ${a.error}`,"error");return}const n=await o(y(`restaurar:${r}`),12e3,"deploy_restaurar");if(!n.ok){i(`Curso restaurado, pero falló el deploy automático (${n.error}).`,"error");return}i("Curso restaurado correctamente.","ok"),await m()}finally{f()}}})}),s.querySelectorAll("[data-eliminar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.eliminar??"");if(r&&await b("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer.")){p("Eliminando curso…");try{const a=await o(E(r),12e3,"eliminar_curso");if(!a.ok){i(`No se pudo eliminar: ${a.error}`,"error");return}const n=await o(y(`eliminar:${r}`),12e3,"deploy_eliminar");if(!n.ok){i(`Curso eliminado de base, pero falló el deploy automático (${n.error}).`,"error");return}i("Curso eliminado definitivamente.","ok"),await m()}finally{f()}}})})}}m();

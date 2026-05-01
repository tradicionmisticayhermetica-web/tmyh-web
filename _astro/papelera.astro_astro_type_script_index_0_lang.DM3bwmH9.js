import{p as w,l as L,r as E,d as v,e as k}from"./cursos-cms.DF9RnEt0.js";import"./supabase.2Xnj7Pbd.js";const s=document.getElementById("lista-papelera"),u=document.getElementById("status");let l=null,c=null;function i(e,t){u&&(u.textContent=e,u.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),u.classList.add(t==="ok"?"text-gold-300":t==="error"?"text-wine-500":"text-parchment-300"))}function b(){if(l)return l;const e=document.createElement("div");return e.className="hidden fixed inset-0 z-[1400] items-center justify-center bg-night-950/78 backdrop-blur-[2px]",e.innerHTML=`
        <div class="card-altar px-8 py-7 text-center min-w-[300px]">
          <div class="loader-triad" aria-hidden="true">
            <span class="loader-sym m">☿</span>
            <span class="loader-sym a">🜍</span>
            <span class="loader-sym s">🜔</span>
          </div>
          <p class="loader-msg mt-5 text-xs tracking-widest uppercase text-parchment-200">Procesando…</p>
        </div>`,document.body.appendChild(e),l=e,e}function g(e="Procesando…"){c&&clearTimeout(c),c=setTimeout(()=>{p(),i("La operación tardó demasiado. Verificá conexión/Supabase y reintentá.","error")},15e3);const t=window.__tmyhLoader;if(t?.show){t.show(e);return}const r=b(),a=r.querySelector(".loader-msg");a&&(a.textContent=e),r.classList.remove("hidden"),r.classList.add("flex")}function p(){c&&(clearTimeout(c),c=null);const e=window.__tmyhLoader;if(e?.hide){e.hide();return}l&&(l.classList.add("hidden"),l.classList.remove("flex"))}async function o(e,t,r){let a=null;try{return await Promise.race([e,new Promise((n,d)=>{a=setTimeout(()=>{d(new Error(`timeout:${r}`))},t)})])}finally{a&&clearTimeout(a)}}function C(e){return new Promise(t=>{const r=document.getElementById("dialog-confirm"),a=document.getElementById("dialog-confirm-msg"),n=document.getElementById("dialog-confirm-ok"),d=document.getElementById("dialog-confirm-cancel");if(!r||!a||!n||!d)return t(window.confirm(e));a.textContent=e,r.classList.remove("hidden"),r.classList.add("flex");const x=()=>{r.classList.add("hidden"),r.classList.remove("flex"),n.removeEventListener("click",h),d.removeEventListener("click",y)},h=()=>{x(),t(!0)},y=()=>{x(),t(!1)};n.addEventListener("click",h),d.addEventListener("click",y)})}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function $(e){if(!e)return"—";try{return new Date(e).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}async function f(){g("Cargando papelera…");let e=[];try{await o(w(),12e3,"purgar_papelera"),e=await o(L(),12e3,"listar_papelera")}catch(t){console.error("[cursos.papelera.cargar]",t),i("La papelera está tardando más de lo esperado. Reintentá en unos segundos.","error"),s&&(s.innerHTML=`
            <div class="card-altar p-12 text-center">
              <p class="text-parchment-300 font-serif italic">No se pudo cargar la papelera en tiempo razonable.</p>
              <button id="btn-reintentar-papelera" class="btn-gold mt-5">Reintentar</button>
            </div>`,document.getElementById("btn-reintentar-papelera")?.addEventListener("click",()=>{f()}));return}finally{p()}if(s){if(e.length===0){s.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}s.innerHTML=e.map(t=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${m(t.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${m(t.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${m(t.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${m($(t.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(t.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),s.querySelectorAll("[data-restaurar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.restaurar??"");if(r){g("Restaurando curso…");try{const a=await o(E(r),12e3,"restaurar_curso");if(!a.ok){i(`No se pudo restaurar: ${a.error}`,"error");return}const n=await o(v(`restaurar:${r}`),12e3,"deploy_restaurar");if(!n.ok){i(`Curso restaurado, pero falló el deploy automático (${n.error}).`,"error");return}i("Curso restaurado correctamente.","ok"),await f()}finally{p()}}})}),s.querySelectorAll("[data-eliminar]").forEach(t=>{t.addEventListener("click",async()=>{const r=decodeURIComponent(t.dataset.eliminar??"");if(r&&await C("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer.")){g("Eliminando curso…");try{const a=await o(k(r),12e3,"eliminar_curso");if(!a.ok){i(`No se pudo eliminar: ${a.error}`,"error");return}const n=await o(v(`eliminar:${r}`),12e3,"deploy_eliminar");if(!n.ok){i(`Curso eliminado de base, pero falló el deploy automático (${n.error}).`,"error");return}i("Curso eliminado definitivamente.","ok"),await f()}finally{p()}}})})}}f();

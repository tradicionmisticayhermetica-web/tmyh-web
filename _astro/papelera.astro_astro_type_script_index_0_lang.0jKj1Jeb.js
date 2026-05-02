import{k as m,q as u,n as p,s as f,j as x}from"./admin.Cw5UcnUQ.js";import"./supabase.TwzBJLgx.js";const s=document.getElementById("lista-papelera"),i=document.getElementById("status");function c(a,e){i&&(i.textContent=a,i.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),i.classList.add(e==="ok"?"text-gold-300":e==="error"?"text-wine-500":"text-parchment-300"))}function o(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function d(a){return new Promise(e=>{const t=document.createElement("div");t.className="fixed inset-0 z-[998] flex items-center justify-center bg-night-950/80 backdrop-blur-sm",t.innerHTML=`
          <div class="card-altar p-8 max-w-md mx-4 space-y-5">
            <p class="font-serif text-base text-parchment-100 leading-relaxed">${a}</p>
            <div class="flex gap-3 justify-end">
              <button id="conf-cancel" class="btn-ghost text-sm">Cancelar</button>
              <button id="conf-ok" class="btn-gold text-sm">Confirmar</button>
            </div>
          </div>`,document.body.appendChild(t),t.querySelector("#conf-ok")?.addEventListener("click",()=>{t.remove(),e(!0)}),t.querySelector("#conf-cancel")?.addEventListener("click",()=>{t.remove(),e(!1)}),t.addEventListener("click",r=>{r.target===t&&(t.remove(),e(!1))})})}function v(a){if(s){if(a.length===0){s.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">La papelera está vacía.</p>
          </div>
        `;return}s.innerHTML=a.map(e=>{const t=e.eliminado_en?Math.max(0,Math.floor((Date.now()-new Date(e.eliminado_en).getTime())/864e5)):0,r=Math.max(0,30-t);return`
            <article class="px-6 py-5">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="min-w-0 flex-1">
                  <div class="font-display text-parchment-50">${o(p(e))}</div>
                  <div class="text-xs text-parchment-400 mt-0.5">${o(e.email)}</div>
                  ${e.curso_interes?`<div class="text-xs text-gold-300 mt-1.5">${o(e.curso_interes)}</div>`:""}
                  <p class="text-sm text-parchment-300 mt-2 font-serif">${o(e.mensaje)}</p>
                  <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-3">
                    En papelera hace ${t} ${t===1?"día":"días"} · quedan ${r} días
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button data-restaurar="${e.id}" class="btn-ghost text-xs">Restaurar</button>
                  <button data-eliminar="${e.id}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">
                    Eliminar definitivo
                  </button>
                </div>
              </div>
            </article>
          `}).join(""),s.querySelectorAll("[data-restaurar]").forEach(e=>{e.addEventListener("click",async()=>{const t=e.dataset.restaurar??"";if(!t||!await d("¿Restaurar este mensaje a la bandeja principal?"))return;const n=await f(t);if(!n.ok){c(`No se pudo restaurar: ${n.error}`,"error");return}c("Mensaje restaurado.","ok"),await l()})}),s.querySelectorAll("[data-eliminar]").forEach(e=>{e.addEventListener("click",async()=>{const t=e.dataset.eliminar??"";if(!t||!await d("¿Eliminar definitivamente este mensaje? Esta acción no se puede deshacer."))return;const n=await x(t);if(!n.ok){c(`No se pudo eliminar: ${n.error}`,"error");return}c("Mensaje eliminado definitivamente.","ok"),await l()})})}}async function l(){await m();const a=await u(300);v(a)}l();

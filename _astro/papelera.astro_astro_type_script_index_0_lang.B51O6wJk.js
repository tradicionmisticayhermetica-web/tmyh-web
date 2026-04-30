import{p as g,l as x,r as v,d as f,e as h}from"./cursos-cms.Cmk_JGDp.js";import"./supabase.2Xnj7Pbd.js";const n=document.getElementById("lista-papelera"),i=document.getElementById("status");function s(t,e){i&&(i.textContent=t,i.classList.remove("hidden","text-gold-300","text-wine-500","text-parchment-300"),i.classList.add(e==="ok"?"text-gold-300":e==="error"?"text-wine-500":"text-parchment-300"))}function w(t){return new Promise(e=>{const r=document.getElementById("dialog-confirm"),a=document.getElementById("dialog-confirm-msg"),c=document.getElementById("dialog-confirm-ok"),l=document.getElementById("dialog-confirm-cancel");if(!r||!a||!c||!l)return e(window.confirm(t));a.textContent=t,r.classList.remove("hidden"),r.classList.add("flex");const u=()=>{r.classList.add("hidden"),r.classList.remove("flex"),c.removeEventListener("click",m),l.removeEventListener("click",p)},m=()=>{u(),e(!0)},p=()=>{u(),e(!1)};c.addEventListener("click",m),l.addEventListener("click",p)})}function o(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function y(t){if(!t)return"—";try{return new Date(t).toLocaleString("es-AR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}async function d(){await g();const t=await x();if(n){if(t.length===0){n.innerHTML=`
          <div class="card-altar p-12 text-center">
            <p class="text-parchment-300 font-serif italic">No hay cursos en papelera.</p>
          </div>`;return}n.innerHTML=t.map(e=>`
        <article class="card-altar p-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="font-display text-xl text-parchment-50">${o(e.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono mt-1">/cursos/${o(e.slug)}</div>
              <p class="text-sm text-parchment-300 mt-3 font-serif">${o(e.descripcionCorta)}</p>
              <div class="text-[11px] uppercase tracking-widest text-parchment-400 mt-4">
                eliminado: ${o(y(e.eliminadoEn))}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-restaurar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs">Restaurar</button>
              <button data-eliminar="${encodeURIComponent(e.slug)}" class="btn-ghost text-xs border border-wine-500/35 text-wine-400">Eliminar definitivo</button>
            </div>
          </div>
        </article>
      `).join(""),n.querySelectorAll("[data-restaurar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.restaurar??"");if(!r)return;const a=await v(r);if(!a.ok){s(`No se pudo restaurar: ${a.error}`,"error");return}await f(`restaurar:${r}`),s("Curso restaurado correctamente.","ok"),await d()})}),n.querySelectorAll("[data-eliminar]").forEach(e=>{e.addEventListener("click",async()=>{const r=decodeURIComponent(e.dataset.eliminar??"");if(!r||!await w("¿Eliminar definitivamente este curso? Esta acción no se puede deshacer."))return;const a=await h(r);if(!a.ok){s(`No se pudo eliminar: ${a.error}`,"error");return}await f(`eliminar:${r}`),s("Curso eliminado definitivamente.","ok"),await d()})})}}d();

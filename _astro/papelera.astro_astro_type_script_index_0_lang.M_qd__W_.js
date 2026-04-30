import{l,r as m,e as u}from"./admin.BTAnY7sp.js";import"./supabase.2Xnj7Pbd.js";const n=document.getElementById("lista-papelera");function i(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function o(a,e="info"){const t=document.getElementById("toast-notif");t&&t.remove();const r=document.createElement("div");r.id="toast-notif";const d=e==="ok"?"bg-gold-400 text-night-950":e==="error"?"bg-wine-700 text-parchment-50":"bg-night-900 border border-gold-400/30 text-parchment-100";r.className=`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-sm shadow-xl font-sans text-sm max-w-sm ${d}`,r.textContent=a,document.body.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),400)},3500)}function c(a){return new Promise(e=>{const t=document.createElement("div");t.className="fixed inset-0 z-[998] flex items-center justify-center bg-night-950/80 backdrop-blur-sm",t.innerHTML=`
          <div class="card-altar p-8 max-w-md mx-4 space-y-5">
            <p class="font-serif text-base text-parchment-100 leading-relaxed">${a}</p>
            <div class="flex gap-3 justify-end">
              <button id="conf-cancel" class="btn-ghost text-sm">Cancelar</button>
              <button id="conf-ok" class="btn-gold text-sm">Confirmar</button>
            </div>
          </div>`,document.body.appendChild(t),t.querySelector("#conf-ok")?.addEventListener("click",()=>{t.remove(),e(!0)}),t.querySelector("#conf-cancel")?.addEventListener("click",()=>{t.remove(),e(!1)}),t.addEventListener("click",r=>{r.target===t&&(t.remove(),e(!1))})})}function f(a){return Math.floor((Date.now()-new Date(a).getTime())/864e5)}async function s(){const a=await l(200);if(n){if(a.length===0){n.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-30">🗑</div>
            <p class="text-parchment-300 font-serif italic">La papelera está vacía.</p>
          </div>`;return}n.innerHTML=a.map(e=>{const t=e.eliminado_en?f(e.eliminado_en):0,r=Math.max(0,30-t);return`
          <div class="flex items-center justify-between gap-4 px-6 py-5 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="font-display text-parchment-50 mb-0.5">${i(e.titulo)}</div>
              <div class="text-xs text-parchment-500 font-mono">/${i(e.slug)}</div>
              <div class="text-[11px] text-wine-400 mt-1 uppercase tracking-widest">
                En papelera hace ${t} ${t===1?"día":"días"} · quedan ${r} días
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                class="btn-restaurar btn-ghost text-xs"
                data-id="${i(e.id)}"
                data-titulo="${i(e.titulo)}"
              >
                Restaurar
              </button>
              <button
                class="btn-eliminar text-[11px] uppercase tracking-widest text-wine-500 hover:text-wine-300 border border-wine-600/30 hover:border-wine-500/60 px-3 py-1.5 rounded-sm transition"
                data-id="${i(e.id)}"
                data-titulo="${i(e.titulo)}"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>`}).join(""),n.querySelectorAll(".btn-restaurar").forEach(e=>{e.addEventListener("click",async()=>{if(!await c(`¿Restaurar "${e.dataset.titulo}"? Volverá como borrador.`))return;const t=await m(e.dataset.id);t.ok?(o("Post restaurado como borrador.","ok"),await s()):o(`Error: ${t.error}`,"error")})}),n.querySelectorAll(".btn-eliminar").forEach(e=>{e.addEventListener("click",async()=>{if(!await c(`¿Eliminar definitivamente "${e.dataset.titulo}"? Esta acción no se puede deshacer.`))return;const t=await u(e.dataset.id);t.ok?(o("Post eliminado definitivamente.","ok"),await s()):o(`Error: ${t.error}`,"error")})})}}s();

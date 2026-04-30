import{d as r,c,n as l,f as o}from"./admin.DfAc8oZQ.js";import"./supabase.2Xnj7Pbd.js";const i=document.getElementById("lista-recientes");function a(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function n(e,s){const t=document.getElementById(e);t&&(t.textContent=String(s))}(async()=>{const e=await r();e&&(n("kpi-total",e.total_mensajes),n("kpi-semana",e.mensajes_ultima_semana),n("kpi-mes",e.mensajes_ultimo_mes),n("kpi-newsletter",`${e.suscriptores_newsletter} / ${e.total_contactos}`));const s=await c(5);if(i){if(s.length===0){i.innerHTML=`
          <div class="py-12 text-center">
            <div class="text-2xl text-gold-400 mb-3">☉</div>
            <p class="text-parchment-300 font-serif italic">
              Todavía no llegó ninguna consulta.
            </p>
          </div>
        `;return}i.innerHTML=s.map(t=>`
        <a
          href="/area-reservada/mensaje?id=${t.id}"
          class="block py-4 hover:bg-gold-400/5 transition px-3 -mx-3 rounded-sm"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="font-display text-parchment-50">${a(l(t))}</div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap">
              ${a(o(t.creado_en))}
            </div>
          </div>
          ${t.curso_interes?`<div class="text-xs text-gold-300 mt-1">${a(t.curso_interes)}</div>`:""}
          <p class="text-sm text-parchment-300 mt-2 font-serif line-clamp-2">
            ${a(t.mensaje)}
          </p>
        </a>
      `).join("")}})();

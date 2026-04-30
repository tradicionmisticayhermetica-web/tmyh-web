import{c as p,n as x,f as m}from"./admin.DfAc8oZQ.js";import"./supabase.2Xnj7Pbd.js";const n=document.getElementById("lista-mensajes"),r=document.getElementById("buscador"),c=document.getElementById("contador");let i=[];function s(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function l(t){if(n){if(c&&(c.textContent=t.length===1?"1 mensaje":`${t.length} mensajes`),t.length===0){n.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">☉</div>
            <p class="text-parchment-300 font-serif italic">No hay mensajes que coincidan.</p>
          </div>
        `;return}n.innerHTML=t.map(e=>`
        <a
          href="/area-reservada/mensaje?id=${e.id}"
          class="block px-6 py-5 hover:bg-gold-400/5 transition"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <div class="font-display text-parchment-50">${s(x(e))}</div>
                ${e.newsletter_optin?'<span class="text-[9px] uppercase tracking-widest text-gold-300 px-1.5 py-0.5 border border-gold-400/30 rounded-sm bg-gold-400/5">Newsletter</span>':""}
              </div>
              <div class="text-xs text-parchment-400 mt-0.5">${s(e.email)}</div>
              ${e.curso_interes?`<div class="text-xs text-gold-300 mt-1.5">${s(e.curso_interes)}</div>`:""}
              <p class="text-sm text-parchment-300 mt-2 font-serif line-clamp-2 max-w-2xl">
                ${s(e.mensaje)}
              </p>
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right">
              ${s(m(e.creado_en))}
            </div>
          </div>
        </a>
      `).join("")}}function o(t){const e=t.trim().toLowerCase();if(!e){l(i);return}const d=i.filter(a=>`${a.nombre} ${a.apellido??""} ${a.email} ${a.curso_interes??""} ${a.mensaje}`.toLowerCase().includes(e));l(d)}(async()=>(i=await p(500),o(r?.value??"")))();r?.addEventListener("input",()=>o(r.value));

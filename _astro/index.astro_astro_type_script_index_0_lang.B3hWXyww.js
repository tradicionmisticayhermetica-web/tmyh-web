import{k as h,C as b,E as w,p as $,e as y}from"./newsletter-cms.B3O-SqQa.js";import{f as A}from"./admin.WE6qEwXd.js";import{s as C}from"./supabase.2Xnj7Pbd.js";const s=document.getElementById("lista-campanas"),l=document.getElementById("buscador"),p=document.getElementById("contador"),r=document.getElementById("kpi-suscriptores");let n=[],i="todos",f="";function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function m(e){if(s){if(p&&(p.textContent=`${e.length} ${e.length===1?"campaña":"campañas"}`),e.length===0){s.innerHTML=`
          <div class="py-16 text-center">
            <div class="text-2xl text-gold-400 mb-3 opacity-50">✦</div>
            <p class="text-parchment-300 font-serif italic">No hay campañas en esta vista.</p>
            <a href="/area-reservada/newsletter/nueva" class="btn-gold mt-6 inline-flex">+ Nueva campaña</a>
          </div>`;return}s.innerHTML=e.map(t=>{const a=b[t.estado]??"text-parchment-400",v=w[t.estado]??t.estado,d=$(t),c=y(t),x=t.enviada_en??t.encolada_en??t.actualizada_en,g=["lista","enviando","pausada","enviada"].includes(t.estado);return`
        <a href="/area-reservada/newsletter/editar?id=${t.id}"
           class="block px-6 py-5 hover:bg-gold-400/5 transition">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <span class="font-display text-parchment-50 text-base">${u(t.asunto)}</span>
                <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${a}">${v}</span>
              </div>
              <div class="text-xs text-parchment-500 font-mono">
                ${t.total_destinatarios} destinatarios · ${t.enviados} enviados · ${t.fallidos+t.rebotados} con error${t.enviados>0?` · <span class="text-emerald-300/80">${t.abiertos} abiertos${t.enviados>0?` (${Math.round(t.abiertos/t.enviados*100)}%)`:""}</span>`:""}
              </div>
              ${g?`
                <div class="mt-3 max-w-lg">
                  <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${d}%"></div>
                  </div>
                  <div class="text-[10px] mt-1 text-parchment-400 uppercase tracking-widest">
                    ${d}% · ${c!=="—"?"queda "+c:""}
                  </div>
                </div>`:""}
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right shrink-0">
              ${u(A(x))}
            </div>
          </div>
        </a>`}).join("")}}function o(){const e=i==="todos"?n:n.filter(a=>a.estado===i),t=f.trim().toLowerCase();if(!t)return m(e);m(e.filter(a=>a.asunto.toLowerCase().includes(t)))}async function E(){const{count:e,error:t}=await C.from("contactos").select("id",{count:"exact",head:!0}).eq("newsletter_optin",!0);if(t){r&&(r.textContent="—");return}r&&(r.textContent=String(e??0))}async function L(){s&&(s.innerHTML='<div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>'),n=await h(200),o()}document.querySelectorAll(".filtro-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(t=>t.classList.remove("is-active")),e.classList.add("is-active"),i=e.dataset.filtro??"todos",o()})});l?.addEventListener("input",()=>{f=l.value,o()});E();L();

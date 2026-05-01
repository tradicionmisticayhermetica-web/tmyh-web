import{o as f,j as b,E as g}from"./newsletter-cms.B3O-SqQa.js";import{f as $}from"./admin.WE6qEwXd.js";import"./supabase.2Xnj7Pbd.js";const w=new URLSearchParams(window.location.search),r=w.get("id");r||window.location.replace("/area-reservada/newsletter");const p=document.getElementById("titulo-campana"),h=document.getElementById("resumen-meta"),E=document.getElementById("link-volver"),s=document.getElementById("lista-envios"),_=document.getElementById("contador"),l=document.getElementById("buscador");let d="todos",m="";const y={pendiente:"Pendiente",enviando:"Enviando",enviado:"Enviado",fallido:"Fallido",rebotado_definitivo:"Rebote",cancelado:"Cancelado"},T={pendiente:"text-parchment-400 border-parchment-400/30",enviando:"text-gold-200 border-gold-400/60 bg-gold-400/10",enviado:"text-emerald-300 border-emerald-400/40 bg-emerald-400/5",fallido:"text-wine-300 border-wine-400/40 bg-wine-400/5",rebotado_definitivo:"text-wine-200 border-wine-400/60 bg-wine-400/10",cancelado:"text-parchment-600 border-parchment-600/20 opacity-60"};function a(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function A(t){p.textContent=t.asunto,E.href=`/area-reservada/newsletter/editar?id=${t.id}`,h.textContent=[`Estado: ${g[t.estado]}`,`${t.total_destinatarios} destinatarios`,`${t.enviados} enviados`,`${t.fallidos} fallidos`,`${t.rebotados} rebotados`,`${t.abiertos} abiertos`].join(" · ")}function k(t){if(t.length===0){s.innerHTML=`
          <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">
            No hay envíos en esta vista.
          </div>`;return}s.innerHTML=t.map(e=>{const n=T[e.estado],u=y[e.estado],x=e.queja_en??e.rebotado_en??e.abierto_en??e.entregado_en??e.enviado_en??e.creado_en,o=[];if(e.queja_en&&o.push('<span title="El destinatario marcó el mail como spam." class="text-[9px] uppercase tracking-widest text-wine-300 px-1.5 py-0.5 border border-wine-400/40 rounded-sm">Spam</span>'),e.entregado_en&&!e.rebotado_en&&o.push('<span title="Resend confirmó la entrega al servidor del destinatario." class="text-[9px] uppercase tracking-widest text-sky-300 px-1.5 py-0.5 border border-sky-400/40 rounded-sm">Entregado</span>'),e.abierto_en){const v=e.aperturas&&e.aperturas>1?` ×${e.aperturas}`:"";o.push(`<span title="${e.aperturas??1} apertura(s) registrada(s) por Resend." class="text-[9px] uppercase tracking-widest text-emerald-300 px-1.5 py-0.5 border border-emerald-400/40 rounded-sm">Abierto${v}</span>`)}return`
        <div class="px-6 py-4">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <span class="font-mono text-sm text-parchment-100">${a(e.email_snapshot)}</span>
                <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${n}">${u}</span>
                ${o.join("")}
              </div>
              ${e.nombre_snapshot?`<div class="text-xs text-parchment-300 font-serif">${a(e.nombre_snapshot)}</div>`:""}
              ${e.error_mensaje?`<div class="text-xs text-wine-300 mt-1 font-mono break-all">
                       ${e.error_codigo?a(e.error_codigo)+" · ":""}${a(e.error_mensaje)}
                     </div>`:""}
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right shrink-0">
              ${a($(x))}
              ${e.intentos>1?`<div class="text-[9px] text-parchment-500 mt-0.5 normal-case">${e.intentos} intentos</div>`:""}
            </div>
          </div>
        </div>`}).join("")}async function c(){if(!r)return;s.innerHTML='<div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>';const t=await f(r);if(!t){p.textContent="Campaña no encontrada",s.innerHTML="";return}A(t);const{filas:e,total:n}=await b(r,{estado:d==="todos"?void 0:d,busqueda:m,limite:500});_.textContent=`${n} ${n===1?"envío":"envíos"}`,k(e)}document.querySelectorAll(".filtro-btn").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(e=>e.classList.remove("is-active")),t.classList.add("is-active"),d=t.dataset.filtro??"todos",c()})});let i=null;l.addEventListener("input",()=>{m=l.value,i&&clearTimeout(i),i=setTimeout(c,250)});c();

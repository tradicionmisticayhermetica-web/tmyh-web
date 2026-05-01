import{o as u,h as x,E as f}from"./newsletter-cms.CrzAjGf6.js";import{f as b}from"./admin.BtFX5QZo.js";import"./supabase.2Xnj7Pbd.js";const g=new URLSearchParams(window.location.search),o=g.get("id");o||window.location.replace("/area-reservada/newsletter");const l=document.getElementById("titulo-campana"),$=document.getElementById("resumen-meta"),h=document.getElementById("link-volver"),r=document.getElementById("lista-envios"),w=document.getElementById("contador"),c=document.getElementById("buscador");let s="todos",m="";const E={pendiente:"Pendiente",enviando:"Enviando",enviado:"Enviado",fallido:"Fallido",rebotado_definitivo:"Rebote",cancelado:"Cancelado"},_={pendiente:"text-parchment-400 border-parchment-400/30",enviando:"text-gold-200 border-gold-400/60 bg-gold-400/10",enviado:"text-emerald-300 border-emerald-400/40 bg-emerald-400/5",fallido:"text-wine-300 border-wine-400/40 bg-wine-400/5",rebotado_definitivo:"text-wine-200 border-wine-400/60 bg-wine-400/10",cancelado:"text-parchment-600 border-parchment-600/20 opacity-60"};function a(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function y(e){l.textContent=e.asunto,h.href=`/area-reservada/newsletter/editar?id=${e.id}`,$.textContent=[`Estado: ${f[e.estado]}`,`${e.total_destinatarios} destinatarios`,`${e.enviados} enviados`,`${e.fallidos} fallidos`,`${e.rebotados} rebotados`,`${e.abiertos} abiertos`].join(" · ")}function A(e){if(e.length===0){r.innerHTML=`
          <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">
            No hay envíos en esta vista.
          </div>`;return}r.innerHTML=e.map(t=>{const n=_[t.estado],p=E[t.estado],v=t.enviado_en??t.rebotado_en??t.creado_en;return`
        <div class="px-6 py-4">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <span class="font-mono text-sm text-parchment-100">${a(t.email_snapshot)}</span>
                <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${n}">${p}</span>
                ${t.abierto_en?'<span class="text-[9px] uppercase tracking-widest text-emerald-300 px-1.5 py-0.5 border border-emerald-400/40 rounded-sm">Abierto</span>':""}
              </div>
              ${t.nombre_snapshot?`<div class="text-xs text-parchment-300 font-serif">${a(t.nombre_snapshot)}</div>`:""}
              ${t.error_mensaje?`<div class="text-xs text-wine-300 mt-1 font-mono break-all">
                       ${t.error_codigo?a(t.error_codigo)+" · ":""}${a(t.error_mensaje)}
                     </div>`:""}
            </div>
            <div class="text-[11px] text-parchment-400 uppercase tracking-widest whitespace-nowrap text-right shrink-0">
              ${a(b(v))}
              ${t.intentos>1?`<div class="text-[9px] text-parchment-500 mt-0.5 normal-case">${t.intentos} intentos</div>`:""}
            </div>
          </div>
        </div>`}).join("")}async function d(){if(!o)return;r.innerHTML='<div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>';const e=await u(o);if(!e){l.textContent="Campaña no encontrada",r.innerHTML="";return}y(e);const{filas:t,total:n}=await x(o,{estado:s==="todos"?void 0:s,busqueda:m,limite:500});w.textContent=`${n} ${n===1?"envío":"envíos"}`,A(t)}document.querySelectorAll(".filtro-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".filtro-btn").forEach(t=>t.classList.remove("is-active")),e.classList.add("is-active"),s=e.dataset.filtro??"todos",d()})});let i=null;c.addEventListener("input",()=>{m=c.value,i&&clearTimeout(i),i=setTimeout(d,250)});d();

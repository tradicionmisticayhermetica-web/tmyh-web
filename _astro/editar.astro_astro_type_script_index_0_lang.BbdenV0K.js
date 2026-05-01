import{o as v,l as j,C as D,E as H,e as T,p as R,a as z,b as G,c as J,d as O,g as V,s as U,f as F}from"./newsletter-cms.BgcwjR6v.js";import{f as y}from"./admin.WE6qEwXd.js";import"./supabase.2Xnj7Pbd.js";const q=new URLSearchParams(window.location.search),M=q.get("id");M||window.location.replace("/area-reservada/newsletter");const b=document.getElementById("asunto"),Q=document.getElementById("campana-asunto-titular"),S=document.getElementById("campana-estado-badge"),K=document.getElementById("campana-meta"),W=document.getElementById("acciones-superiores"),X=document.getElementById("acciones-inferiores"),_=document.getElementById("bloque-progreso"),Y=document.getElementById("prog-enviados"),Z=document.getElementById("prog-total"),ee=document.getElementById("prog-restante"),te=document.getElementById("prog-fill"),ae=document.getElementById("prog-detalle"),ne=document.getElementById("prog-link-detalle"),f=document.getElementById("posts-seleccionados"),k=document.getElementById("posts-vacio"),p=document.getElementById("mensaje"),I=document.getElementById("editor-blog-root"),g=document.getElementById("modal-posts"),E=document.getElementById("btn-agregar-posts"),oe=document.getElementById("btn-cerrar-modal-posts"),se=document.getElementById("btn-cancelar-modal-posts"),re=document.getElementById("btn-aplicar-posts"),w=document.getElementById("lista-posts-disponibles"),P=document.getElementById("buscador-posts"),ie=document.getElementById("modal-contador"),ce=document.getElementById("btn-vista-previa"),de=document.getElementById("btn-enviar-prueba"),n={campana:null,postsActuales:[],postsDisponibles:[],seleccionPendiente:new Set,busquedaPosts:"",bufferIntroJson:null,bufferIntroHtml:null,sucio:!1};function i(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function d(e){window.__tmyhLoader?.show?.(e)}function l(){window.__tmyhLoader?.hide?.()}function c(e,t){p.textContent=e,p.className="mb-6 px-4 py-3 rounded-sm text-sm font-sans border",t==="ok"?p.classList.add("border-emerald-400/30","bg-emerald-400/5","text-emerald-200"):t==="error"?p.classList.add("border-wine-400/40","bg-wine-400/5","text-wine-200"):p.classList.add("border-gold-400/30","bg-gold-400/5","text-gold-200"),p.classList.remove("hidden")}function m(){p.classList.add("hidden")}function A(e){return e.estado==="borrador"||e.estado==="pausada"}function x(e){Q.textContent=e.asunto||"(sin asunto)";const t=D[e.estado]??"text-parchment-400 border-parchment-400/30";S.textContent=H[e.estado]??e.estado,S.className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm "+t;const a=[];a.push(`Creada ${y(e.creada_en)}`),e.encolada_en&&a.push(`Encolada ${y(e.encolada_en)}`),e.enviada_en&&a.push(`Terminada ${y(e.enviada_en)}`),K.textContent=a.join(" · "),le(e),ue(e),pe(e);const o=A(e);b.disabled=!o,E.disabled=!o,E.classList.toggle("opacity-40",!o),E.classList.toggle("pointer-events-none",!o)}function le(e){const t=e.estado==="lista"||e.estado==="enviando"||e.estado==="enviada"||e.estado==="pausada";W.innerHTML=t?`<a href="/area-reservada/newsletter/envios?id=${e.id}"
              class="text-[11px] uppercase tracking-widest text-parchment-300 hover:text-gold-300 transition px-3 py-1.5 border border-gold-400/20 rounded-sm">
              Ver envíos
            </a>`:""}function ue(e){let t="";A(e)?(t+=`
          <button type="button" id="btn-guardar"
                  class="btn-ghost text-xs">Guardar borrador</button>`,t+=`
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" id="btn-eliminar"
                    class="text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
              Eliminar
            </button>
            <button type="button" id="btn-encolar" class="btn-gold text-xs">
              ${e.estado==="pausada"?"Reanudar envíos":"Encolar y enviar"}
            </button>
          </div>`):e.estado==="lista"||e.estado==="enviando"?t+=`
          <p class="text-xs text-parchment-400 italic font-serif">
            La campaña está en cola. Se irán enviando lotes según el límite de Resend.
          </p>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" id="btn-pausar"
                    class="text-[11px] uppercase tracking-widest text-amber-300 hover:text-amber-200 transition px-3 py-1.5 border border-amber-400/30 rounded-sm">
              Pausar
            </button>
            <button type="button" id="btn-cancelar"
                    class="text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
              Cancelar campaña
            </button>
          </div>`:e.estado==="enviada"?t+=`
          <p class="text-xs text-parchment-400 italic font-serif">
            Campaña terminada. Los datos quedan como histórico.
          </p>`:e.estado==="cancelada"?t+=`
          <p class="text-xs text-parchment-400 italic font-serif">
            Campaña cancelada. No se enviarán más correos.
          </p>
          <button type="button" id="btn-eliminar" class="ml-auto text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
            Eliminar definitivamente
          </button>`:t+=`
          <p class="text-xs text-wine-300 italic font-serif">
            Campaña en estado fallido. Cancelala y volvé a empezar si es necesario.
          </p>
          <button type="button" id="btn-cancelar" class="ml-auto text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
            Cancelar
          </button>`,X.innerHTML=t,document.getElementById("btn-guardar")?.addEventListener("click",ye),document.getElementById("btn-encolar")?.addEventListener("click",Ee),document.getElementById("btn-pausar")?.addEventListener("click",we),document.getElementById("btn-cancelar")?.addEventListener("click",he),document.getElementById("btn-eliminar")?.addEventListener("click",Le)}function pe(e){if(!["lista","enviando","pausada","enviada"].includes(e.estado)){_.classList.add("hidden");return}_.classList.remove("hidden"),Y.textContent=String(e.enviados),Z.textContent=String(e.total_destinatarios),ee.textContent=T(e);const a=R(e);te.style.width=`${a}%`,ae.textContent=`${a}% · ${e.fallidos} fallidos · ${e.rebotados} rebotados · ${e.abiertos} abiertos`,ne.href=`/area-reservada/newsletter/envios?id=${e.id}`}function h(){const e=!!n.campana&&A(n.campana);if(n.postsActuales.length===0){f.innerHTML="",f.appendChild(k),k.classList.remove("hidden");return}k.classList.add("hidden"),f.innerHTML=n.postsActuales.map((t,a)=>`
        <div class="post-card" draggable="${e?"true":"false"}" data-id="${t.id}" data-index="${a}">
          <div class="post-card-handle" aria-hidden="true">⋮⋮</div>
          <div class="post-card-info">
            <div class="font-display text-parchment-50 text-sm">${i(t.titulo)}</div>
            <div class="text-xs text-parchment-500 font-mono mt-0.5">/blog/${i(t.slug)}</div>
            ${t.extracto?`<p class="text-xs text-parchment-300 mt-1.5 font-serif italic line-clamp-2">${i(t.extracto)}</p>`:""}
          </div>
          ${e?`<button type="button" class="post-card-quitar" data-quitar="${t.id}">Quitar</button>`:""}
        </div>`).join(""),f.querySelectorAll("[data-quitar]").forEach(t=>{t.addEventListener("click",()=>{const a=t.dataset.quitar;n.postsActuales=n.postsActuales.filter(o=>o.id!==a),n.sucio=!0,h()})}),e&&me()}function me(){let e=null;f.querySelectorAll(".post-card").forEach(a=>{a.addEventListener("dragstart",o=>{e=Number(a.dataset.index),a.classList.add("is-dragging"),o.dataTransfer?.setData("text/plain",String(e))}),a.addEventListener("dragend",()=>{e=null,a.classList.remove("is-dragging"),f.querySelectorAll(".is-drop-target").forEach(o=>o.classList.remove("is-drop-target"))}),a.addEventListener("dragover",o=>{o.preventDefault(),a.classList.add("is-drop-target")}),a.addEventListener("dragleave",()=>{a.classList.remove("is-drop-target")}),a.addEventListener("drop",o=>{o.preventDefault(),a.classList.remove("is-drop-target");const r=Number(a.dataset.index);if(e===null||e===r)return;const[s]=n.postsActuales.splice(e,1);n.postsActuales.splice(r,0,s),n.sucio=!0,h()})})}function fe(){n.seleccionPendiente=new Set(n.postsActuales.map(e=>e.id)),n.busquedaPosts="",P.value="",g.classList.remove("hidden"),g.classList.add("flex"),be()}function L(){g.classList.add("hidden"),g.classList.remove("flex")}async function be(){w.innerHTML=`
        <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>`,n.postsDisponibles=await j(200),N()}function N(){const e=n.busquedaPosts.trim().toLowerCase(),t=e?n.postsDisponibles.filter(a=>(a.titulo+" "+a.slug+" "+(a.extracto??"")).toLowerCase().includes(e)):n.postsDisponibles;if(t.length===0){w.innerHTML=`
          <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">
            No hay artículos publicados ${e?"para esa búsqueda":""}.
          </div>`,C();return}w.innerHTML=t.map(a=>{const o=n.seleccionPendiente.has(a.id);return`
          <label class="post-pickable ${o?"is-checked":""}" data-id="${a.id}">
            <input type="checkbox" ${o?"checked":""} data-id="${a.id}" />
            <div class="flex-1 min-w-0">
              <div class="font-display text-parchment-50 text-sm">${i(a.titulo)}</div>
              <div class="text-[11px] text-parchment-500 font-mono mt-0.5">/blog/${i(a.slug)}</div>
              ${a.extracto?`<p class="text-xs text-parchment-300 mt-1 font-serif italic line-clamp-2">${i(a.extracto)}</p>`:""}
              ${a.publicado_en?`<p class="text-[10px] text-parchment-500 mt-1 uppercase tracking-widest">${i(y(a.publicado_en))}</p>`:""}
            </div>
          </label>`}).join(""),w.querySelectorAll('input[type="checkbox"]').forEach(a=>{a.addEventListener("change",()=>{const o=a.dataset.id;a.checked?n.seleccionPendiente.add(o):n.seleccionPendiente.delete(o),a.closest(".post-pickable")?.classList.toggle("is-checked",a.checked),C()})}),C()}function C(){const e=n.seleccionPendiente.size;ie.textContent=`${e} ${e===1?"seleccionado":"seleccionados"}`}function ge(){const e=n.postsActuales.map(s=>s.id),t=Array.from(n.seleccionPendiente).filter(s=>!e.includes(s)),a=n.postsActuales.filter(s=>n.seleccionPendiente.has(s.id)),o=new Map(n.postsDisponibles.map(s=>[s.id,s])),r=t.map(s=>o.get(s)).filter(s=>!!s).map(s=>({id:s.id,titulo:s.titulo,slug:s.slug,extracto:s.extracto,publicado_en:s.publicado_en}));n.postsActuales=[...a,...r],n.sucio=!0,h(),L()}async function ve(){d("Cargando campaña…");try{const e=await v(M);if(!e){c("La campaña no existe o ya fue eliminada.","error");return}n.campana=e,n.bufferIntroJson=e.intro_json??null,n.bufferIntroHtml=e.intro_html??null,n.postsActuales=e.posts.map(t=>({id:t.post_id,titulo:t.titulo??"(sin título)",slug:t.slug??"",extracto:t.extracto??null,publicado_en:t.publicado_en??null})),b.value=e.asunto??"",I&&I.dispatchEvent(new CustomEvent("editor:setContent",{detail:{json:n.bufferIntroJson,html:n.bufferIntroHtml}})),x(e),h(),q.get("nueva")==="1"&&(b.focus(),b.select()),["lista","enviando"].includes(e.estado)&&setInterval(xe,2e4)}finally{l()}}async function xe(){if(!n.campana)return;const e=await v(n.campana.id);e&&(n.campana=e,x(e))}I?.addEventListener("editor:change",e=>{const t=e.detail;n.bufferIntroJson=t?.json??null,n.bufferIntroHtml=t?.html??null,n.sucio=!0});b.addEventListener("input",()=>{n.sucio=!0});async function $(){if(!n.campana)return!1;const e=await V({id:n.campana.id,asunto:b.value.trim()||"(sin asunto)",intro_json:n.bufferIntroJson,intro_html:n.bufferIntroHtml});if(!e.ok)return c(`No se pudo guardar: ${e.error}`,"error"),!1;const t=await U(n.campana.id,n.postsActuales.map(a=>a.id));return t.ok?(n.sucio=!1,!0):(c(`No se pudieron guardar los artículos: ${t.error}`,"error"),!1)}async function ye(){m(),d("Guardando…");try{if(!await $())return;c("Borrador guardado.","ok");const t=await v(n.campana.id);t&&(n.campana=t,x(t))}finally{l()}}async function Ee(){if(!(!n.campana||(m(),!await B({titulo:"¿Encolar y enviar?",cuerpo:"Se va a generar un envío para cada suscriptor activo. La campaña pasa a la cola y los correos se irán mandando según el límite diario de Resend (~100/día). No se puede deshacer fácilmente, pero podés pausar o cancelar después.",confirmar:"Encolar",cancelar:"Mejor no"})))){d("Guardando cambios…");try{if(n.sucio&&!await $())return}finally{l()}d("Encolando campaña…");try{const t=await z(n.campana.id);if(!t.ok){c(`No se pudo encolar: ${t.error}`,"error");return}c("Campaña encolada. Los envíos comenzarán en la próxima corrida del worker.","ok");const a=await v(n.campana.id);a&&(n.campana=a,x(a))}finally{l()}}}async function we(){if(n.campana){m(),d("Pausando…");try{const e=await G(n.campana.id);if(!e.ok){c(`No se pudo pausar: ${e.error}`,"error");return}const t=await v(n.campana.id);t&&(n.campana=t,x(t))}finally{l()}}}async function he(){if(!(!n.campana||(m(),!await B({titulo:"¿Cancelar la campaña?",cuerpo:"Los envíos pendientes no se mandarán. Esta acción es definitiva. Los envíos ya enviados quedan como histórico.",confirmar:"Sí, cancelar",cancelar:"Mejor no",peligroso:!0})))){d("Cancelando…");try{const t=await J(n.campana.id);if(!t.ok){c(`No se pudo cancelar: ${t.error}`,"error");return}const a=await v(n.campana.id);a&&(n.campana=a,x(a))}finally{l()}}}async function Le(){if(!(!n.campana||(m(),!await B({titulo:"¿Eliminar definitivamente?",cuerpo:"Se borra la campaña y todo su histórico de envíos. No se puede recuperar.",confirmar:"Eliminar",cancelar:"No",peligroso:!0})))){d("Eliminando…");try{const t=await O(n.campana.id);if(!t.ok){c(`No se pudo eliminar: ${t.error}`,"error");return}window.location.replace("/area-reservada/newsletter")}finally{l()}}}function B(e){return new Promise(t=>{const a=document.createElement("div");a.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4",a.innerHTML=`
          <div class="card-altar p-6 max-w-md w-full space-y-4">
            <p class="font-display text-lg text-parchment-50">${i(e.titulo)}</p>
            <p class="text-sm text-parchment-300 font-serif">${i(e.cuerpo)}</p>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button type="button" data-act="cancel"
                      class="btn-ghost text-xs">${i(e.cancelar)}</button>
              <button type="button" data-act="ok"
                      class="${e.peligroso?"text-[11px] uppercase tracking-widest bg-wine-500 hover:bg-wine-400 text-parchment-50 px-4 py-2 rounded-sm transition":"btn-gold text-xs"}">
                ${i(e.confirmar)}
              </button>
            </div>
          </div>`,document.body.appendChild(a);const o=r=>{a.remove(),t(r)};a.querySelector('[data-act="ok"]')?.addEventListener("click",()=>o(!0)),a.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>o(!1)),a.addEventListener("click",r=>{r.target===a&&o(!1)})})}E.addEventListener("click",fe);oe.addEventListener("click",L);se.addEventListener("click",L);re.addEventListener("click",ge);g.addEventListener("click",e=>{e.target===g&&L()});P.addEventListener("input",()=>{n.busquedaPosts=P.value,N()});ce.addEventListener("click",async()=>{if(!n.campana)return;m();const e=window.open("about:blank","_blank");if(n.sucio){d("Guardando cambios para la vista previa…");try{if(!await $()){e?.close();return}}finally{l()}}const t=`/area-reservada/newsletter/preview?id=${n.campana.id}`;e?e.location.href=t:window.location.href=t});de.addEventListener("click",async()=>{if(!n.campana)return;m();const e=await $e();if(e){if(n.sucio){d("Guardando cambios…");try{if(!await $())return}finally{l()}}d(`Enviando prueba a ${e}…`);try{const t=await F(n.campana.id,e);if(!t.ok){c(`No se pudo enviar la prueba: ${t.error}${t.detalle?" — "+JSON.stringify(t.detalle):""}`,"error");return}c(`Prueba enviada a ${t.enviado_a}. Revisá la bandeja (puede tardar 1-2 minutos en llegar).`,"ok")}finally{l()}}});function $e(){const e="tradicionmisticayhermetica@gmail.com";return new Promise(t=>{const a=document.createElement("div");a.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4",a.innerHTML=`
          <div class="card-altar p-6 max-w-md w-full space-y-4">
            <p class="font-display text-lg text-parchment-50">Enviar prueba</p>
            <p class="text-sm text-parchment-300 font-serif">
              Mandamos una copia del email a una sola dirección, sin tocar
              la lista de suscriptores. El asunto va a aparecer prefijado con <code class="text-gold-300">[PRUEBA]</code>.
            </p>
            <label for="email-prueba-input" class="block text-[11px] uppercase tracking-widest text-parchment-400">
              Email destino
            </label>
            <input
              id="email-prueba-input"
              type="email"
              value="${e}"
              class="w-full bg-night-950/60 border border-gold-400/15 focus:border-gold-400/60 outline-none text-parchment-100 px-3 py-2 text-sm font-mono rounded-sm"
            />
            <div class="flex items-center justify-end gap-2 pt-2">
              <button type="button" data-act="cancel" class="btn-ghost text-xs">Cancelar</button>
              <button type="button" data-act="ok" class="btn-gold text-xs">Enviar</button>
            </div>
          </div>`,document.body.appendChild(a);const o=a.querySelector("#email-prueba-input");o.focus(),o.select();const r=u=>{a.remove(),t(u)},s=()=>{const u=o.value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)){o.classList.add("border-wine-400/60"),o.focus();return}r(u)};a.querySelector('[data-act="ok"]')?.addEventListener("click",s),a.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>r(null)),a.addEventListener("click",u=>{u.target===a&&r(null)}),o.addEventListener("keydown",u=>{u.key==="Enter"&&s(),u.key==="Escape"&&r(null)})})}window.addEventListener("beforeunload",e=>{n.sucio&&(e.preventDefault(),e.returnValue="")});ve();

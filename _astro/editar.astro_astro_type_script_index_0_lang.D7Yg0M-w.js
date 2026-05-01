import{o as v,l as N,C as D,E as H,e as T,p as R,a as z,b as G,c as J,d as O,g as V,s as U,f as F}from"./newsletter-cms.CrzAjGf6.js";import{f as y}from"./admin.BtFX5QZo.js";import"./supabase.2Xnj7Pbd.js";const q=new URLSearchParams(window.location.search),M=q.get("id");M||window.location.replace("/area-reservada/newsletter");const b=document.getElementById("asunto"),Q=document.getElementById("campana-asunto-titular"),_=document.getElementById("campana-estado-badge"),K=document.getElementById("campana-meta"),W=document.getElementById("acciones-superiores"),X=document.getElementById("acciones-inferiores"),S=document.getElementById("bloque-progreso"),Y=document.getElementById("prog-enviados"),Z=document.getElementById("prog-total"),ee=document.getElementById("prog-restante"),te=document.getElementById("prog-fill"),ae=document.getElementById("prog-detalle"),ne=document.getElementById("prog-link-detalle"),f=document.getElementById("posts-seleccionados"),k=document.getElementById("posts-vacio"),p=document.getElementById("mensaje"),I=document.getElementById("editor-blog-root"),g=document.getElementById("modal-posts"),E=document.getElementById("btn-agregar-posts"),oe=document.getElementById("btn-cerrar-modal-posts"),se=document.getElementById("btn-cancelar-modal-posts"),re=document.getElementById("btn-aplicar-posts"),w=document.getElementById("lista-posts-disponibles"),P=document.getElementById("buscador-posts"),ie=document.getElementById("modal-contador"),ce=document.getElementById("btn-vista-previa"),de=document.getElementById("btn-enviar-prueba"),n={campana:null,postsActuales:[],postsDisponibles:[],seleccionPendiente:new Set,busquedaPosts:"",bufferIntroJson:null,bufferIntroHtml:null,sucio:!1};function i(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function d(e){window.__tmyhLoader?.show?.(e)}function l(){window.__tmyhLoader?.hide?.()}function c(e,a){p.textContent=e,p.className="mb-6 px-4 py-3 rounded-sm text-sm font-sans border",a==="ok"?p.classList.add("border-emerald-400/30","bg-emerald-400/5","text-emerald-200"):a==="error"?p.classList.add("border-wine-400/40","bg-wine-400/5","text-wine-200"):p.classList.add("border-gold-400/30","bg-gold-400/5","text-gold-200"),p.classList.remove("hidden")}function m(){p.classList.add("hidden")}function A(e){return e.estado==="borrador"||e.estado==="pausada"}function x(e){Q.textContent=e.asunto||"(sin asunto)";const a=D[e.estado]??"text-parchment-400 border-parchment-400/30";_.textContent=H[e.estado]??e.estado,_.className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm "+a;const t=[];t.push(`Creada ${y(e.creada_en)}`),e.encolada_en&&t.push(`Encolada ${y(e.encolada_en)}`),e.enviada_en&&t.push(`Terminada ${y(e.enviada_en)}`),K.textContent=t.join(" · "),le(e),ue(e),pe(e);const o=A(e);b.disabled=!o,E.disabled=!o,E.classList.toggle("opacity-40",!o),E.classList.toggle("pointer-events-none",!o)}function le(e){const a=e.estado==="lista"||e.estado==="enviando"||e.estado==="enviada"||e.estado==="pausada";W.innerHTML=a?`<a href="/area-reservada/newsletter/envios?id=${e.id}"
              class="text-[11px] uppercase tracking-widest text-parchment-300 hover:text-gold-300 transition px-3 py-1.5 border border-gold-400/20 rounded-sm">
              Ver envíos
            </a>`:""}function ue(e){let a="";A(e)?(a+=`
          <button type="button" id="btn-guardar"
                  class="btn-ghost text-xs">Guardar borrador</button>`,a+=`
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" id="btn-eliminar"
                    class="text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
              Eliminar
            </button>
            <button type="button" id="btn-encolar" class="btn-gold text-xs">
              ${e.estado==="pausada"?"Reanudar envíos":"Encolar y enviar"}
            </button>
          </div>`):e.estado==="lista"||e.estado==="enviando"?a+=`
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
          </div>`:e.estado==="enviada"?a+=`
          <p class="text-xs text-parchment-400 italic font-serif">
            Campaña terminada. Los datos quedan como histórico.
          </p>`:e.estado==="cancelada"?a+=`
          <p class="text-xs text-parchment-400 italic font-serif">
            Campaña cancelada. No se enviarán más correos.
          </p>
          <button type="button" id="btn-eliminar" class="ml-auto text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
            Eliminar definitivamente
          </button>`:a+=`
          <p class="text-xs text-wine-300 italic font-serif">
            Campaña en estado fallido. Cancelala y volvé a empezar si es necesario.
          </p>
          <button type="button" id="btn-cancelar" class="ml-auto text-[11px] uppercase tracking-widest text-wine-300 hover:text-wine-200 transition px-3 py-1.5 border border-wine-400/30 rounded-sm">
            Cancelar
          </button>`,X.innerHTML=a,document.getElementById("btn-guardar")?.addEventListener("click",ye),document.getElementById("btn-encolar")?.addEventListener("click",Ee),document.getElementById("btn-pausar")?.addEventListener("click",we),document.getElementById("btn-cancelar")?.addEventListener("click",he),document.getElementById("btn-eliminar")?.addEventListener("click",Le)}function pe(e){if(!["lista","enviando","pausada","enviada"].includes(e.estado)){S.classList.add("hidden");return}S.classList.remove("hidden"),Y.textContent=String(e.enviados),Z.textContent=String(e.total_destinatarios),ee.textContent=T(e);const t=R(e);te.style.width=`${t}%`,ae.textContent=`${t}% · ${e.fallidos} fallidos · ${e.rebotados} rebotados · ${e.abiertos} abiertos`,ne.href=`/area-reservada/newsletter/envios?id=${e.id}`}function h(){const e=!!n.campana&&A(n.campana);if(n.postsActuales.length===0){f.innerHTML="",f.appendChild(k),k.classList.remove("hidden");return}k.classList.add("hidden"),f.innerHTML=n.postsActuales.map((a,t)=>`
        <div class="post-card" draggable="${e?"true":"false"}" data-id="${a.id}" data-index="${t}">
          <div class="post-card-handle" aria-hidden="true">⋮⋮</div>
          <div class="post-card-info">
            <div class="font-display text-parchment-50 text-sm">${i(a.titulo)}</div>
            <div class="text-xs text-parchment-500 font-mono mt-0.5">/blog/${i(a.slug)}</div>
            ${a.extracto?`<p class="text-xs text-parchment-300 mt-1.5 font-serif italic line-clamp-2">${i(a.extracto)}</p>`:""}
          </div>
          ${e?`<button type="button" class="post-card-quitar" data-quitar="${a.id}">Quitar</button>`:""}
        </div>`).join(""),f.querySelectorAll("[data-quitar]").forEach(a=>{a.addEventListener("click",()=>{const t=a.dataset.quitar;n.postsActuales=n.postsActuales.filter(o=>o.id!==t),n.sucio=!0,h()})}),e&&me()}function me(){let e=null;f.querySelectorAll(".post-card").forEach(t=>{t.addEventListener("dragstart",o=>{e=Number(t.dataset.index),t.classList.add("is-dragging"),o.dataTransfer?.setData("text/plain",String(e))}),t.addEventListener("dragend",()=>{e=null,t.classList.remove("is-dragging"),f.querySelectorAll(".is-drop-target").forEach(o=>o.classList.remove("is-drop-target"))}),t.addEventListener("dragover",o=>{o.preventDefault(),t.classList.add("is-drop-target")}),t.addEventListener("dragleave",()=>{t.classList.remove("is-drop-target")}),t.addEventListener("drop",o=>{o.preventDefault(),t.classList.remove("is-drop-target");const r=Number(t.dataset.index);if(e===null||e===r)return;const[s]=n.postsActuales.splice(e,1);n.postsActuales.splice(r,0,s),n.sucio=!0,h()})})}function fe(){n.seleccionPendiente=new Set(n.postsActuales.map(e=>e.id)),n.busquedaPosts="",P.value="",g.classList.remove("hidden"),g.classList.add("flex"),be()}function L(){g.classList.add("hidden"),g.classList.remove("flex")}async function be(){w.innerHTML=`
        <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>`,n.postsDisponibles=await N(200),j()}function j(){const e=n.busquedaPosts.trim().toLowerCase(),a=e?n.postsDisponibles.filter(t=>(t.titulo+" "+t.slug+" "+(t.extracto??"")).toLowerCase().includes(e)):n.postsDisponibles;if(a.length===0){w.innerHTML=`
          <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">
            No hay artículos publicados ${e?"para esa búsqueda":""}.
          </div>`,C();return}w.innerHTML=a.map(t=>{const o=n.seleccionPendiente.has(t.id);return`
          <label class="post-pickable ${o?"is-checked":""}" data-id="${t.id}">
            <input type="checkbox" ${o?"checked":""} data-id="${t.id}" />
            <div class="flex-1 min-w-0">
              <div class="font-display text-parchment-50 text-sm">${i(t.titulo)}</div>
              <div class="text-[11px] text-parchment-500 font-mono mt-0.5">/blog/${i(t.slug)}</div>
              ${t.extracto?`<p class="text-xs text-parchment-300 mt-1 font-serif italic line-clamp-2">${i(t.extracto)}</p>`:""}
              ${t.publicado_en?`<p class="text-[10px] text-parchment-500 mt-1 uppercase tracking-widest">${i(y(t.publicado_en))}</p>`:""}
            </div>
          </label>`}).join(""),w.querySelectorAll('input[type="checkbox"]').forEach(t=>{t.addEventListener("change",()=>{const o=t.dataset.id;t.checked?n.seleccionPendiente.add(o):n.seleccionPendiente.delete(o),t.closest(".post-pickable")?.classList.toggle("is-checked",t.checked),C()})}),C()}function C(){const e=n.seleccionPendiente.size;ie.textContent=`${e} ${e===1?"seleccionado":"seleccionados"}`}function ge(){const e=n.postsActuales.map(s=>s.id),a=Array.from(n.seleccionPendiente).filter(s=>!e.includes(s)),t=n.postsActuales.filter(s=>n.seleccionPendiente.has(s.id)),o=new Map(n.postsDisponibles.map(s=>[s.id,s])),r=a.map(s=>o.get(s)).filter(s=>!!s).map(s=>({id:s.id,titulo:s.titulo,slug:s.slug,extracto:s.extracto,publicado_en:s.publicado_en}));n.postsActuales=[...t,...r],n.sucio=!0,h(),L()}async function ve(){d("Cargando campaña…");try{const e=await v(M);if(!e){c("La campaña no existe o ya fue eliminada.","error");return}n.campana=e,n.bufferIntroJson=e.intro_json??null,n.bufferIntroHtml=e.intro_html??null,n.postsActuales=e.posts.map(a=>({id:a.post_id,titulo:a.titulo??"(sin título)",slug:a.slug??"",extracto:a.extracto??null,publicado_en:a.publicado_en??null})),b.value=e.asunto??"",I&&I.dispatchEvent(new CustomEvent("editor:setContent",{detail:{json:n.bufferIntroJson,html:n.bufferIntroHtml}})),x(e),h(),q.get("nueva")==="1"&&(b.focus(),b.select()),["lista","enviando"].includes(e.estado)&&setInterval(xe,2e4)}finally{l()}}async function xe(){if(!n.campana)return;const e=await v(n.campana.id);e&&(n.campana=e,x(e))}I?.addEventListener("editor:change",e=>{const a=e.detail;n.bufferIntroJson=a?.json??null,n.bufferIntroHtml=a?.html??null,n.sucio=!0});b.addEventListener("input",()=>{n.sucio=!0});async function $(){if(!n.campana)return!1;const e=await V({id:n.campana.id,asunto:b.value.trim()||"(sin asunto)",intro_json:n.bufferIntroJson,intro_html:n.bufferIntroHtml});if(!e.ok)return c(`No se pudo guardar: ${e.error}`,"error"),!1;const a=await U(n.campana.id,n.postsActuales.map(t=>t.id));return a.ok?(n.sucio=!1,!0):(c(`No se pudieron guardar los artículos: ${a.error}`,"error"),!1)}async function ye(){m(),d("Guardando…");try{if(!await $())return;c("Borrador guardado.","ok");const a=await v(n.campana.id);a&&(n.campana=a,x(a))}finally{l()}}async function Ee(){if(!(!n.campana||(m(),!await B({titulo:"¿Encolar y enviar?",cuerpo:"Se va a generar un envío para cada suscriptor activo. La campaña pasa a la cola y los correos se irán mandando según el límite diario de Resend (~100/día). No se puede deshacer fácilmente, pero podés pausar o cancelar después.",confirmar:"Encolar",cancelar:"Mejor no"})))){d("Guardando cambios…");try{if(n.sucio&&!await $())return}finally{l()}d("Encolando campaña…");try{const a=await z(n.campana.id);if(!a.ok){c(`No se pudo encolar: ${a.error}`,"error");return}c("Campaña encolada. Los envíos comenzarán en la próxima corrida del worker.","ok");const t=await v(n.campana.id);t&&(n.campana=t,x(t))}finally{l()}}}async function we(){if(n.campana){m(),d("Pausando…");try{const e=await G(n.campana.id);if(!e.ok){c(`No se pudo pausar: ${e.error}`,"error");return}const a=await v(n.campana.id);a&&(n.campana=a,x(a))}finally{l()}}}async function he(){if(!(!n.campana||(m(),!await B({titulo:"¿Cancelar la campaña?",cuerpo:"Los envíos pendientes no se mandarán. Esta acción es definitiva. Los envíos ya enviados quedan como histórico.",confirmar:"Sí, cancelar",cancelar:"Mejor no",peligroso:!0})))){d("Cancelando…");try{const a=await J(n.campana.id);if(!a.ok){c(`No se pudo cancelar: ${a.error}`,"error");return}const t=await v(n.campana.id);t&&(n.campana=t,x(t))}finally{l()}}}async function Le(){if(!(!n.campana||(m(),!await B({titulo:"¿Eliminar definitivamente?",cuerpo:"Se borra la campaña y todo su histórico de envíos. No se puede recuperar.",confirmar:"Eliminar",cancelar:"No",peligroso:!0})))){d("Eliminando…");try{const a=await O(n.campana.id);if(!a.ok){c(`No se pudo eliminar: ${a.error}`,"error");return}window.location.replace("/area-reservada/newsletter")}finally{l()}}}function B(e){return new Promise(a=>{const t=document.createElement("div");t.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4",t.innerHTML=`
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
          </div>`,document.body.appendChild(t);const o=r=>{t.remove(),a(r)};t.querySelector('[data-act="ok"]')?.addEventListener("click",()=>o(!0)),t.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>o(!1)),t.addEventListener("click",r=>{r.target===t&&o(!1)})})}E.addEventListener("click",fe);oe.addEventListener("click",L);se.addEventListener("click",L);re.addEventListener("click",ge);g.addEventListener("click",e=>{e.target===g&&L()});P.addEventListener("input",()=>{n.busquedaPosts=P.value,j()});ce.addEventListener("click",async()=>{if(!n.campana)return;m();const e=window.open("about:blank","_blank");if(n.sucio){d("Guardando cambios para la vista previa…");try{if(!await $()){e?.close();return}}finally{l()}}const a=`/area-reservada/newsletter/preview?id=${n.campana.id}`;e?e.location.href=a:window.location.href=a});de.addEventListener("click",async()=>{if(!n.campana)return;m();const e=await $e();if(e){if(n.sucio){d("Guardando cambios…");try{if(!await $())return}finally{l()}}d(`Enviando prueba a ${e}…`);try{const a=await F(n.campana.id,e);if(!a.ok){c(`No se pudo enviar la prueba: ${a.error}${a.detalle?" — "+JSON.stringify(a.detalle):""}`,"error");return}const t=a.contacto_existente?"El link de baja del email es funcional: si lo tocás, ese contacto se desuscribe en serio.":"El email destino no es un contacto, así que el link de baja muestra una página informativa.";c(`Prueba enviada a ${a.enviado_a}. Revisá la bandeja (puede tardar 1-2 minutos). ${t}`,"ok")}finally{l()}}});function $e(){const e="tradicionmisticayhermetica@gmail.com";return new Promise(a=>{const t=document.createElement("div");t.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4",t.innerHTML=`
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
          </div>`,document.body.appendChild(t);const o=t.querySelector("#email-prueba-input");o.focus(),o.select();const r=u=>{t.remove(),a(u)},s=()=>{const u=o.value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)){o.classList.add("border-wine-400/60"),o.focus();return}r(u)};t.querySelector('[data-act="ok"]')?.addEventListener("click",s),t.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>r(null)),t.addEventListener("click",u=>{u.target===t&&r(null)}),o.addEventListener("keydown",u=>{u.key==="Enter"&&s(),u.key==="Escape"&&r(null)})})}window.addEventListener("beforeunload",e=>{n.sucio&&(e.preventDefault(),e.returnValue="")});ve();

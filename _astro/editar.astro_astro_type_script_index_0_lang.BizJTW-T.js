import{o as f,l as j,C as D,E as T,e as H,p as R,c as z,a as O,b as G,d as J,f as V,g as F,h as U,s as Q,N as W,i as K}from"./newsletter-cms.ekYa1ri2.js";import{f as y}from"./admin.D6V0mrTb.js";import"./supabase.TwzBJLgx.js";const q=new URLSearchParams(window.location.search),M=q.get("id");M||window.location.replace("/area-reservada/newsletter");const v=document.getElementById("asunto"),X=document.getElementById("campana-asunto-titular"),B=document.getElementById("campana-estado-badge"),Y=document.getElementById("campana-meta"),Z=document.getElementById("acciones-superiores"),ee=document.getElementById("acciones-inferiores"),S=document.getElementById("bloque-progreso"),te=document.getElementById("prog-enviados"),ae=document.getElementById("prog-total"),ne=document.getElementById("prog-restante"),oe=document.getElementById("prog-fill"),se=document.getElementById("prog-detalle"),re=document.getElementById("prog-link-detalle"),g=document.getElementById("posts-seleccionados"),C=document.getElementById("posts-vacio"),m=document.getElementById("mensaje"),P=document.getElementById("editor-blog-root"),x=document.getElementById("modal-posts"),h=document.getElementById("btn-agregar-posts"),ie=document.getElementById("btn-cerrar-modal-posts"),ce=document.getElementById("btn-cancelar-modal-posts"),de=document.getElementById("btn-aplicar-posts"),E=document.getElementById("lista-posts-disponibles"),A=document.getElementById("buscador-posts"),le=document.getElementById("modal-contador"),ue=document.getElementById("btn-vista-previa"),pe=document.getElementById("btn-enviar-prueba"),n={campana:null,postsActuales:[],postsDisponibles:[],seleccionPendiente:new Set,busquedaPosts:"",bufferIntroJson:null,bufferIntroHtml:null,sucio:!1};function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function d(e){window.__tmyhLoader?.show?.(e)}function l(){window.__tmyhLoader?.hide?.()}function r(e,t){m.textContent=e,m.className="mb-6 px-4 py-3 rounded-sm text-sm font-sans border",t==="ok"?m.classList.add("border-emerald-400/30","bg-emerald-400/5","text-emerald-200"):t==="error"?m.classList.add("border-wine-400/40","bg-wine-400/5","text-wine-200"):m.classList.add("border-gold-400/30","bg-gold-400/5","text-gold-200"),m.classList.remove("hidden")}function p(){m.classList.add("hidden")}function _(e){return e.estado==="borrador"||e.estado==="pausada"}function b(e){X.textContent=e.asunto||"(sin asunto)";const t=D[e.estado]??"text-parchment-400 border-parchment-400/30";B.textContent=T[e.estado]??e.estado,B.className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm "+t;const a=[];a.push(`Creada ${y(e.creada_en)}`),e.encolada_en&&a.push(`Encolada ${y(e.encolada_en)}`),e.enviada_en&&a.push(`Terminada ${y(e.enviada_en)}`),Y.textContent=a.join(" · "),me(e),fe(e),be(e);const o=_(e);v.disabled=!o,h.disabled=!o,h.classList.toggle("opacity-40",!o),h.classList.toggle("pointer-events-none",!o)}function me(e){const t=e.estado==="lista"||e.estado==="enviando"||e.estado==="enviada"||e.estado==="pausada";Z.innerHTML=t?`<a href="/area-reservada/newsletter/envios?id=${e.id}"
              class="text-[11px] uppercase tracking-widest text-parchment-300 hover:text-gold-300 transition px-3 py-1.5 border border-gold-400/20 rounded-sm">
              Ver envíos
            </a>`:""}function fe(e){let t="";_(e)?(t+=`
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
            La campaña está en cola. Se procesa automáticamente cada hora.
          </p>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" id="btn-procesar-ahora"
                    class="text-[11px] uppercase tracking-widest text-gold-300 hover:text-gold-200 transition px-3 py-1.5 border border-gold-400/30 rounded-sm">
              Procesar lote ahora
            </button>
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
          </button>`,ee.innerHTML=t,document.getElementById("btn-guardar")?.addEventListener("click",we),document.getElementById("btn-encolar")?.addEventListener("click",$e),document.getElementById("btn-pausar")?.addEventListener("click",ke),document.getElementById("btn-cancelar")?.addEventListener("click",Ce),document.getElementById("btn-eliminar")?.addEventListener("click",Ie),document.getElementById("btn-procesar-ahora")?.addEventListener("click",Le)}function be(e){if(!["lista","enviando","pausada","enviada"].includes(e.estado)){S.classList.add("hidden");return}S.classList.remove("hidden"),te.textContent=String(e.enviados),ae.textContent=String(e.total_destinatarios),ne.textContent=H(e);const a=R(e);oe.style.width=`${a}%`,se.textContent=`${a}% · ${e.fallidos} fallidos · ${e.rebotados} rebotados · ${e.abiertos} abiertos`,re.href=`/area-reservada/newsletter/envios?id=${e.id}`}function w(){const e=!!n.campana&&_(n.campana);if(n.postsActuales.length===0){g.innerHTML="",g.appendChild(C),C.classList.remove("hidden");return}C.classList.add("hidden"),g.innerHTML=n.postsActuales.map((t,a)=>`
        <div class="post-card" draggable="${e?"true":"false"}" data-id="${t.id}" data-index="${a}">
          <div class="post-card-handle" aria-hidden="true">⋮⋮</div>
          <div class="post-card-info">
            <div class="font-display text-parchment-50 text-sm">${u(t.titulo)}</div>
            <div class="text-xs text-parchment-500 font-mono mt-0.5">/blog/${u(t.slug)}</div>
            ${t.extracto?`<p class="text-xs text-parchment-300 mt-1.5 font-serif italic line-clamp-2">${u(t.extracto)}</p>`:""}
          </div>
          ${e?`<button type="button" class="post-card-quitar" data-quitar="${t.id}">Quitar</button>`:""}
        </div>`).join(""),g.querySelectorAll("[data-quitar]").forEach(t=>{t.addEventListener("click",()=>{const a=t.dataset.quitar;n.postsActuales=n.postsActuales.filter(o=>o.id!==a),n.sucio=!0,w()})}),e&&ge()}function ge(){let e=null;g.querySelectorAll(".post-card").forEach(a=>{a.addEventListener("dragstart",o=>{e=Number(a.dataset.index),a.classList.add("is-dragging"),o.dataTransfer?.setData("text/plain",String(e))}),a.addEventListener("dragend",()=>{e=null,a.classList.remove("is-dragging"),g.querySelectorAll(".is-drop-target").forEach(o=>o.classList.remove("is-drop-target"))}),a.addEventListener("dragover",o=>{o.preventDefault(),a.classList.add("is-drop-target")}),a.addEventListener("dragleave",()=>{a.classList.remove("is-drop-target")}),a.addEventListener("drop",o=>{o.preventDefault(),a.classList.remove("is-drop-target");const i=Number(a.dataset.index);if(e===null||e===i)return;const[s]=n.postsActuales.splice(e,1);n.postsActuales.splice(i,0,s),n.sucio=!0,w()})})}function ve(){n.seleccionPendiente=new Set(n.postsActuales.map(e=>e.id)),n.busquedaPosts="",A.value="",x.classList.remove("hidden"),x.classList.add("flex"),xe()}function $(){x.classList.add("hidden"),x.classList.remove("flex")}async function xe(){E.innerHTML=`
        <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">Cargando…</div>`,n.postsDisponibles=await j(200),N()}function N(){const e=n.busquedaPosts.trim().toLowerCase(),t=e?n.postsDisponibles.filter(a=>(a.titulo+" "+a.slug+" "+(a.extracto??"")).toLowerCase().includes(e)):n.postsDisponibles;if(t.length===0){E.innerHTML=`
          <div class="py-12 text-center text-parchment-400 text-sm font-serif italic">
            No hay artículos publicados ${e?"para esa búsqueda":""}.
          </div>`,I();return}E.innerHTML=t.map(a=>{const o=n.seleccionPendiente.has(a.id);return`
          <label class="post-pickable ${o?"is-checked":""}" data-id="${a.id}">
            <input type="checkbox" ${o?"checked":""} data-id="${a.id}" />
            <div class="flex-1 min-w-0">
              <div class="font-display text-parchment-50 text-sm">${u(a.titulo)}</div>
              <div class="text-[11px] text-parchment-500 font-mono mt-0.5">/blog/${u(a.slug)}</div>
              ${a.extracto?`<p class="text-xs text-parchment-300 mt-1 font-serif italic line-clamp-2">${u(a.extracto)}</p>`:""}
              ${a.publicado_en?`<p class="text-[10px] text-parchment-500 mt-1 uppercase tracking-widest">${u(y(a.publicado_en))}</p>`:""}
            </div>
          </label>`}).join(""),E.querySelectorAll('input[type="checkbox"]').forEach(a=>{a.addEventListener("change",()=>{const o=a.dataset.id;a.checked?n.seleccionPendiente.add(o):n.seleccionPendiente.delete(o),a.closest(".post-pickable")?.classList.toggle("is-checked",a.checked),I()})}),I()}function I(){const e=n.seleccionPendiente.size;le.textContent=`${e} ${e===1?"seleccionado":"seleccionados"}`}function ye(){const e=n.postsActuales.map(s=>s.id),t=Array.from(n.seleccionPendiente).filter(s=>!e.includes(s)),a=n.postsActuales.filter(s=>n.seleccionPendiente.has(s.id)),o=new Map(n.postsDisponibles.map(s=>[s.id,s])),i=t.map(s=>o.get(s)).filter(s=>!!s).map(s=>({id:s.id,titulo:s.titulo,slug:s.slug,extracto:s.extracto,publicado_en:s.publicado_en}));n.postsActuales=[...a,...i],n.sucio=!0,w(),$()}async function he(){d("Cargando campaña…");try{const e=await f(M);if(!e){r("La campaña no existe o ya fue eliminada.","error");return}n.campana=e,n.bufferIntroJson=e.intro_json??null,n.bufferIntroHtml=e.intro_html??null,n.postsActuales=e.posts.map(t=>({id:t.post_id,titulo:t.titulo??"(sin título)",slug:t.slug??"",extracto:t.extracto??null,publicado_en:t.publicado_en??null})),v.value=e.asunto??"",P&&P.dispatchEvent(new CustomEvent("editor:setContent",{detail:{json:n.bufferIntroJson,html:n.bufferIntroHtml}})),b(e),w(),q.get("nueva")==="1"&&(v.focus(),v.select()),["lista","enviando"].includes(e.estado)&&setInterval(Ee,2e4)}finally{l()}}async function Ee(){if(!n.campana)return;const e=await f(n.campana.id);e&&(n.campana=e,b(e))}P?.addEventListener("editor:change",e=>{const t=e.detail;n.bufferIntroJson=t?.json??null,n.bufferIntroHtml=t?.html??null,n.sucio=!0});v.addEventListener("input",()=>{n.sucio=!0});async function k(){if(!n.campana)return!1;const e=await U({id:n.campana.id,asunto:v.value.trim()||"(sin asunto)",intro_json:n.bufferIntroJson,intro_html:n.bufferIntroHtml});if(!e.ok)return r(`No se pudo guardar: ${e.error}`,"error"),!1;const t=await Q(n.campana.id,n.postsActuales.map(a=>a.id));return t.ok?(n.sucio=!1,!0):(r(`No se pudieron guardar los artículos: ${t.error}`,"error"),!1)}async function we(){p(),d("Guardando…");try{if(!await k())return;r("Borrador guardado.","ok");const t=await f(n.campana.id);t&&(n.campana=t,b(t))}finally{l()}}async function $e(){if(!n.campana)return;p(),d("Calculando destinatarios…");let e=0;try{e=await z()}finally{l()}const t=W,a=e>0?Math.max(1,Math.ceil(e/t)):0,o=e===0?"No hay suscriptores activos en este momento (nadie con newsletter_optin = true). La campaña quedará encolada pero no va a salir hasta que haya suscriptores.":`Vas a encolar la campaña a <strong>${e}</strong> suscriptores activos.

Con la cuota actual del plan Free de Resend (${t} mails/día), la campaña se irá enviando a lo largo de aproximadamente <strong>${a} día${a===1?"":"s"}</strong>, en horario humano (09 a 21 hs Argentina). Cada destinatario recibe el mail una sola vez.

Podés <strong>pausar</strong> o <strong>cancelar</strong> en cualquier momento desde esta misma pantalla.`;if(await L({titulo:"¿Encolar y enviar?",cuerpo:o,cuerpoComoHtml:!0,confirmar:"Encolar",cancelar:"Mejor no"})){d("Guardando cambios…");try{if(n.sucio&&!await k())return}finally{l()}d("Encolando campaña…");try{const s=await O(n.campana.id);if(!s.ok){r(`No se pudo encolar: ${s.error}`,"error");return}r("Campaña encolada. Los envíos comenzarán en la próxima corrida del worker.","ok");const c=await f(n.campana.id);c&&(n.campana=c,b(c))}finally{l()}}}async function ke(){if(n.campana){p(),d("Pausando…");try{const e=await G(n.campana.id);if(!e.ok){r(`No se pudo pausar: ${e.error}`,"error");return}const t=await f(n.campana.id);t&&(n.campana=t,b(t))}finally{l()}}}async function Le(){if(!(!n.campana||(p(),!await L({titulo:"¿Procesar un lote ahora?",cuerpo:"Vamos a mandar un lote (hasta 12 mails) sin esperar al cron horario. Sirve para arrancar la campaña apenas la encolaste.",confirmar:"Sí, procesar",cancelar:"Mejor no",peligroso:!1})))){d("Procesando lote…");try{const t=await F();if(!t.ok){r(`No se pudo procesar: ${t.error??"error desconocido"}`,"error");return}t.skipped==="cuota_diaria_agotada"?r(`Cuota diaria agotada (${t.enviados_hoy}/${t.cuota_diaria}). Se reanuda mañana.`,"info"):t.skipped==="sin_pendientes"?r("No quedan envíos pendientes en la cola.","info"):r(`Lote procesado: ${t.enviados??0} enviados, ${t.fallidos??0} fallidos, ${t.rebotes??0} rebotes. Total hoy: ${t.enviados_hoy}/${t.cuota_diaria}.`,"ok");const a=await f(n.campana.id);a&&(n.campana=a,b(a))}finally{l()}}}async function Ce(){if(!(!n.campana||(p(),!await L({titulo:"¿Cancelar la campaña?",cuerpo:"Los envíos pendientes no se mandarán. Esta acción es definitiva. Los envíos ya enviados quedan como histórico.",confirmar:"Sí, cancelar",cancelar:"Mejor no",peligroso:!0})))){d("Cancelando…");try{const t=await J(n.campana.id);if(!t.ok){r(`No se pudo cancelar: ${t.error}`,"error");return}const a=await f(n.campana.id);a&&(n.campana=a,b(a))}finally{l()}}}async function Ie(){if(!(!n.campana||(p(),!await L({titulo:"¿Eliminar definitivamente?",cuerpo:"Se borra la campaña y todo su histórico de envíos. No se puede recuperar.",confirmar:"Eliminar",cancelar:"No",peligroso:!0})))){d("Eliminando…");try{const t=await V(n.campana.id);if(!t.ok){r(`No se pudo eliminar: ${t.error}`,"error");return}window.location.replace("/area-reservada/newsletter")}finally{l()}}}function L(e){return new Promise(t=>{const a=document.createElement("div");a.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4";const o=e.cuerpoComoHtml?e.cuerpo.replace(/\n/g,"<br>"):u(e.cuerpo).replace(/\n/g,"<br>");a.innerHTML=`
          <div class="card-altar p-6 max-w-md w-full space-y-4">
            <p class="font-display text-lg text-parchment-50">${u(e.titulo)}</p>
            <p class="text-sm text-parchment-300 font-serif leading-relaxed">${o}</p>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button type="button" data-act="cancel"
                      class="btn-ghost text-xs">${u(e.cancelar)}</button>
              <button type="button" data-act="ok"
                      class="${e.peligroso?"text-[11px] uppercase tracking-widest bg-wine-500 hover:bg-wine-400 text-parchment-50 px-4 py-2 rounded-sm transition":"btn-gold text-xs"}">
                ${u(e.confirmar)}
              </button>
            </div>
          </div>`,document.body.appendChild(a);const i=s=>{a.remove(),t(s)};a.querySelector('[data-act="ok"]')?.addEventListener("click",()=>i(!0)),a.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>i(!1)),a.addEventListener("click",s=>{s.target===a&&i(!1)})})}h.addEventListener("click",ve);ie.addEventListener("click",$);ce.addEventListener("click",$);de.addEventListener("click",ye);x.addEventListener("click",e=>{e.target===x&&$()});A.addEventListener("input",()=>{n.busquedaPosts=A.value,N()});ue.addEventListener("click",async()=>{if(!n.campana)return;p();const e=window.open("about:blank","_blank");if(n.sucio){d("Guardando cambios para la vista previa…");try{if(!await k()){e?.close();return}}finally{l()}}const t=`/area-reservada/newsletter/preview?id=${n.campana.id}`;e?e.location.href=t:window.location.href=t});pe.addEventListener("click",async()=>{if(!n.campana)return;p();const e=await Pe();if(e){if(n.sucio){d("Guardando cambios…");try{if(!await k())return}finally{l()}}d(`Enviando prueba a ${e}…`);try{const t=await K(n.campana.id,e);if(!t.ok){r(`No se pudo enviar la prueba: ${t.error}${t.detalle?" — "+JSON.stringify(t.detalle):""}`,"error");return}const a=t.contacto_existente?"El link de baja del email es funcional: si lo tocás, ese contacto se desuscribe en serio.":"El email destino no es un contacto, así que el link de baja muestra una página informativa.";r(`Prueba enviada a ${t.enviado_a}. Revisá la bandeja (puede tardar 1-2 minutos). ${a}`,"ok")}finally{l()}}});function Pe(){const e="tradicionmisticayhermetica@gmail.com";return new Promise(t=>{const a=document.createElement("div");a.className="fixed inset-0 z-[1250] flex items-center justify-center bg-night-950/80 backdrop-blur-sm p-4",a.innerHTML=`
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
          </div>`,document.body.appendChild(a);const o=a.querySelector("#email-prueba-input");o.focus(),o.select();const i=c=>{a.remove(),t(c)},s=()=>{const c=o.value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)){o.classList.add("border-wine-400/60"),o.focus();return}i(c)};a.querySelector('[data-act="ok"]')?.addEventListener("click",s),a.querySelector('[data-act="cancel"]')?.addEventListener("click",()=>i(null)),a.addEventListener("click",c=>{c.target===a&&i(null)}),o.addEventListener("keydown",c=>{c.key==="Enter"&&s(),c.key==="Escape"&&i(null)})})}window.addEventListener("beforeunload",e=>{n.sucio&&(e.preventDefault(),e.returnValue="")});he();

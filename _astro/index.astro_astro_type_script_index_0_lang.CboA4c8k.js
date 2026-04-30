import{q as o}from"./admin.DlNR_hA_.js";import"./supabase.2Xnj7Pbd.js";const r=document.getElementById("lista-posts"),s=document.getElementById("sin-posts");function a(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function n(t){try{return new Date(t).toLocaleDateString("es-AR",{timeZone:"America/Argentina/Buenos_Aires",day:"numeric",month:"long",year:"numeric"})}catch{return t}}(async()=>{const t=await o(50);if(r){if(t.length===0){r.innerHTML="",s?.classList.remove("hidden");return}r.innerHTML=t.map(e=>`
        <a href="/blog/post?slug=${a(e.slug)}"
           class="card-altar group block p-8 md:p-10 relative overflow-hidden">
          <div class="flex items-center gap-3 mb-4 text-xs tracking-[0.2em] uppercase">
            ${e.etiquetas?.length?`<span class="text-[color:var(--color-gold-400)]">${a(e.etiquetas[0])}</span><span class="text-parchment-500">·</span>`:""}
            <time class="text-parchment-400">
              ${a(n(e.publicado_en??e.creado_en))}
            </time>
          </div>
          <h2 class="text-2xl md:text-3xl font-display mb-4 text-parchment-50 group-hover:text-[color:var(--color-gold-300)] transition-colors">
            ${a(e.titulo)}
          </h2>
          ${e.extracto?`<p class="text-base font-serif text-parchment-200 leading-relaxed mb-6 max-w-2xl">${a(e.extracto)}</p>`:""}
          <span class="text-xs tracking-[0.2em] uppercase text-[color:var(--color-gold-400)] group-hover:text-[color:var(--color-gold-300)]">
            Leer reflexión →
          </span>
        </a>`).join("")}})();

import{w as m}from"./admin.z3XL9Bjq.js";import"./supabase.BC3Mu_5F.js";const a=document.getElementById("lista-posts"),p=document.getElementById("sin-posts"),l=document.getElementById("sin-resultados"),g=document.getElementById("blog-buscar-wrapper"),i=document.getElementById("blog-buscar"),h=document.getElementById("lista-posts-scroll");function s(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function x(t){try{return new Date(t).toLocaleDateString("es-AR",{timeZone:"America/Argentina/Buenos_Aires",day:"numeric",month:"long",year:"numeric"})}catch{return t}}function d(t){return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function f(t){const e=t.etiquetas?.[0]??"",r=x(t.publicado_en??t.creado_en),o=d([t.titulo,t.extracto??"",(t.etiquetas??[]).join(" ")].join(" "));return`
        <a
          href="/blog/post?slug=${s(t.slug)}"
          class="post-item card-altar group block p-8 md:p-10 relative overflow-hidden"
          data-haystack="${s(o)}"
        >
          <div class="flex items-center gap-3 mb-4 text-xs tracking-[0.2em] uppercase">
            ${e?`<span class="text-[color:var(--color-gold-400)]">${s(e)}</span><span class="text-parchment-500">·</span>`:""}
            <time class="text-parchment-400">${s(r)}</time>
          </div>
          <h2 class="text-2xl md:text-3xl font-display mb-4 text-parchment-50 group-hover:text-[color:var(--color-gold-300)] transition-colors">
            ${s(t.titulo)}
          </h2>
          ${t.extracto?`<p class="text-base font-serif text-parchment-200 leading-relaxed mb-6 max-w-2xl">${s(t.extracto)}</p>`:""}
          <span class="text-xs tracking-[0.2em] uppercase text-[color:var(--color-gold-400)] group-hover:text-[color:var(--color-gold-300)]">
            Leer reflexión →
          </span>
        </a>`}function b(t){if(!a||!l)return;const e=d(t.trim()),r=a.querySelectorAll(".post-item");let o=0;r.forEach(n=>{const u=n.dataset.haystack??"",c=e.length===0||u.includes(e);n.classList.toggle("hidden",!c),c&&o++}),l.classList.toggle("hidden",o>0||e.length===0)}(async()=>{const t=await m(50);if(a){if(t.length===0){a.innerHTML="",h?.classList.add("hidden"),p?.classList.remove("hidden");return}a.innerHTML=t.map(f).join(""),t.length>=3&&g?.classList.remove("hidden"),i?.addEventListener("input",()=>b(i.value))}})();

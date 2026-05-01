import{o as h}from"./newsletter-cms.BgcwjR6v.js";import"./supabase.2Xnj7Pbd.js";function o(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function b(e){if(!e)return"";try{return new Date(e).toLocaleDateString("es-AR",{timeZone:"America/Argentina/Buenos_Aires",day:"numeric",month:"long",year:"numeric"})}catch{return""}}function v(e){if(!e)return"";let t=e;return t=t.replace(/<h2(\s[^>]*)?>/gi,'<h2 style="font-family:Georgia,serif;font-size:22px;color:#f5ecd7;margin:32px 0 12px 0;line-height:1.3;font-weight:500;letter-spacing:0.5px;">'),t=t.replace(/<h3(\s[^>]*)?>/gi,'<h3 style="font-family:Georgia,serif;font-size:18px;color:#e6c464;margin:24px 0 10px 0;font-weight:500;">'),t=t.replace(/<p(\s[^>]*)?>/gi,'<p style="font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#ede2c4;margin:0 0 18px 0;">'),t=t.replace(/<blockquote(\s[^>]*)?>/gi,'<blockquote style="border-left:2px solid #d4af37;padding:8px 0 8px 20px;margin:20px 0;font-style:italic;color:#b8a984;">'),t=t.replace(/<ul(\s[^>]*)?>/gi,'<ul style="margin:0 0 18px 0;padding-left:24px;color:#ede2c4;font-family:Georgia,serif;font-size:17px;line-height:1.7;">'),t=t.replace(/<ol(\s[^>]*)?>/gi,'<ol style="margin:0 0 18px 0;padding-left:24px;color:#ede2c4;font-family:Georgia,serif;font-size:17px;line-height:1.7;">'),t=t.replace(/<li(\s[^>]*)?>/gi,'<li style="margin:0 0 6px 0;">'),t=t.replace(/<img(\s[^>]*)>/gi,'<img$1 style="max-width:100%;height:auto;border-radius:2px;display:block;margin:18px auto;border:0;">'),t=t.replace(/<a(\s[^>]*?)>/gi,'<a$1 style="color:#e6c464;text-decoration:underline;text-underline-offset:2px;">'),t=t.replace(/<strong(\s[^>]*)?>/gi,'<strong style="color:#f5ecd7;font-weight:600;">'),t=t.replace(/<hr\s*\/?>/gi,'<div style="text-align:center;margin:32px 0;color:#d4af37;opacity:0.6;font-size:18px;">☉</div>'),t}function w(e,t){const a=`${t.replace(/\/$/,"")}/blog/post?slug=${encodeURIComponent(e.slug)}`,i=o(e.titulo),n=e.extracto?o(e.extracto):"",l=b(e.publicado_en);return`
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin:0 0 36px 0;">
      <tr>
        <td>
          ${e.imagen_destacada?`<a href="${a}" style="text-decoration:none;display:block;">
        <img src="${o(e.imagen_destacada)}" alt="${i}" width="540"
             style="width:100%;max-width:540px;height:auto;display:block;border:0;border-radius:2px;margin-bottom:16px;" />
      </a>`:""}
          ${l?`<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b7e5d;margin-bottom:8px;">${o(l)}</div>`:""}
          <h2 style="font-family:Georgia,serif;font-size:24px;color:#f5ecd7;margin:0 0 12px 0;line-height:1.25;font-weight:500;">
            <a href="${a}" style="color:#f5ecd7;text-decoration:none;">${i}</a>
          </h2>
          ${n?`<p style="font-family:Georgia,serif;font-size:16px;font-style:italic;line-height:1.6;color:#b8a984;margin:0 0 16px 0;">${n}</p>`:""}
          <a href="${a}"
             style="display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e6c464;text-decoration:none;border:1px solid rgba(212,175,55,0.4);padding:8px 18px;border-radius:2px;">
            Leer reflexión →
          </a>
        </td>
      </tr>
    </table>
  `}function $(e,t){return`${e.replace(/\/$/,"")}/newsletter/preferencias`}function z(e){const t=o(e.asunto||"Tradición Mística y Hermética"),a=e.introHtml?v(e.introHtml):"",i=e.posts.map(y=>w(y,e.baseSitio)).join(`
`),n=a.trim().length>0,l=e.posts.length>0,d=$(e.baseSitio),p=e.baseSitio.replace(/\/$/,""),f="",u=e.imagenDestacada?`<tr>
        <td>
          <img src="${o(e.imagenDestacada)}" alt="" width="600"
               style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td>
      </tr>`:"";return`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t}</title>
</head>
<body style="margin:0;padding:0;background:#07060d;font-family:Georgia,serif;color:#ede2c4;-webkit-font-smoothing:antialiased;">

<div style="background:#3a2a14;color:#f5ecd7;padding:8px 16px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid rgba(212,175,55,0.3);">
        Vista previa · Este es solo un render local · No se envió a nadie
      </div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:#07060d;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
             style="width:600px;max-width:600px;background:#0b0a12;border:1px solid rgba(230,196,100,0.14);">

        ${u}

        <!-- Cabecera -->
        <tr>
          <td style="padding:32px 32px 12px 32px;text-align:center;border-bottom:1px solid rgba(230,196,100,0.12);">
            <div style="font-size:24px;color:#d4af37;line-height:1;margin-bottom:10px;">☉</div>
            <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:5px;color:#f5ecd7;text-transform:uppercase;font-weight:500;">
              Tradición Mística y Hermética
            </div>
          </td>
        </tr>

        <!-- Asunto como titular -->
        <tr>
          <td style="padding:36px 32px 8px 32px;">
            <h1 style="font-family:Georgia,serif;font-size:28px;color:#f5ecd7;margin:0 0 8px 0;line-height:1.25;font-weight:500;letter-spacing:0.3px;">
              ${t}
            </h1>
          </td>
        </tr>

        ${n?`<!-- Introducción rica (Tiptap) -->
        <tr>
          <td style="padding:8px 32px 20px 32px;">
            ${f}
            ${a}
          </td>
        </tr>`:""}

        ${l&&n?`<tr>
                <td style="padding:0 32px;">
                  <div style="text-align:center;color:#d4af37;opacity:0.6;font-size:18px;margin:8px 0 24px 0;">☉</div>
                </td>
              </tr>`:""}

        ${l?`<!-- Posts seleccionados -->
        <tr>
          <td style="padding:8px 32px 16px 32px;">
            ${i}
          </td>
        </tr>`:""}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px 32px 32px;border-top:1px solid rgba(230,196,100,0.12);text-align:center;">
            <div style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:#b8a984;margin-bottom:14px;">
              Recibís este boletín porque te suscribiste en
              <a href="${p}" style="color:#e6c464;text-decoration:none;">tradicionmisticayhermetica.com</a>.
            </div>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#8b7e5d;text-transform:uppercase;">
              <a href="${d}" style="color:#8b7e5d;text-decoration:underline;">Darme de baja del newsletter</a>
              &nbsp;·&nbsp;
              <a href="${p}" style="color:#8b7e5d;text-decoration:underline;">Ir al sitio</a>
            </div>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1px;color:#5a5142;margin-top:18px;">
              © Tradición Mística y Hermética
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`}const H=new URLSearchParams(window.location.search),g=H.get("id");g||window.location.replace("/area-reservada/newsletter");const k=document.getElementById("titulo-preview"),r=document.getElementById("iframe-preview");document.getElementById("iframe-wrap");const s=document.getElementById("estado"),c=document.getElementById("modo-preview"),E=document.getElementById("btn-actualizar"),I=document.getElementById("link-volver");function A(){return window.location.origin}function m(e){e==="mobile"?r.style.maxWidth="360px":r.style.maxWidth="100%"}async function x(){s.textContent="Cargando campaña…";const e=await h(g);if(!e){s.textContent="La campaña no existe.";return}k.textContent=e.asunto||"(sin asunto)",I.href=`/area-reservada/newsletter/editar?id=${e.id}`;const t=e.posts.map(i=>({titulo:i.titulo??"(sin título)",slug:i.slug??"",extracto:i.extracto??null,imagen_destacada:i.imagen_destacada??null,publicado_en:i.publicado_en??null})),a=z({asunto:e.asunto,introHtml:e.intro_html,imagenDestacada:e.imagen_destacada,posts:t,baseSitio:A()});r.srcdoc=a,r.addEventListener("load",()=>{try{const i=r.contentDocument;if(i){const n=i.documentElement.scrollHeight;r.style.height=`${Math.max(600,n+40)}px`}}catch{}},{once:!0}),s.textContent=`Última actualización: ${new Date().toLocaleTimeString("es-AR")}`}c.addEventListener("change",()=>m(c.value));E.addEventListener("click",()=>x());m(c.value);x();

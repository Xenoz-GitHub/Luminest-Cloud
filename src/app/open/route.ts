// Framework-free launch page.
//
// The installed app's start_url must render on the oldest browser we support
// (Android 8 era Chrome/WebView). A React page that fails to hydrate shows a
// blank screen; this renders from plain HTML + ES5, so it can never be blank.
//
// It also NEVER redirects server-side. A redirect on a WebAPK launch URL makes
// Android finish the activity, which looks like the app crashing on open.

export const dynamic = "force-static";

const HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#B9A5EA">
<title>LumiNest</title>
<style>
html,body{margin:0;padding:0;min-height:100%;background:#FFFCFF;color:#504465;
font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{min-height:100vh;display:-webkit-box;display:-webkit-flex;display:flex;
-webkit-align-items:center;align-items:center;-webkit-justify-content:center;
justify-content:center;padding:24px;text-align:center;box-sizing:border-box}
.card{max-width:360px;width:100%}
.dot{width:46px;height:46px;margin:0 auto 14px;border-radius:14px;
background:#D9CCF5;color:#3D3153;font-weight:800;line-height:46px;font-size:19px}
h1{font-size:20px;margin:0 0 6px}
p{font-size:14px;line-height:1.5;color:#9388A5;margin:0}
.help{display:none;margin-top:18px}
.help.on{display:block}
.help a{display:block;box-sizing:border-box;margin-top:8px;padding:13px 14px;
border-radius:999px;border:2px solid #E9E0F5;background:#fff;color:#504465;
font-size:14px;font-weight:700;text-decoration:none}
.help a.primary{background:#B9A5EA;border-color:#8B72C9;color:#3D3153}
</style></head><body>
<div class="wrap"><div class="card">
<div class="dot">L</div>
<h1 id="t">Opening LumiNest...</h1>
<p id="s">One moment while your nest loads.</p>
<div class="help" id="h">
<a class="primary" href="/home">Continue to LumiNest</a>
<a href="/compat">Troubleshoot</a>
<a href="/reset">Repair the app</a>
</div>
<noscript><div class="help on" style="display:block">
<p style="margin-bottom:10px">JavaScript is off, so the app cannot start.</p>
<a class="primary" href="/home">Continue anyway</a>
</div></noscript>
</div></div>
<script>
(function(){
var moved=false;
function go(){if(moved)return;moved=true;window.location.replace("/home");}
setTimeout(go,60);
setTimeout(function(){
var t=document.getElementById("t"),s=document.getElementById("s"),h=document.getElementById("h");
if(t)t.innerHTML="LumiNest could not open";
if(s)s.innerHTML="Your browser may need an update. Try one of these:";
if(h)h.className="help on";
},6000);
})();
</script></body></html>`;

export async function GET() {
  return new Response(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

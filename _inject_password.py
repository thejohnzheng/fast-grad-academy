import glob, re

PASSWORD = "fga2026"

GATE_SCRIPT = f'''<script>
(function(){{
  var P="{PASSWORD}";
  if(document.cookie.indexOf("fga_auth=granted")===-1){{
    document.documentElement.innerHTML='';
    document.body.style.cssText="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#e8e0d4;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
    var d=document.createElement("div");
    d.style.textAlign="center";
    d.innerHTML='<h1 style="font-size:1.8rem;font-weight:300;letter-spacing:.05em;margin-bottom:.5rem">Fast Grad <em style=\\"color:#c4a97d\\">Academy</em></h1><p style="color:#888;margin-bottom:2rem;font-size:.95rem">This site is not yet public. Enter the password to continue.</p><div style="display:flex;gap:.5rem;justify-content:center"><input type=password id=_pw placeholder=Password style="padding:.75rem 1rem;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#e8e0d4;font-size:1rem;outline:none;width:200px" autofocus /><button onclick=_ck() style="padding:.75rem 1.5rem;background:#c4a97d;color:#0a0a0a;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:.95rem">Enter</button></div><p id=_er style="color:#e74c3c;margin-top:1rem;font-size:.85rem;display:none">Incorrect password.</p>';
    document.body.appendChild(d);
    document.getElementById("_pw").addEventListener("keydown",function(e){{if(e.key==="Enter")_ck()}});
    window._ck=function(){{var v=document.getElementById("_pw").value;if(v===P){{document.cookie="fga_auth=granted;path=/;max-age=86400;SameSite=Lax";location.reload()}}else{{document.getElementById("_er").style.display="block";document.getElementById("_pw").value="";document.getElementById("_pw").focus()}}}};
  }}
}})();
</script>'''

files = glob.glob("*.html")
count = 0
for f in files:
    if f == "guide_original.html":
        continue
    with open(f, "r") as fh:
        content = fh.read()
    if "fga_auth" in content:
        print(f"SKIP (already has gate): {f}")
        continue
    # Inject right after <head> or at the very start
    if "<head>" in content:
        content = content.replace("<head>", "<head>" + GATE_SCRIPT, 1)
    elif "<HEAD>" in content:
        content = content.replace("<HEAD>", "<HEAD>" + GATE_SCRIPT, 1)
    else:
        content = GATE_SCRIPT + content
    with open(f, "w") as fh:
        fh.write(content)
    count += 1
    print(f"INJECTED: {f}")

print(f"\nDone: {count} files updated")

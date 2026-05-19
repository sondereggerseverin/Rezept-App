import { useState, useEffect } from "react";

const GROQ_KEY = process.env.REACT_APP_GROQ_KEY;

const S = {
  page: { minHeight: "100vh", background: "#0f0e0c", color: "#f5f0e8", fontFamily: "Georgia, serif", paddingBottom: "2rem" },
  header: { background: "linear-gradient(135deg, #1a1208, #2d1f0a)", borderBottom: "1px solid #3d2f15", padding: "1.2rem 1rem", textAlign: "center" },
  h1: { fontSize: "1.7rem", fontWeight: "normal", color: "#e8c97a", margin: 0 },
  sub: { color: "#6a5a3a", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.2rem" },
  body: { maxWidth: "600px", margin: "0 auto", padding: "1.2rem 1rem" },
  toggle: { display: "flex", gap: "4px", background: "#1a1208", borderRadius: "10px", padding: "4px", marginBottom: "1rem" },
  tab: (a) => ({ flex: 1, padding: "0.65rem", border: "none", borderRadius: "7px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "0.9rem", transition: "all 0.2s", background: a ? "#e8c97a" : "transparent", color: a ? "#0f0e0c" : "#6a5a3a", fontWeight: a ? "bold" : "normal" }),
  card: { background: "#1a1208", borderRadius: "12px", padding: "1.2rem", marginBottom: "0.8rem", border: "1px solid #2d2010" },
  input: { width: "100%", padding: "0.85rem", background: "#0f0e0c", border: "1px solid #3d2f15", borderRadius: "8px", color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "0.95rem", outline: "none", WebkitAppearance: "none" },
  textarea: { width: "100%", padding: "0.85rem", background: "#0f0e0c", border: "1px solid #3d2f15", borderRadius: "8px", color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "0.95rem", outline: "none", resize: "vertical", WebkitAppearance: "none" },
  btn: (off) => ({ width: "100%", padding: "1rem", background: off ? "#2d1f0a" : "#e8c97a", color: off ? "#6a5a3a" : "#0f0e0c", border: "none", borderRadius: "10px", fontSize: "1rem", fontFamily: "Georgia, serif", fontWeight: "bold", cursor: off ? "not-allowed" : "pointer", transition: "all 0.2s" }),
  note: (color) => ({ marginTop: "0.7rem", padding: "0.6rem 0.8rem", background: "#2d1f0a", borderRadius: "8px", fontSize: "0.8rem", color: color || "#8a7a5a" }),
  err: { padding: "1rem", background: "#2d0a0a", borderRadius: "10px", color: "#e87a7a", fontSize: "0.85rem", marginTop: "0.8rem", border: "1px solid #5d1a1a" },
  sTitle: { margin: "0 0 0.8rem", color: "#e8c97a", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "normal" },
  badge: { background: "#0f0e0c", borderRadius: "8px", padding: "0.4rem 0.7rem", textAlign: "center" },
  bLabel: { fontSize: "0.6rem", color: "#6a5a3a", textTransform: "uppercase", letterSpacing: "0.05em" },
  bVal: { color: "#e8c97a", fontSize: "0.82rem", marginTop: "1px" },
  divider: (last) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: last ? "none" : "1px solid #1f1810" }),
  stepRow: { display: "flex", gap: "0.8rem", marginBottom: "0.9rem" },
  stepNum: { width: "24px", height: "24px", minWidth: "24px", background: "#e8c97a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f0e0c", fontWeight: "bold", fontSize: "0.75rem" },
};

export default function App() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("url");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");
  const [servings, setServings] = useState(4);
  const [baseServings, setBaseServings] = useState(4);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("url") || params.get("text");
    if (sharedUrl) {
      setUrl(sharedUrl);
      setMode("url");
      setShared(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const platform = url.includes("instagram") ? "instagram"
    : url.includes("tiktok") ? "tiktok"
    : url.includes("youtube") ? "youtube" : "other";

  const buildPrompt = () => mode === "url"
    ? `URL: ${url}\n\nErstelle ein vollständiges Rezept basierend auf dieser URL.`
    : `Rezepttext:\n${text}`;

  const parseRecipe = async () => {
    setLoading(true);
    setError("");
    setRecipe(null);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 1500,
          messages: [
            { role: "system", content: "Du bist ein Rezept-Experte. Antworte NUR mit einem JSON-Objekt, kein Markdown, keine Backticks, kein Text davor oder danach." },
            { role: "user", content: `${buildPrompt()}\n\nErstelle dieses JSON:\n{\n  "name": "Rezeptname",\n  "beschreibung": "Kurze Beschreibung",\n  "portionen": 4,\n  "zeit": { "vorbereitung": "10 Min", "kochen": "20 Min", "gesamt": "30 Min" },\n  "schwierigkeit": "Einfach",\n  "zutaten": [{ "menge": "200", "einheit": "g", "name": "Zutatname" }],\n  "schritte": ["Schritt 1...", "Schritt 2..."],\n  "tipps": ["Tipp 1"],\n  "naehrwerte": { "kalorien": "400 kcal", "protein": "20g", "kohlenhydrate": "35g", "fett": "12g" }\n}` },
          ],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.choices[0].message.content.trim().replace(/```json|```/g, "");
      const parsed = JSON.parse(raw);
      setRecipe(parsed);
      setBaseServings(parsed.portionen || 4);
      setServings(parsed.portionen || 4);
    } catch (e) {
      setError("Fehler: " + (e.message || "Bitte Text manuell einfügen."));
    }
    setLoading(false);
  };

  const scale = (menge) => {
    const n = parseFloat(menge);
    if (isNaN(n)) return menge;
    const s = (n * servings) / baseServings;
    return s % 1 === 0 ? s.toString() : s.toFixed(1);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ fontSize: "2.2rem" }}>👨‍🍳</div>
        <h1 style={S.h1}>Rezept Extraktor</h1>
        <p style={S.sub}>Link oder Text → vollständiges Rezept</p>
      </div>
      <div style={S.body}>
        {shared && <div style={{ ...S.note("#e8c97a"), marginBottom: "0.8rem" }}>✅ Link empfangen!</div>}
        <div style={S.toggle}>
          {[["url", "🔗 Link"], ["text", "📝 Text"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={S.tab(mode === m)}>{l}</button>
          ))}
        </div>
        <div style={S.card}>
          {mode === "url" ? (
            <>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." style={S.input} inputMode="url" autoCorrect="off" autoCapitalize="none" />
              {url && (platform === "instagram" || platform === "tiktok") && (
                <div style={S.note()}>⚠️ {platform === "instagram" ? "Instagram" : "TikTok"} sperrt externen Zugriff – bitte Text in 📝 einfügen.</div>
              )}
              {url && platform === "youtube" && <div style={S.note("#7ae8a0")}>✅ YouTube-Links funktionieren direkt!</div>}
            </>
          ) : (
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Rezepttext hier einfügen..." rows={6} style={S.textarea} />
          )}
        </div>
        <button onClick={parseRecipe} disabled={loading || (mode === "url" ? !url : !text)} style={S.btn(loading || (mode === "url" ? !url : !text))}>
          {loading ? "⏳ Rezept wird erstellt..." : "🍽️ Rezept erstellen"}
        </button>
        {error && <div style={S.err}>⚠️ {error}</div>}
        {recipe && (
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ ...S.card, background: "linear-gradient(135deg, #2d1f0a, #1a1208)" }}>
              <h2 style={{ color: "#e8c97a", fontSize: "1.4rem", fontWeight: "normal", margin: "0 0 0.4rem" }}>{recipe.name}</h2>
              <p style={{ color: "#8a7a5a", fontStyle: "italic", margin: "0 0 1rem", fontSize: "0.9rem" }}>{recipe.beschreibung}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[["Gesamt", recipe.zeit?.gesamt], ["Vorbereitung", recipe.zeit?.vorbereitung], ["Kochen", recipe.zeit?.kochen], ["Level", recipe.schwierigkeit]].map(([label, val]) => val && (
                  <div key={label} style={S.badge}><div style={S.bLabel}>{label}</div><div style={S.bVal}>{val}</div></div>
                ))}
              </div>
            </div>
            <div style={{ ...S.card, display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "#8a7a5a", fontSize: "0.9rem" }}>👥 Portionen:</span>
              <button onClick={() => setServings(Math.max(1, servings - 1))} style={{ width: "32px", height: "32px", background: "#2d1f0a", border: "1px solid #3d2f15", borderRadius: "50%", color: "#e8c97a", fontSize: "1.2rem", cursor: "pointer" }}>−</button>
              <span style={{ color: "#e8c97a", fontSize: "1.3rem", minWidth: "28px", textAlign: "center" }}>{servings}</span>
              <button onClick={() => setServings(servings + 1)} style={{ width: "32px", height: "32px", background: "#2d1f0a", border: "1px solid #3d2f15", borderRadius: "50%", color: "#e8c97a", fontSize: "1.2rem", cursor: "pointer" }}>+</button>
            </div>
            <div style={S.card}>
              <h3 style={S.sTitle}>🛒 Zutaten</h3>
              {recipe.zutaten?.map((z, i) => (
                <div key={i} style={S.divider(i === recipe.zutaten.length - 1)}>
                  <span style={{ fontSize: "0.9rem" }}>{z.name}</span>
                  <span style={{ color: "#e8c97a", fontWeight: "bold", fontSize: "0.9rem" }}>{scale(z.menge)} {z.einheit}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <h3 style={S.sTitle}>📋 Zubereitung</h3>
              {recipe.schritte?.map((s, i) => (
                <div key={i} style={S.stepRow}>
                  <div style={S.stepNum}>{i + 1}</div>
                  <p style={{ margin: "2px 0 0", color: "#d5c5a5", lineHeight: "1.6", fontSize: "0.9rem" }}>{s}</p>
                </div>
              ))}
            </div>
            {recipe.tipps?.length > 0 && (
              <div style={S.card}>
                <h3 style={S.sTitle}>💡 Tipps</h3>
                {recipe.tipps.map((t, i) => <div key={i} style={{ color: "#8a7a5a", marginBottom: "0.4rem", paddingLeft: "0.8rem", borderLeft: "2px solid #e8c97a", fontSize: "0.88rem" }}>• {t}</div>)}
              </div>
            )}
            {recipe.naehrwerte && (
              <div style={S.card}>
                <h3 style={S.sTitle}>📊 Nährwerte (pro Portion)</h3>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {Object.entries(recipe.naehrwerte).map(([k, v]) => (
                    <div key={k} style={S.badge}><div style={S.bLabel}>{k}</div><div style={S.bVal}>{v}</div></div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { setRecipe(null); setUrl(""); setText(""); setShared(false); }} style={{ ...S.btn(false), background: "transparent", color: "#e8c97a", border: "1px solid #3d2f15", marginTop: "0.5rem" }}>
              🔄 Neues Rezept
            </button>
          </div>
        )}
      </div>
      <style>{`input::placeholder, textarea::placeholder { color: #3d2f15; } input:focus, textarea:focus { border-color: #e8c97a !important; }`}</style>
    </div>
  );
}

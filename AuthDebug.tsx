import React, { useState } from "react";
import { supabase } from "./lib/supabase.ts"; // adapte le chemin à TON fichier

const AuthDebug: React.FC = () => {
  const [email, setEmail] = useState("admin@admin.com"); // ou ton email
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleTestLogin = async () => {
    setResult("⏳ Test en cours...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("SUPABASE ERROR:", error);
      setResult(
        `❌ Erreur:
status: ${error.status}
message: ${error.message}
code: ${error.name || "n/a"}`
      );
    } else {
      console.log("SUPABASE DATA:", data);
      setResult(`✅ Succès ! Utilisateur connecté: ${data.user?.email}`);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Debug Supabase Login</h1>

      <div style={{ marginBottom: 10 }}>
        <label>
          Email :
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Mot de passe :
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </label>
      </div>

      <button onClick={handleTestLogin}>Tester le login Supabase</button>

      {result && (
        <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{result}</pre>
      )}
    </div>
  );
};

export default AuthDebug;

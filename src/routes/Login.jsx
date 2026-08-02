import { useAuth } from "../context/AuthContext";
import { LootLockup } from "../components/LootLockup";

export function Login() {
  const { signInWithGoogle, authError } = useAuth();
  return (
    <div className="splash">
      <LootLockup height={64} />
      <p>Gère tes annonces Vinted &amp; LeBonCoin</p>
      <button className="btn btn-primary" onClick={signInWithGoogle}>
        Se connecter avec Google
      </button>
      {authError && (
        <p style={{ color: "var(--pink-dark)", fontSize: 12, maxWidth: 300, textAlign: "center", marginTop: 8 }}>
          Erreur : {authError}
        </p>
      )}
    </div>
  );
}

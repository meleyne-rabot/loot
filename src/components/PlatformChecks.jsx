export function PlatformChecks({ value, onChange }) {
  const toggle = (k) => {
    const n = value.includes(k) ? value.filter((p) => p !== k) : [...value, k];
    onChange(n);
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      {[["vinted", "Vinted"], ["leboncoin", "LBC"]].map(([k, l]) => (
        <div key={k} className={"pcheck " + (k === "leboncoin" ? "lbc" : "vinted") + (value.includes(k) ? " on" : "")} onClick={() => toggle(k)}>
          <span className={"pb " + (k === "leboncoin" ? "pb-l" : "pb-v")}>{l}</span>
        </div>
      ))}
    </div>
  );
}

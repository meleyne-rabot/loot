async function postGenerate(body) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = [data.error, data.detail].filter(Boolean).join(" : ") || "Erreur de génération";
    throw new Error(message);
  }
  return data;
}

export async function callAI(images, context, userName, calibrationNote, userPrefs) {
  return postGenerate({ images, context, mode: "generate", userName, calibrationNote, userPrefs });
}

export async function refineAI(images, context, currentResult, chatHistory, userName) {
  return postGenerate({ images, context, mode: "refine", currentResult, chatHistory, userName });
}

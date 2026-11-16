// Servidor simulado de Gemini para probar el ciclo de herramientas sin gastar cuota.
import http from "node:http";
const port = Number(process.argv[2] || 4010);
const log = [];
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = JSON.parse(body);
    const last = j.contents[j.contents.length - 1];
    const fnResponses = last.parts.filter((p) => p.functionResponse).map((p) => p.functionResponse.name);
    log.push({ key: req.headers["x-goog-api-key"], tools: j.tools[0].functionDeclarations.length, fnResponses });
    let parts;
    if (!fnResponses.length) parts = [{ functionCall: { name: "actualizar_perfil", args: { budgetMaxCop: 900000, uses: ["fotos"] } }, thoughtSignature: "sigA" }];
    else if (fnResponses[0] === "actualizar_perfil") parts = [{ functionCall: { name: "recomendar_celulares", args: {} }, thoughtSignature: "sigB" }];
    else if (fnResponses[0] === "recomendar_celulares") {
      // verificar que se devolvieron las firmas
      const sigs = j.contents.flatMap((c) => c.parts).filter((p) => p.thoughtSignature).map((p) => p.thoughtSignature);
      parts = [{ text: `Te recomiendo estas opciones. (firmas recibidas: ${sigs.join(",")})` }];
    } else parts = [{ text: "ok" }];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }] }));
  });
}).listen(port, () => console.log("mock gemini on", port));

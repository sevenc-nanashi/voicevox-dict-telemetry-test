import { hono, serve } from "./deps.ts";
import { requestSchema } from "./schema.ts";

const app = new hono.Hono();
const dictFile = "./dict.json";

if (await Deno.readTextFile(dictFile).catch(() => null) === null) {
  await Deno.writeTextFile(dictFile, "{}");
}

app.get("/", (c) => {
  return c.json({ message: "Hello World!" });
});

app.post("/telemetry", async (c) => {
  const body = c.req.body;
  if (!body) {
    c.status(400);
    return c.json({ message: "Bad Request" });
  }

  let rawData;
  try {
    rawData = JSON.parse(
      new TextDecoder().decode((await body.getReader().read()).value),
    );
  } catch {
    c.status(400);
    return c.json({ message: "Bad Request" });
  }

  const data = requestSchema.parse(rawData);

  switch (data.event) {
    case "apply_word":
    case "rewrite_word": {
      const dict = JSON.parse(await Deno.readTextFile(dictFile));
      dict[data.properties.wordUuid] = data.properties;
      await Deno.writeTextFile(dictFile, JSON.stringify(dict));
      break;
    }
    case "delete_word": {
      const dict = JSON.parse(await Deno.readTextFile(dictFile));
      delete dict[data.properties.wordUuid];
      await Deno.writeTextFile(dictFile, JSON.stringify(dict));
    }
  }

  console.log(`[telemetry] ${data.event}`);

  return new Response(null, { status: 204 });
});

serve(app.fetch, { port: 50023 });

import { hono, ky, serve } from "./deps.ts";
import { DictWord, dictWordSchema, requestSchema } from "./schema.ts";

const app = new hono.Hono();
const dictFile = "./dict.json";

const gasUrl =
  "https://script.google.com/macros/s/AKfycbz5ElVEy0xe3Wi-FdGzSxbuS0yvGCeRJlmyAdCMYuzYPoKHmGpU91-xM46AECwhBTOc/exec";

if (await Deno.readTextFile(dictFile).catch(() => null) === null) {
  await Deno.writeTextFile(dictFile, "{}");
}

const wordToRow = (word: DictWord) => {
  return [
    word.word_uuid,
    word.surface,
    word.pronunciation,
    word.accent_type,
    word.word_type,
    word.priority,
  ];
};

const wordFromRow = (data: string[]) => {
  return dictWordSchema.parse({
    word_uuid: data[0],
    surface: data[1],
    pronunciation: data[2],
    accent_type: Number(data[3]),
    word_type: data[4] as DictWord["word_type"],
    priority: Number(data[5]),
  });
};

app.get("/", (c) => {
  return c.json({ message: "Hello World!" });
});

app.post("/shared_dict/collect", async (c) => {
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
    case "apply_word": {
      ky.post(gasUrl, {
        json: {
          type: "append",
          data: wordToRow(data.properties),
        },
      });
      break;
    }
    case "rewrite_word": {
      ky.post(gasUrl, {
        json: {
          type: "modify",
          uuid: data.properties.word_uuid,
          data: wordToRow(data.properties),
        },
      });
      break;
    }
    case "delete_word": {
      ky.post(gasUrl, {
        json: {
          type: "delete",
          uuid: data.properties.word_uuid,
        },
      });
    }
  }

  console.log(`[telemetry] ${data.event}`);

  return new Response(null, { status: 204 });
});

app.get("/shared_dict", async (c) => {
  const data = await ky.get(gasUrl).json().then((data) =>
    (data as string[][]).map(wordFromRow)
  );
  return c.json(Object.fromEntries(data.map((word) => [word.word_uuid, word])));
});

serve(app.fetch, { port: 50023 });

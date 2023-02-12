import { z } from "./deps.ts";

export const dictWordSchema = z.object({
  word_uuid: z.string(),
  surface: z.string(),
  pronunciation: z.string(),
  accent_type: z.number(),
  word_type: z.enum([
    "PROPER_NOUN",
    "COMMON_NOUN",
    "VERB",
    "ADJECTIVE",
    "SUFFIX",
    "",
  ]).or(z.null()).transform((v) => (v === "" ? null : v)),
  priority: z.number(),
});

export type DictWord = z.infer<typeof dictWordSchema>;

export const requestType = {
  apply_word: dictWordSchema,
  rewrite_word: dictWordSchema,
  delete_word: z.object({
    word_uuid: z.string(),
  }),
};

export const requestSchema = z.union(
  // @ts-expect-error 謎のエラー
  Object.entries(requestType).map(([key, value]) => {
    return z.object({
      event: z.literal(key),
      properties: value,
    });
  }),
);

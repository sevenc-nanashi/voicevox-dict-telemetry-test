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
  ]).or(z.null()),
  priority: z.number(),
}).transform((v) => {
  return {
    ...v,
    wordUuid: v.word_uuid,
    wordType: v.word_type,
  };
});

export const requestType = {
  apply_word: dictWordSchema,
  rewrite_word: dictWordSchema,
  delete_word: z.object({
    word_uuid: z.string(),
  }).transform((v) => {
    return {
      ...v,
      wordUuid: v.word_uuid,
    };
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

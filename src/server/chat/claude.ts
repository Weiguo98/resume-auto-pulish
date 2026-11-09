import Anthropic from "@anthropic-ai/sdk";
import type { Attachment } from "../../shared/api.ts";
import { UserError } from "../errors.ts";
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, type ModelOutput } from "./prompt.ts";

const anthropic = new Anthropic();

function attachmentBlock(file: Attachment): Anthropic.Beta.BetaContentBlockParam {
  if (file.type === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } };
  }
  return { type: "text", text: `Attached file "${file.name}":\n${Buffer.from(file.data, "base64").toString("utf8")}` };
}

const WEB_FETCH: Anthropic.Beta.BetaWebFetchTool20260209 = { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 };
const MAX_PAUSES = 3;

export async function askClaude(text: string, file: Attachment | null, readLinks = false): Promise<ModelOutput> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = file ? [attachmentBlock(file), { type: "text", text }] : [{ type: "text", text }];
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  let msg: Anthropic.Beta.BetaMessage;
  for (let pauses = 0; ; pauses++) {
    msg = await anthropic.beta.messages
      .stream({
        model: "claude-opus-5-5",
        max_tokens: 64000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
        system: SYSTEM_PROMPT,
        tools: readLinks ? [WEB_FETCH] : undefined,
        messages,
      })
      .finalMessage();
    if (msg.stop_reason !== "pause_turn" || pauses === MAX_PAUSES) break;
    messages.push({ role: "assistant", content: msg.content });
  }

  if (msg.stop_reason === "refusal") throw new UserError("Sorry, I can't help with that request.");
  if (msg.stop_reason === "max_tokens") throw new UserError("That was too much to do in one go. Try a smaller request.");
  if (msg.stop_reason === "pause_turn") throw new UserError("Reading that page took too long. Paste the text instead.");
  const output = msg.content.findLast((b) => b.type === "text");
  if (!output) throw new UserError("Something went wrong while updating your site. Please try again.");
  return JSON.parse(output.text) as ModelOutput;
}

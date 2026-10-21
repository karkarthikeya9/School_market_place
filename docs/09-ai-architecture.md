# 09 — AI Architecture

## Recommendation: no AI in the MVP

The initial marketplace requirements do **not** require AI. There is no recommendation engine, AI search, LLM chatbot, image-based categorization, automated listing generation, or AI moderation in scope (see non-goals in `docs/01-product.md`).

**Decision (DEC-007): do not integrate any AI, LLM, or machine-learning dependency in the MVP.** Adding AI would violate scope control and introduce cost, latency, privacy, and evaluation obligations with no corresponding requirement.

Explicitly **not** added (each is a possible future enhancement, not an approved requirement):
- LLM chatbots / support assistants.
- AI/semantic or personalized search ranking.
- AI recommendations.
- Image-based categorization or condition detection.
- Automated listing text generation.
- AI moderation.

## If AI is later approved (evaluation checklist)

If the owner later approves a specific AI use case, it must be scoped through this checklist **before** implementation, with a new decision-log entry and requirement IDs:

1. **Use case:** exact problem and measurable goal.
2. **Model choice & rationale:** provider, model, cost/latency fit.
3. **Input/output schemas:** typed (Zod) contracts; no free-form agent behavior.
4. **Prompt & tool boundaries:** system prompt scope, forbidden actions, no tool/agent autonomy beyond the defined boundary.
5. **Validation:** output validated against schema and business rules; invalid output rejected.
6. **Security & privacy:** PII handling, data sent to third-party models, retention.
7. **Hallucination handling:** outputs treated as suggestions; human confirmation required for any consequential action (e.g., moderation).
8. **Human review:** mandatory for moderation/content actions.
9. **Cost limits:** per-request and aggregate budget caps.
10. **Latency limits:** timeout + fallback.
11. **Evaluation:** offline metrics + golden set; regression tests.
12. **Fallback behavior:** deterministic non-AI path on failure/timeout.
13. **Monitoring:** usage, error rate, cost, quality sampling.

Until such a use case is approved and this checklist is completed, no AI service, model, or dependency will be created or installed.

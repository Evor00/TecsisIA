import re

with open('rag_api/llm_client.py', 'r', encoding='utf-8') as f:
    content = f.read()

# For generate_answer
content = re.sub(
    r"except httpx\.RequestError as e:\s+raise LLMUnavailableError.*?from e",
    "except httpx.RequestError:\n        return _fallback_to_gemini(messages_ga, timeout)",
    content, count=1
)
content = re.sub(
    r"if resp\.status_code != 200:\s+raise LLMUnavailableError\(f'El motor de IA respondi.*?resp\.text\[:200\].*?'\)",
    "if resp.status_code != 200:\n        return _fallback_to_gemini(messages_ga, timeout)",
    content, count=1
)

# For generate_answer_stream
content = re.sub(
    r"except httpx\.RequestError as e:\s+raise LLMUnavailableError.*?from e",
    "except httpx.RequestError:\n        yield from _fallback_to_gemini_stream(messages_gs, timeout)",
    content
)
content = re.sub(
    r"if resp\.status_code != 200:\s+raise LLMUnavailableError\(f'Motor de IA respondi.*?'\)",
    "if resp.status_code != 200:\n                yield from _fallback_to_gemini_stream(messages_gs, timeout)\n                return",
    content
)

with open('rag_api/llm_client.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Regex successfully.")

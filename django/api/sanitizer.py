import html
import re

def bleach(input_string: str) -> str:
    if not isinstance(input_string, str):
        raise ValueError("Input must be a string")

    sanitized = input_string.strip()

    sanitized = html.escape(sanitized)

    allowed_pattern = re.compile(r"[^a-zA-Z0-9\s\.\,\@\!\?\-\_]")
    sanitized = allowed_pattern.sub("", sanitized)

    return sanitized
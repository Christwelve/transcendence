import html
import re
from typing import Optional

def bleach(input_string: Optional[str]) -> str:

    if input_string is None:
        return ""

    if not isinstance(input_string, str):
        raise ValueError("Input must be a string")

    sanitized = input_string.strip()
    sanitized = html.escape(sanitized)

    allowed_pattern = re.compile(r"[^a-zA-Z0-9\s\.\,\@\!\?\-\_\(\)\[\]\{\}\+\=\~\*]")
    sanitized = allowed_pattern.sub("", sanitized)

    sql_injection_keywords = [
        "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE",
        "UNION", "OR", "AND", "NOT", "EXECUTE", "EXEC", "DECLARE", "BEGIN", "END"
    ]
    sanitized = " ".join([word for word in sanitized.split() if word.upper() not in sql_injection_keywords])

    return sanitized
import html
import re
from typing import Optional

try:
    import bleach  # Import the Bleach library if we need it
except ImportError:
    bleach = None 
        
def bleachThe(input_string: Optional[str], context: str = 'default') -> str:
    """A cutesy tiny custom sanitizer."""
    try:
        if input_string is None:
            return ""

        if not isinstance(input_string, str):
            raise ValueError("Input must be a string")
        
        sanitized = input_string.strip()
        
        if context == 'url':
            allowed_pattern = re.compile(r"[^a-zA-Z0-9\s\.\,\@\!\?\-\_\(\)\[\]\{\}\+\=\~\*/\:;&=%]")
            sanitized = allowed_pattern.sub("", sanitized)
        elif context == 'query':
            allowed_pattern = re.compile(r"[^a-zA-Z0-9\s\.\,\@\!\?\-\_\(\)\[\]\{\}\+\=\~\*/\:\;&]")
            sanitized = allowed_pattern.sub("", sanitized)
        else:
            sanitized = re.sub(r"<script>.*?</script>", "", sanitized, flags=re.IGNORECASE)
            sanitized = html.escape(sanitized)
            sanitized = re.sub(r"/\*.*?\*/", "", sanitized, flags=re.DOTALL)
            sanitized = re.sub(r"--.*$", "", sanitized, flags=re.MULTILINE)
            sanitized = re.sub(r";.*$", "", sanitized, flags=re.MULTILINE)
            allowed_pattern = re.compile(r"[^a-zA-Z0-9\s\.\,\@\!\?\-\_\(\)\[\]\{\}\+\=\~\*]")
            sanitized = allowed_pattern.sub("", sanitized)


        sanitized = re.sub(r"\s+", " ", sanitized)
    
        return sanitized
    except Exception as e:
        if bleach:
            return bleach.clean(input_string or "", strip=True)
        else:
            # If Bleach is not needed, return an empty string as a last resort
            return ""
"""Utility functions for injecting runtime configuration into HTML"""

import json
import os
from pathlib import Path


def inject_api_key_into_html(html_content: str, api_key: str | None = None) -> str:
    """
    Inject API key configuration into HTML content.

    The API key is injected as a script tag that sets window.APP_CONFIG.
    The script is placed before the closing </head> tag, or before </body>
    if </head> doesn't exist, or at the beginning of <body> as a fallback.

    Args:
        html_content: The HTML content to inject into
        api_key: The API key to inject. If None, reads from API_KEY env var.

    Returns:
        HTML content with the configuration script injected

    Example:
        >>> html = "<html><head></head><body></body></html>"
        >>> result = inject_api_key_into_html(html, "my-api-key")
        >>> assert "window.APP_CONFIG" in result
    """
    if api_key is None:
        api_key = os.getenv("API_KEY", "")

    # Use JSON encoding to safely escape the API key and prevent XSS
    config_data = json.dumps({"API_KEY": api_key})
    config_script = f"<script>window.APP_CONFIG = {config_data};</script>"

    # Try to inject before </head> first (preferred location)
    if "</head>" in html_content:
        html_content = html_content.replace("</head>", f"{config_script}\n</head>")
    # Fallback to before </body>
    elif "</body>" in html_content:
        html_content = html_content.replace("</body>", f"{config_script}\n</body>")
    # Last resort: inject at the beginning of <body>
    else:
        html_content = html_content.replace("<body>", f"<body>{config_script}")

    return html_content


def load_and_inject_api_key(index_path: Path, api_key: str | None = None) -> str:
    """
    Load HTML file and inject API key configuration.

    Args:
        index_path: Path to the HTML file
        api_key: The API key to inject. If None, reads from API_KEY env var.

    Returns:
        HTML content with the configuration script injected

    Raises:
        FileNotFoundError: If the HTML file doesn't exist
    """
    if not index_path.exists():
        raise FileNotFoundError(f"HTML file not found: {index_path}")

    with open(index_path, encoding="utf-8") as f:
        html_content = f.read()

    return inject_api_key_into_html(html_content, api_key)

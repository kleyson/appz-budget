"""Tests for HTML injection utilities"""

import pytest

from utils.html_injector import inject_api_key_into_html, load_and_inject_api_key


class TestInjectApiKeyIntoHtml:
    """Tests for inject_api_key_into_html function"""

    def test_inject_before_head_tag(self):
        """Test injection before closing </head> tag"""
        html = "<html><head></head><body></body></html>"
        result = inject_api_key_into_html(html, "test-api-key")

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "test-api-key"}' in result
        assert result.count("</head>") == 1
        assert result.index("window.APP_CONFIG") < result.index("</head>")

    def test_inject_before_body_tag_when_no_head(self):
        """Test injection before closing </body> tag when </head> doesn't exist"""
        html = "<html><body></body></html>"
        result = inject_api_key_into_html(html, "test-api-key")

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "test-api-key"}' in result
        assert result.count("</body>") == 1
        assert result.index("window.APP_CONFIG") < result.index("</body>")

    def test_inject_at_body_start_when_no_tags(self):
        """Test injection at beginning of <body> when no closing tags exist"""
        html = "<html><body><div>Content</div></body></html>"
        # Remove closing tags for this test
        html = html.replace("</body>", "").replace("</head>", "")
        result = inject_api_key_into_html(html, "test-api-key")

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "test-api-key"}' in result
        # Should be injected right after <body>
        body_index = result.index("<body>")
        script_index = result.index("window.APP_CONFIG")
        assert script_index > body_index

    def test_inject_empty_api_key(self):
        """Test injection with empty API key"""
        html = "<html><head></head><body></body></html>"
        result = inject_api_key_into_html(html, "")

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": ""}' in result

    def test_inject_from_env_var(self, monkeypatch):
        """Test injection reads API key from environment variable when not provided"""
        monkeypatch.setenv("API_KEY", "env-api-key")
        html = "<html><head></head><body></body></html>"
        result = inject_api_key_into_html(html)

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "env-api-key"}' in result

    def test_inject_special_characters(self):
        """Test injection properly escapes special characters in API key"""
        # API key with special characters that could cause XSS
        api_key = 'test"key<script>alert("xss")</script>'
        html = "<html><head></head><body></body></html>"
        result = inject_api_key_into_html(html, api_key)

        assert "window.APP_CONFIG" in result
        # Should be properly JSON-encoded, not raw string
        assert '<script>alert("xss")</script>' not in result
        # The script tag should be escaped in JSON
        assert "\\u003cscript\\u003e" in result or '"test\\"key' in result

    def test_inject_unicode_characters(self):
        """Test injection handles unicode characters in API key"""
        api_key = "test-🔑-key-测试"
        html = "<html><head></head><body></body></html>"
        result = inject_api_key_into_html(html, api_key)

        assert "window.APP_CONFIG" in result
        # Unicode should be preserved in JSON
        assert "🔑" in result or "\\u" in result  # Either preserved or escaped

    def test_inject_preserves_original_html(self):
        """Test injection doesn't modify other parts of HTML"""
        html = "<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>"
        result = inject_api_key_into_html(html, "test-key")

        assert "<title>Test</title>" in result
        assert "<h1>Hello</h1>" in result
        assert "window.APP_CONFIG" in result

    def test_inject_multiple_times_safe(self):
        """Test that injecting multiple times doesn't break HTML"""
        html = "<html><head></head><body></body></html>"
        result1 = inject_api_key_into_html(html, "key1")
        result2 = inject_api_key_into_html(result1, "key2")

        # Should still be valid HTML
        assert result2.count("window.APP_CONFIG") == 2
        assert "</head>" in result2


class TestLoadAndInjectApiKey:
    """Tests for load_and_inject_api_key function"""

    def test_load_and_inject_from_file(self, tmp_path):
        """Test loading HTML from file and injecting API key"""
        html_file = tmp_path / "index.html"
        html_content = "<html><head></head><body></body></html>"
        html_file.write_text(html_content, encoding="utf-8")

        result = load_and_inject_api_key(html_file, "test-key")

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "test-key"}' in result
        # Original HTML structure should be preserved (with script injected)
        assert "<html>" in result
        assert "<head>" in result
        assert "</head>" in result
        assert "<body>" in result
        assert "</body>" in result

    def test_load_and_inject_file_not_found(self, tmp_path):
        """Test raises FileNotFoundError when file doesn't exist"""
        non_existent_file = tmp_path / "missing.html"

        with pytest.raises(FileNotFoundError):
            load_and_inject_api_key(non_existent_file, "test-key")

    def test_load_and_inject_from_env_var(self, tmp_path, monkeypatch):
        """Test loading and injecting reads API key from environment"""
        monkeypatch.setenv("API_KEY", "env-key")
        html_file = tmp_path / "index.html"
        html_file.write_text("<html><head></head><body></body></html>", encoding="utf-8")

        result = load_and_inject_api_key(html_file)

        assert "window.APP_CONFIG" in result
        assert '{"API_KEY": "env-key"}' in result

    def test_load_and_inject_utf8_encoding(self, tmp_path):
        """Test loading HTML with UTF-8 encoding"""
        html_file = tmp_path / "index.html"
        html_content = "<html><head><title>测试</title></head><body>Hello 世界</body></html>"
        html_file.write_text(html_content, encoding="utf-8")

        result = load_and_inject_api_key(html_file, "test-key")

        assert "测试" in result
        assert "世界" in result
        assert "window.APP_CONFIG" in result

    def test_load_and_inject_complex_html(self, tmp_path):
        """Test loading and injecting into complex HTML structure"""
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appz Budget</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="root"></div>
    <script src="/app.js"></script>
</body>
</html>"""
        html_file = tmp_path / "index.html"
        html_file.write_text(html_content, encoding="utf-8")

        result = load_and_inject_api_key(html_file, "test-key")

        assert "window.APP_CONFIG" in result
        assert "<title>Appz Budget</title>" in result
        assert '<div id="root"></div>' in result
        # Script should be injected before </head>
        head_end = result.index("</head>")
        config_script = result.index("window.APP_CONFIG")
        assert config_script < head_end

//! Secret detection module
//! Rust regex implementation for detecting secrets in code

use napi_derive::napi;
use regex::Regex;

/// Detect potential secrets in content
#[napi]
pub fn detect_secrets(content: String) -> bool {
    let content = content.as_str();
    // OpenAI API keys: sk-[a-zA-Z0-9]{20,}
    if let Ok(re) = Regex::new(r"sk-[a-zA-Z0-9]{20,}") {
        if re.is_match(content) {
            return true;
        }
    }

    // GitHub tokens: ghp_[a-zA-Z0-9]{36}
    if let Ok(re) = Regex::new(r"ghp_[a-zA-Z0-9]{36}") {
        if re.is_match(content) {
            return true;
        }
    }

    // Password assignments: password\s*[:=]\s*["'][^"']+["']
    if let Ok(re) = Regex::new(r"password\s*[:=]\s*'[^']+'") {
        if re.is_match(content) {
            return true;
        }
    }

    // API key assignments: api[_-]?key\s*[:=]\s*["'][^"']+["']
    if let Ok(re) = Regex::new(r"api[_-]?key\s*[:=]\s*'[^']+'") {
        if re.is_match(content) {
            return true;
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_openai_key() {
        assert!(detect_secrets("export const apiKey = 'sk-12345678901234567890123456789012';".into()));
    }

    #[test]
    fn test_detect_github_token() {
        assert!(detect_secrets("ghp_abcdefghijklmnopqrstuvwxyz1234567890".into()));
    }

    #[test]
    fn test_detect_password_assignment() {
        assert!(detect_secrets("password = 'secret123'".into()));
    }

    #[test]
    fn test_detect_api_key_assignment() {
        assert!(detect_secrets("api_key: 'my-secret-key'".into()));
    }

    #[test]
    fn test_no_secrets() {
        assert!(!detect_secrets("const foo = 'bar'; // no secrets here".into()));
    }
}

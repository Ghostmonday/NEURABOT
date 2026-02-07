//! Self-modify checklist module
//! Rust implementation of diff ratio computation, boundary checking, and syntax validation

use napi_derive::napi;
use regex::Regex;
use serde::{Deserialize, Serialize};

/// Boundary check result
#[derive(Debug, Serialize, Deserialize, Clone)]
#[napi(object)]
pub struct BoundaryResult {
    pub allowed: bool,
    pub reason: String,
}

/// Syntax check result
#[derive(Debug, Serialize, Deserialize, Clone)]
#[napi(object)]
pub struct SyntaxResult {
    pub valid: bool,
    pub error: Option<String>,
}

/// Compute diff ratio between old and new content
/// Uses set-based line comparison for accurate change detection
#[napi]
pub fn compute_diff_ratio(old: String, new: String) -> f64 {
    let old_lines: Vec<&str> = old.split('\n').collect();
    let new_lines: Vec<&str> = new.split('\n').collect();

    let old_set: std::collections::HashSet<&str> = old_lines.iter().copied().collect();
    let new_set: std::collections::HashSet<&str> = new_lines.iter().copied().collect();

    // Count removed lines (in old but not in new)
    let removed: usize = old_set.difference(&new_set).count();

    // Count added lines (in new but not in old)
    let added: usize = new_set.difference(&old_set).count();

    let total_lines = std::cmp::max(old_set.len(), new_set.len());
    if total_lines == 0 {
        return 0.0;
    }

    // Ratio: (added + removed) / (2 * total_lines)
    // Complete rewrite = 1.0
    (added + removed) as f64 / (2.0 * total_lines as f64)
}

/// Check if a path is in the allowed list
#[napi]
pub fn check_boundary(path: String, allowlist: Vec<String>) -> BoundaryResult {
    if allowlist.is_empty() {
        return BoundaryResult {
            allowed: true,
            reason: "No allowlist configured".to_string(),
        };
    }

    for pattern in allowlist {
        if path_matches_pattern(&path, &pattern) {
            return BoundaryResult {
                allowed: true,
                reason: format!("Matched allowlist pattern: {}", pattern),
            };
        }
    }

    BoundaryResult {
        allowed: false,
        reason: format!("Path not in allowlist: {}", path),
    }
}

/// Simple path matching (supports * wildcards)
fn path_matches_pattern(path: &str, pattern: &str) -> bool {
    if pattern.contains('*') {
        // Convert glob pattern to regex
        let regex_pattern = pattern
            .replace(".", "\\.")
            .replace("*", ".*")
            .replace("?", ".");
        if let Ok(re) = Regex::new(&format!("^{}$", regex_pattern)) {
            return re.is_match(path);
        }
    }
    path == pattern
}

/// Basic syntax validation for TypeScript/JavaScript
/// Note: Full TypeScript parsing requires the TypeScript compiler, this is a basic check
#[napi]
pub fn check_syntax(content: String, file_path: String) -> SyntaxResult {
    let content = content.as_str();
    let file_path = file_path.as_str();
    // Skip if not a TypeScript/JavaScript file
    if !file_path.ends_with(".ts")
        && !file_path.ends_with(".tsx")
        && !file_path.ends_with(".js")
        && !file_path.ends_with(".jsx")
    {
        return SyntaxResult {
            valid: true,
            error: None,
        };
    }

    // Basic structural checks
    let open_braces = content.matches('{').count();
    let close_braces = content.matches('}').count();
    let open_parens = content.matches('(').count();
    let close_parens = content.matches(')').count();
    let open_brackets = content.matches('[').count();
    let close_brackets = content.matches(']').count();

    if open_braces != close_braces {
        return SyntaxResult {
            valid: false,
            error: Some(format!(
                "Mismatched braces: {} open, {} close",
                open_braces, close_braces
            )),
        };
    }

    if open_parens != close_parens {
        return SyntaxResult {
            valid: false,
            error: Some(format!(
                "Mismatched parentheses: {} open, {} close",
                open_parens, close_parens
            )),
        };
    }

    if open_brackets != close_brackets {
        return SyntaxResult {
            valid: false,
            error: Some(format!(
                "Mismatched brackets: {} open, {} close",
                open_brackets, close_brackets
            )),
        };
    }

    // Check for obvious syntax errors
    // Multiple statements on same line without semicolon (basic check)
    let lines: Vec<&str> = content.split('\n').collect();
    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("//") || trimmed.starts_with("/*") {
            continue;
        }

        // Check for lines with multiple statements without semicolons
        let has_statement_ending = trimmed.ends_with(';')
            || trimmed.ends_with('{')
            || trimmed.ends_with('}')
            || trimmed.starts_with("import ")
            || trimmed.starts_with("export ")
            || trimmed.starts_with("from ")
            || trimmed.starts_with("const ")
            || trimmed.starts_with("let ")
            || trimmed.starts_with("var ")
            || trimmed.starts_with("if ")
            || trimmed.starts_with("for ")
            || trimmed.starts_with("while ")
            || trimmed.starts_with("function ")
            || trimmed.starts_with("class ");

        if !has_statement_ending
            && !trimmed.is_empty()
            && !trimmed.ends_with('{')
            && !trimmed.ends_with('}')
        {
            let statements: Vec<&str> = trimmed.split(';').filter(|s| !s.trim().is_empty()).collect();
            if statements.len() > 1 {
                return SyntaxResult {
                    valid: false,
                    error: Some(format!(
                        "Line {}: Multiple statements without semicolons",
                        i + 1
                    )),
                };
            }
        }
    }

    SyntaxResult {
        valid: true,
        error: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identical_files() {
        let content = "line1\nline2\nline3\n";
        let ratio = compute_diff_ratio(content.to_string(), content.to_string());
        assert_eq!(ratio, 0.0);
    }

    #[test]
    fn test_single_line_change() {
        let ratio = compute_diff_ratio(
            "line1\nline2\nline3\n".to_string(),
            "line1\nline2modified\nline3\n".to_string(),
        );
        assert!(ratio > 0.0 && ratio < 0.5); // Should be a small change
    }

    #[test]
    fn test_complete_rewrite() {
        let ratio = compute_diff_ratio(
            "old content\nold line\n".to_string(),
            "completely\ndifferent\ncontent\n".to_string(),
        );
        // Set-based: shared "" line from trailing \n reduces ratio; 0.5+ = major rewrite
        assert!(ratio > 0.5, "Expected major rewrite ratio, got {}", ratio);
    }

    #[test]
    fn test_empty_files() {
        assert_eq!(compute_diff_ratio(String::new(), String::new()), 0.0);
    }

    #[test]
    fn test_check_boundary_allowed() {
        let result = check_boundary(
            "src/sowwy/mission-control/scheduler.ts".to_string(),
            vec!["src/sowwy/**".to_string()],
        );
        assert!(result.allowed);
    }

    #[test]
    fn test_check_boundary_blocked() {
        let result = check_boundary(
            "src/infra/gateway.ts".to_string(),
            vec!["src/sowwy/**".to_string()],
        );
        assert!(!result.allowed);
    }

    #[test]
    fn test_check_syntax_valid() {
        let result = check_syntax(
            "export function foo() { return 1; }".to_string(),
            "test.ts".to_string(),
        );
        assert!(result.valid);
    }

    #[test]
    fn test_check_syntax_mismatched_braces() {
        let result = check_syntax(
            "function foo() { return 1;".to_string(),
            "test.ts".to_string(),
        );
        assert!(!result.valid);
    }
}

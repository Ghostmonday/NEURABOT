//! Media parsing module
//! Parse media tokens and fence spans from text content

use napi_derive::napi;
use regex::Regex;
use serde::{Deserialize, Serialize};

/// Result of media parsing
#[derive(Debug, Serialize, Deserialize, Clone)]
#[napi(object)]
pub struct MediaParseResult {
    pub has_media: bool,
    pub media_count: i32,
    pub media_types: Vec<String>,
}

/// Split media from output, parsing fence spans
#[napi]
pub fn split_media_from_output(raw: String) -> MediaParseResult {
    let raw = raw.as_str();
    // Match media token patterns like [[media:1]], [[media:type:xxx]]
    let media_token_re = Regex::new(r"\[\[media:([^\]]+)\]\]").unwrap();

    let mut media_types = Vec::new();
    let mut has_media = false;

    for cap in media_token_re.captures_iter(raw) {
        if let Some(token) = cap.get(1) {
            let token_str = token.as_str().to_lowercase();
            if !token_str.is_empty() && !media_types.contains(&token_str) {
                media_types.push(token_str);
            }
            has_media = true;
        }
    }

    MediaParseResult {
        has_media,
        media_count: media_types.len() as i32,
        media_types,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_media() {
        let result = split_media_from_output("Just regular text without any media".into());
        assert!(!result.has_media);
        assert_eq!(result.media_count, 0);
    }

    #[test]
    fn test_single_media() {
        let result = split_media_from_output("Here is an image [[media:1]] in the text".into());
        assert!(result.has_media);
        assert_eq!(result.media_count, 1);
    }

    #[test]
    fn test_multiple_media() {
        let result = split_media_from_output(
            "Images: [[media:image:1]] and [[media:image:2]] and audio [[media:audio:1]]".into(),
        );
        assert!(result.has_media);
        assert_eq!(result.media_count, 3);
    }

    #[test]
    fn test_duplicate_media_types() {
        let result = split_media_from_output("[[media:image]] [[media:image]] [[media:audio]]".into());
        assert!(result.has_media);
        assert_eq!(result.media_count, 2); // Only unique types
    }
}

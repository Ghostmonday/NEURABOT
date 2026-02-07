//! MIME detection module
//! Fast MIME type detection using magic bytes and extensions

use napi_derive::napi;

/// Detect MIME type from buffer content
#[napi]
pub fn detect_mime(buffer: Vec<u8>) -> Option<String> {
    // Check magic bytes for common image formats
    if buffer.len() >= 8 {
        // JPEG
        if buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF {
            return Some("image/jpeg".to_string());
        }

        // PNG
        if buffer[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
            return Some("image/png".to_string());
        }

        // GIF87a
        if buffer[0..6] == [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] {
            return Some("image/gif".to_string());
        }

        // GIF89a
        if buffer[0..6] == [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] {
            return Some("image/gif".to_string());
        }

        // WebP
        if buffer[0..4] == [0x52, 0x49, 0x46, 0x46] && buffer[8..12] == [0x57, 0x45, 0x42, 0x50] {
            return Some("image/webp".to_string());
        }

        // PDF
        if buffer[0..4] == [0x25, 0x50, 0x44, 0x46] {
            return Some("application/pdf".to_string());
        }

        // MP3 (ID3 or MPEG audio)
        if buffer[0] == 0x49 && buffer[1] == 0x44 && buffer[2] == 0x33 {
            return Some("audio/mpeg".to_string());
        }
        if buffer[0] == 0xFF && (buffer[1] & 0xE0) == 0xE0 {
            return Some("audio/mpeg".to_string());
        }

        // MP4
        if buffer[4..8] == [0x66, 0x74, 0x79, 0x70] || buffer[4..8] == [0x6D, 0x70, 0x34, 0x32] {
            return Some("video/mp4".to_string());
        }

        // WebM
        if buffer[0..4] == [0x1A, 0x45, 0xDF, 0xA3] {
            return Some("video/webm".to_string());
        }
    }

    None
}

/// Get file extension from path
#[napi]
pub fn get_file_extension(file_path: String) -> Option<String> {
    get_file_extension_str(&file_path)
}

/// Internal &str version for reuse
fn get_file_extension_str(file_path: &str) -> Option<String> {
    file_path
        .rsplit('.')
        .next()
        .filter(|ext| !ext.is_empty() && ext.len() <= 10)
        .map(|s| s.to_lowercase())
}

/// Check if file is an audio file based on extension
#[napi]
pub fn is_audio_file_name(file_name: String) -> bool {
    if let Some(ext) = get_file_extension_str(&file_name) {
        matches!(
            ext.as_str(),
            "mp3" | "wav" | "ogg" | "flac" | "m4a" | "aac" | "wma" | "aiff"
        )
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_jpeg() {
        let jpeg_header = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
        assert_eq!(detect_mime(jpeg_header), Some("image/jpeg".to_string()));
    }

    #[test]
    fn test_detect_png() {
        let png_header = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        assert_eq!(detect_mime(png_header), Some("image/png".to_string()));
    }

    #[test]
    fn test_get_extension() {
        assert_eq!(get_file_extension_str("image.png"), Some("png".to_string()));
        assert_eq!(get_file_extension_str("path/to/file.MP3"), Some("mp3".to_string()));
        assert_eq!(get_file_extension_str("noextension"), None);
    }

    #[test]
    fn test_is_audio_file() {
        assert!(is_audio_file_name("song.mp3".to_string()));
        assert!(is_audio_file_name("track.WAV".to_string()));
        assert!(!is_audio_file_name("document.pdf".to_string()));
        assert!(!is_audio_file_name("image.png".to_string()));
    }
}

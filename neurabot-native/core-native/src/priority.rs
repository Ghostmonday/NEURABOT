//! Priority calculation module
//! Pure Rust implementation of task priority calculation

use napi_derive::napi;

/// Calculate task priority based on various factors
/// Higher values = higher priority
#[napi]
pub fn calculate_priority(
    urgency: i32,
    importance: i32,
    risk: i32,
    stress_cost: i32,
    created_at_timestamp: i64,
) -> f64 {
    // Base score from urgency and importance
    let base_score = (urgency as f64 * 2.0) + (importance as f64 * 1.5);

    // Factor in risk (inverse - lower risk = higher priority for same base)
    let risk_factor = 1.0 - (risk as f64 / 10.0);

    // Factor in stress cost (inverse - lower stress = higher priority)
    let stress_factor = 1.0 - (stress_cost as f64 / 10.0);

    // Age factor - older tasks get a slight boost
    let now = chrono::Utc::now().timestamp_millis();
    let age_ms = now - created_at_timestamp;
    let age_factor = 1.0 + ((age_ms as f64 / (1000.0 * 60.0 * 60.0)) * 0.01); // 1% boost per hour

    // Calculate final priority
    let priority = base_score * risk_factor * stress_factor * age_factor;

    // Round to 2 decimal places
    (priority * 100.0).floor() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_priority_basic() {
        // High urgency, high importance, low risk, low stress
        let priority = calculate_priority(8, 8, 1, 1, chrono::Utc::now().timestamp_millis());
        assert!(priority > 10.0);
    }

    #[test]
    fn test_calculate_priority_low_risk() {
        // Low risk should give higher priority
        let high_risk = calculate_priority(5, 5, 8, 5, chrono::Utc::now().timestamp_millis());
        let low_risk = calculate_priority(5, 5, 1, 5, chrono::Utc::now().timestamp_millis());
        assert!(low_risk > high_risk);
    }

    #[test]
    fn test_calculate_priority_low_stress() {
        // Low stress should give higher priority
        let high_stress = calculate_priority(5, 5, 5, 8, chrono::Utc::now().timestamp_millis());
        let low_stress = calculate_priority(5, 5, 5, 1, chrono::Utc::now().timestamp_millis());
        assert!(low_stress > high_stress);
    }
}

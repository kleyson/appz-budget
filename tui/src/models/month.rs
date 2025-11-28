use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Month {
    pub id: i32,
    pub year: i32,
    pub month: i32, // 1-12
    pub name: String,
    pub start_date: String,
    pub end_date: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MonthCreate {
    pub year: i32,
    pub month: i32, // 1-12
}

impl Month {
    /// Get display name (e.g., "November 2024")
    pub fn display_name(&self) -> String {
        let month_name = match self.month {
            1 => "January",
            2 => "February",
            3 => "March",
            4 => "April",
            5 => "May",
            6 => "June",
            7 => "July",
            8 => "August",
            9 => "September",
            10 => "October",
            11 => "November",
            12 => "December",
            _ => "Unknown",
        };
        format!("{} {}", month_name, self.year)
    }
}

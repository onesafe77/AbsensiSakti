// Utility functions for shift determination and display

// Function to get current local time (Indonesia timezone)
export function getCurrentTime(): Date {
  const now = new Date();
  // Convert to Indonesia timezone (WITA UTC+8)
  const indonesiaOffset = 8 * 60; // 8 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (indonesiaOffset * 60000));
}

// Function to get current local time string in HH:MM format (Indonesia timezone)
export function getCurrentTimeString(): string {
  const now = new Date();
  // Convert to Indonesia timezone (WITA UTC+8)
  const indonesiaOffset = 8 * 60; // 8 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const indonesiaTime = new Date(utc + (indonesiaOffset * 60000));
  return `${indonesiaTime.getHours().toString().padStart(2, '0')}:${indonesiaTime.getMinutes().toString().padStart(2, '0')}`;
}

export function determineShiftByTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // UPDATED CRITERIA:
  // Shift 1: 04:00-10:00 (240-600 menit)
  // Shift 2: 16:00-22:00 (960-1320 menit)
  
  if (totalMinutes >= 960 && totalMinutes <= 1320) { // 16:00 to 22:00
    return "Shift 2";
  } else if (totalMinutes >= 240 && totalMinutes <= 600) { // 04:00 to 10:00
    return "Shift 1";
  } else {
    return "Shift 1"; // Default to Shift 1 for other times
  }
}

export function isValidShiftTime(currentTime: string, scheduledShift: string): boolean {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  if (scheduledShift === "Shift 1") {
    // Shift 1: UPDATED CRITERIA - Hanya boleh scan antara jam 04:00 sampai 10:00
    return totalMinutes >= 240 && totalMinutes <= 600;
  } else if (scheduledShift === "Shift 2") {
    // Shift 2: UPDATED CRITERIA - Hanya boleh scan antara jam 16:00 sampai 22:00  
    return totalMinutes >= 960 && totalMinutes <= 1320;
  }
  
  // STRICT: Diluar shift yang ditentukan tidak boleh absensi
  return false;
}

export function getShiftDescription(shift: string): string {
  switch (shift) {
    case "Shift 1":
      return "Shift 1 (04:00 - 10:00)"; // UPDATED CRITERIA - Waktu window check-in sesuai validasi
    case "Shift 2":
      return "Shift 2 (16:00 - 22:00)"; // UPDATED CRITERIA - Waktu window check-in sesuai validasi
    default:
      return shift;
  }
}

// Function to get allowed time range for a shift
export function getShiftTimeRange(shift: string): { start: string; end: string } {
  switch (shift) {
    case "Shift 1":
      return { start: "04:00", end: "10:00" };
    case "Shift 2":
      return { start: "16:00", end: "22:00" };
    default:
      return { start: "00:00", end: "23:59" };
  }
}

// Function to check if current time is outside all allowed shift times
export function isOutsideAllShiftTimes(currentTime: string): boolean {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Check if time falls within any shift window - UPDATED CRITERIA
  const isInShift1 = totalMinutes >= 240 && totalMinutes <= 600; // 04:00-10:00
  const isInShift2 = totalMinutes >= 960 && totalMinutes <= 1320; // 16:00-22:00
  
  return !isInShift1 && !isInShift2;
}

export function getCurrentShift(): string {
  const currentTime = getCurrentTimeString();
  return determineShiftByTime(currentTime);
}

export function formatTimeWithShift(time: string): string {
  const shift = determineShiftByTime(time);
  return `${time} (${shift})`;
}
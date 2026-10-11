import Foundation

// Date-only reminders are local calendar days, never elapsed midnight deadlines.
struct ReminderDeadline {
    let date: Date
    let isAllDay: Bool
    let isOverdue: Bool
    let day: String
}
func reminderDeadline(_ components: DateComponents?, now: Date, zone: TimeZone = .autoupdatingCurrent) -> ReminderDeadline? {
    guard let components = components, let year = components.year, let month = components.month, let day = components.day else { return nil }
    var local = Calendar(identifier: .gregorian); local.timeZone = zone
    let allDay = components.hour == nil && components.minute == nil && components.second == nil
    var calendar = components.calendar ?? local
    calendar.timeZone = allDay ? zone : (components.timeZone ?? zone)
    var due = components; due.calendar = calendar; due.timeZone = calendar.timeZone
    if allDay { due.hour = 0; due.minute = 0; due.second = 0 }
    guard let date = calendar.date(from: due) else { return nil }
    let checked = calendar.dateComponents([.year, .month, .day], from: date)
    guard checked.year == year && checked.month == month && checked.day == day else { return nil }
    let today = local.startOfDay(for: now)
    guard let tomorrow = local.date(byAdding: .day, value: 1, to: today), date < tomorrow else { return nil }
    return ReminderDeadline(date: date, isAllDay: allDay, isOverdue: allDay ? date < today : date < now,
        day: String(format: "%04d-%02d-%02d", year, month, day))
}

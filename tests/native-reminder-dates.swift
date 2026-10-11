import Foundation
func local(_ text: String, _ zone: TimeZone) -> Date {
    let format = DateFormatter(); format.locale = Locale(identifier: "en_US_POSIX"); format.timeZone = zone; format.dateFormat = "yyyy-MM-dd HH:mm:ss"
    return format.date(from: text)!
}
func parts(_ y:Int, _ m:Int, _ d:Int, _ h:Int? = nil, _ minute:Int? = nil, _ zone:TimeZone? = nil) -> DateComponents {
    var value = DateComponents(); value.year=y; value.month=m; value.day=d; value.hour=h; value.minute=minute; value.timeZone=zone; return value
}
@main struct Tests {
    static func main() {
        let zone = TimeZone(identifier: "America/New_York")!
        let now = local("2026-03-08 12:00:00", zone)
        assert(reminderDeadline(parts(2026,3,8),now:now,zone:zone)!.isOverdue == false)
        assert(reminderDeadline(parts(2026,3,7),now:now,zone:zone)!.isOverdue)
        assert(reminderDeadline(parts(2026,3,9),now:now,zone:zone) == nil)
        assert(reminderDeadline(nil,now:now,zone:zone) == nil)
        assert(reminderDeadline(parts(2026,2,30),now:now,zone:zone) == nil)
        assert(reminderDeadline(parts(2026,3,8,11,0),now:now,zone:zone)!.isOverdue)
        assert(!reminderDeadline(parts(2026,3,8,13,0),now:now,zone:zone)!.isOverdue)
        assert(!reminderDeadline(parts(2026,3,8,12,0),now:now,zone:zone)!.isOverdue)
        let midnight = local("2026-03-09 00:00:00", zone)
        assert(reminderDeadline(parts(2026,3,8),now:midnight,zone:zone)!.isOverdue)
        let autumn = local("2026-11-01 23:59:59", zone)
        assert(!reminderDeadline(parts(2026,11,1),now:autumn,zone:zone)!.isOverdue)
        assert(reminderDeadline(parts(2026,11,2),now:autumn,zone:zone) == nil)
        let leap = local("2024-02-29 12:00:00", zone)
        assert(!reminderDeadline(parts(2024,2,29),now:leap,zone:zone)!.isOverdue)
        let year = local("2026-12-31 23:59:59", zone)
        assert(reminderDeadline(parts(2027,1,1),now:year,zone:zone) == nil)
        // The actual due time's zone is respected; date-only remains a local day.
        let seoul = TimeZone(identifier:"Asia/Seoul")!
        assert(reminderDeadline(parts(2026,3,9,0,0,seoul),now:now,zone:zone)!.isOverdue)
        assert(!reminderDeadline(parts(2026,3,8,nil,nil,seoul),now:now,zone:zone)!.isOverdue)
        print("PASS Swift Reminders deadlines: 15 assertions, local days/DST/midnight/leap/zone")
    }
}

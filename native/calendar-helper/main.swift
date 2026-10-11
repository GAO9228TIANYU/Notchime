import Foundation
import EventKit
import AppKit
import CryptoKit

// Calendar is read-only. The only write path completes a non-recurring EKReminder.
final class CalendarReader {
    let store = EKEventStore()
    let iso = ISO8601DateFormatter()
    var observer: NSObjectProtocol?
    var requesting = false
    var requestingReminders = false
    var issuedReminders: [String: (token: String, expires: Date)] = [:]
    var clockObservers: [NSObjectProtocol] = []
    init() {
        observer = NotificationCenter.default.addObserver(forName: .EKEventStoreChanged, object: store, queue: .main) { _ in
            self.issuedReminders.removeAll()
            self.emit(["type": "changed"])
        }
        for name in [Notification.Name.NSSystemTimeZoneDidChange, .NSSystemClockDidChange, .NSCalendarDayChanged] {
            clockObservers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { _ in
                self.issuedReminders.removeAll()
            self.emit(["type": "changed"])
            })
        }
    }
    func emit(_ object: [String: Any]) {
        do {
            let data = try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
            FileHandle.standardOutput.write(data + Data([10]))
        } catch { FileHandle.standardError.write(Data("JSON encoding failed\n".utf8)) }
    }
    func status() -> String {
        let value = EKEventStore.authorizationStatus(for: .event)
        if #available(macOS 14.0, *) {
            if value == .fullAccess { return "authorized" }
            if value == .writeOnly { return "writeOnly" }
        } else if value == .authorized { return "authorized" }
        switch value {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        default: return "denied"
        }
    }
    func color(_ calendar: EKCalendar) -> String {
        guard let cgColor = calendar.cgColor, let value = NSColor(cgColor: cgColor)?.usingColorSpace(.deviceRGB) else { return "#438CFF" }
        return String(format: "#%02X%02X%02X", Int(value.redComponent * 255), Int(value.greenComponent * 255), Int(value.blueComponent * 255))
    }
    func dateKey(_ date: Date) -> String {
        let parts = Calendar.autoupdatingCurrent.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    func reminderStatus() -> String {
        let value = EKEventStore.authorizationStatus(for: .reminder)
        if #available(macOS 14.0, *) { if value == .fullAccess { return "authorized" } }
        else if value == .authorized { return "authorized" }
        switch value {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        default: return "denied"
        }
    }
    func reminderToken(_ reminder: EKReminder) -> String {
        // In-memory revision check, never persisted or logged; no title-based identity lookup.
        let identity = "\(reminder.calendarItemIdentifier)|\(reminder.calendar?.calendarIdentifier ?? "")|\(reminder.dueDateComponents?.description ?? "")|\(reminder.lastModifiedDate?.timeIntervalSince1970 ?? 0)|\(reminder.title ?? "")"
        return SHA256.hash(data: Data(identity.utf8)).map { String(format: "%02x", $0) }.joined()
    }
    func fetchIncomplete(_ reply: @escaping ([String: Any]) -> Void) {
        guard reminderStatus() == "authorized" else {
            issuedReminders.removeAll(); reply(["authorization": reminderStatus(), "items": []]); return
        }
        let now = Date()
        let tomorrow = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: Calendar.autoupdatingCurrent.startOfDay(for: now))!
        let predicate = store.predicateForIncompleteReminders(withDueDateStarting: nil, ending: tomorrow, calendars: nil)
        store.fetchReminders(matching: predicate) { reminders in DispatchQueue.main.async {
            self.issuedReminders.removeAll()
            guard self.reminderStatus() == "authorized" else { reply(["authorization": self.reminderStatus(), "items": []]); return }
            guard let reminders = reminders else { reply(["authorization": "error", "items": [], "error": "无法读取提醒事项，请重新加载。"]); return }
            let items: [[String: Any]] = reminders.compactMap { reminder in
                guard !reminder.isCompleted, let calendar = reminder.calendar, let deadline = reminderDeadline(reminder.dueDateComponents, now: Date()) else { return nil }
                let id = reminder.calendarItemIdentifier
                let token = self.reminderToken(reminder)
                let recurring = reminder.hasRecurrenceRules
                let canComplete = !recurring && calendar.allowsContentModifications
                self.issuedReminders[id] = (token, Date().addingTimeInterval(300))
                return ["id": id, "title": reminder.title?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? reminder.title! : "无标题待办",
                    "dueDate": deadline.isAllDay ? deadline.day : self.iso.string(from: deadline.date),
                    "isAllDay": deadline.isAllDay, "isOverdue": deadline.isOverdue, "isCompleted": false,
                    "listName": calendar.title, "listColor": self.color(calendar),
                    "canComplete": canComplete, "completionBlockedReason": recurring ? "重复提醒事项请在 Apple Reminders 中完成，以保护重复系列。" : (canComplete ? "" : "此清单不允许修改。"),
                    "revision": token]
            }
            reply(["authorization": "authorized", "items": items, "timeZone": TimeZone.autoupdatingCurrent.identifier])
        } }
    }
    func handle(_ request: [String: Any]) {
        guard let id = request["requestId"] as? String, id.count <= 80, let action = request["action"] as? String else { return }
        func reply(_ data: [String: Any]) { emit(["requestId": id, "ok": true, "data": data]) }
        func fail(_ code: String, _ message: String) { emit(["requestId": id, "ok": false, "error": code, "message": message]) }
        switch action {
        case "status": reply(["authorization": status(), "timeZone": TimeZone.autoupdatingCurrent.identifier])
        case "requestAccess":
            if status() != "notDetermined" && status() != "writeOnly" { reply(["authorization": status()]); return }
            if requesting || requestingReminders { fail("busy", "日历授权正在等待用户操作。"); return }
            requesting = true
            let completion: (Bool, Error?) -> Void = { _, error in DispatchQueue.main.async {
                self.requesting = false
                if let error = error { fail("authorization_failed", error.localizedDescription) }
                else { self.store.reset(); reply(["authorization": self.status()]) }
            } }
            if #available(macOS 14.0, *) { store.requestFullAccessToEvents(completion: completion) }
            else { store.requestAccess(to: .event, completion: completion) }
        case "snapshot":
            let permission = status()
            guard permission == "authorized" else { reply(["authorization": permission, "calendars": [], "events": []]); return }
            guard let startString = request["start"] as? String, let endString = request["end"] as? String,
                  let start = iso.date(from: startString), let end = iso.date(from: endString), end > start,
                  end.timeIntervalSince(start) <= 9 * 86400,
                  let ids = request["calendarIds"] as? [String], ids.count <= 1000 else {
                fail("invalid_request", "无效的查询范围。"); return
            }
            // An empty selection means no events, never EventKit's nil (= all calendars).
            let calendars = store.calendars(for: .event)
            let selected = calendars.filter { ids.contains($0.calendarIdentifier) }
            let calendarData: [[String: Any]] = calendars.map { calendar in
                ["id": calendar.calendarIdentifier, "name": calendar.title, "color": color(calendar),
                 "source": ["id": calendar.source.sourceIdentifier, "name": calendar.source.title, "type": calendar.source.sourceType.rawValue]]
            }.sorted { ($0["name"] as! String) < ($1["name"] as! String) }
            var items: [[String: Any]] = []
            if !selected.isEmpty {
                let predicate = store.predicateForEvents(withStart: start, end: end, calendars: selected)
                // EventKit expands recurring occurrences and exceptions within this bounded range.
                items = store.events(matching: predicate).compactMap { event in
                    guard let begin = event.startDate, let finish = event.endDate, finish > start, begin < end else { return nil }
                    guard let calendar = event.calendar else { return nil }
                    let identifier = event.eventIdentifier ?? event.calendarItemIdentifier
                    let occurrence = event.occurrenceDate ?? begin
                    let identity = "\(calendar.calendarIdentifier)|\(identifier)|\(iso.string(from: occurrence))|\(iso.string(from: begin))"
                    let instance = SHA256.hash(data: Data(identity.utf8)).map { String(format: "%02x", $0) }.joined()
                    return ["id": instance, "eventIdentifier": identifier, "externalIdentifier": event.calendarItemExternalIdentifier ?? "",
                            "occurrenceStart": iso.string(from: occurrence), "title": event.title?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? event.title! : "无标题日程",
                            "start": iso.string(from: begin), "end": iso.string(from: finish), "allDay": event.isAllDay,
                            "startDate": dateKey(begin), "endDate": dateKey(finish), "timeZone": event.timeZone?.identifier ?? TimeZone.autoupdatingCurrent.identifier,
                            "calendar": ["id": calendar.calendarIdentifier, "name": calendar.title, "color": color(calendar)]]
                }
            }
            reply(["authorization": permission, "calendars": calendarData, "events": items, "timeZone": TimeZone.autoupdatingCurrent.identifier])
        case "remindersStatus": reply(["authorization": reminderStatus()])
        case "requestRemindersAccess":
            if reminderStatus() != "notDetermined" { reply(["authorization": reminderStatus()]); return }
            if requestingReminders || requesting { fail("busy", "系统授权正在等待用户操作。"); return }
            requestingReminders = true
            let completion: (Bool, Error?) -> Void = { _, error in DispatchQueue.main.async {
                self.requestingReminders = false
                if error != nil { fail("authorization_failed", "提醒事项授权失败，请重试。") }
                else { self.store.reset(); self.issuedReminders.removeAll(); reply(["authorization": self.reminderStatus()]) }
            } }
            if #available(macOS 14.0, *) { store.requestFullAccessToReminders(completion: completion) }
            else { store.requestAccess(to: .reminder, completion: completion) }
        case "remindersSnapshot": fetchIncomplete(reply)
        case "completeReminder":
            guard reminderStatus() == "authorized" else { issuedReminders.removeAll(); fail("permission_denied", "没有提醒事项访问权限。"); return }
            guard Set(request.keys) == Set(["requestId", "action", "id", "revision"]),
                  let reminderID = request["id"] as? String, !reminderID.isEmpty, reminderID.count <= 512,
                  let revision = request["revision"] as? String,
                  let issued = issuedReminders[reminderID], issued.expires > Date(), issued.token == revision,
                  let reminder = store.calendarItem(withIdentifier: reminderID) as? EKReminder,
                  !reminder.hasChanges, reminder.refresh(), let calendar = reminder.calendar,
                  reminder.calendarItemIdentifier == reminderID, !reminder.isCompleted,
                  reminderToken(reminder) == revision,
                  reminderDeadline(reminder.dueDateComponents, now: Date()) != nil else {
                fail("stale_reminder", "待办已发生变化或不可用，请刷新后重试。"); return
            }
            guard !reminder.hasRecurrenceRules, calendar.allowsContentModifications else {
                fail("completion_not_supported", "请在 Apple Reminders 中完成此重复事项或只读清单事项。"); return
            }
            issuedReminders.removeValue(forKey: reminderID) // consume before save; duplicate requests cannot write twice.
            reminder.isCompleted = true // EventKit sets completionDate; no other property is assigned.
            do { try store.save(reminder, commit: true); reply(["completed": true]) }
            catch { store.reset(); issuedReminders.removeAll(); fail("save_failed", "无法保存完成状态，请刷新后重试。") }
        case "shutdown": exit(0)
        default: fail("unknown_action", "不支持的读取操作。")
        }
    }
}
NSApplication.shared.setActivationPolicy(.accessory)
let reader = CalendarReader()
// Bounded JSONL stdin. stdout is exclusively protocol output, diagnostics use stderr.
DispatchQueue.global(qos: .userInitiated).async {
    var buffer = Data()
    while true {
        let chunk = FileHandle.standardInput.availableData
        if chunk.isEmpty { exit(0) }
        buffer.append(chunk)
        if buffer.count > 1_048_576 { exit(2) }
        while let boundary = buffer.firstIndex(of: 10) {
            let line = buffer.prefix(upTo: boundary)
            buffer.removeSubrange(...boundary)
            if let object = try? JSONSerialization.jsonObject(with: line) as? [String: Any] {
                DispatchQueue.main.async { reader.handle(object) }
            } else { FileHandle.standardError.write(Data("Invalid protocol JSON\n".utf8)); exit(2) }
        }
    }
}
RunLoop.main.run()

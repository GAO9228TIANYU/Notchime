<div align="center">
  <img src="docs/assets/notchime-icon.png" width="112" height="112" alt="Notchime's neon glass reminder bell icon" />
  <h1>Notchime</h1>
  <p><strong>There When You Need It. Quiet When You Don't.</strong></p>
  <p><strong>Your Apple day, right in your MacBook notch.</strong><br />
  A privacy-first macOS notch companion for Apple Calendar, Reminders, and Countdown.</p>
  <p><strong>English</strong> · <a href="README.zh-CN.md">简体中文</a></p>
  <img src="docs/assets/platform-badges.svg" width="508" alt="macOS · Apple Silicon · MIT source · Local-first" />
  <p><a href="#your-day-at-a-glance">Explore</a> · <a href="#get-started">Download &amp; install</a> · <a href="docs/PRIVACY.md">Privacy</a> · <a href="#faq">FAQ</a></p>
</div>

![Notchime's actual dashboard, showing a local countdown, today's Calendar event and an Apple Reminders item](docs/assets/notchime-dashboard.png)

*Actual development interface with fictional test data. The current app UI is Chinese; this English README does not imply an English interface or a published release.*

## Your day, at a glance

Check your next meeting. Finish a reminder. Keep an important date in view. Notchime brings these small moments together at the top of your Mac, then gets out of the way.

| Calendar | Reminders | Countdown | Smart Notch |
|---|---|---|---|
| Today, what's next, and the next seven days. | Today's and overdue tasks, with a quick completion action. | Important dates, saved on this Mac. | A timely glance, with hover protection and manual control. |

### See it in ten seconds

[![Watch the Notchime product film: actual app UI presented inside an illustrated MacBook frame](docs/assets/notchime-film-poster.png)](docs/assets/notchime-trailer-10s.mp4)

**[Watch or download the film](docs/assets/notchime-trailer-10s.mp4)** · 9.6 seconds · 1080p · sound

The film uses actual Mac app captures with fictional data and illustrative iPhone/device animation. It is a product presentation, not a recorded iCloud synchronization test. Smart Notch footage is edited for pacing, not a real-time demonstration of its four-second timer. GitHub may open a file page or download the MP4; this README does not rely on inline video autoplay.

## One Apple Ecosystem. One Seamless Workflow.

Plan an event or add a reminder on your iPhone. Once your Apple system account syncs it to the Mac, Notchime reads it locally through EventKit. Complete a supported reminder in Notchime, and Apple handles the onward sync.

```mermaid
flowchart TD
  Phone["iPhone Calendar / Reminders"] <-->|"Apple system account sync, such as iCloud"| Mac["macOS Calendar / Reminders database"]
  Mac -->|"Local EventKit access"| App["Notchime on your Mac"]
  App -->|"Complete a supported reminder only"| Mac
```

**No duplicate entry. No separate task database.**

Notchime does not connect directly to your iPhone or run its own iCloud service. Your accounts, macOS and network conditions determine sync timing; there is no fixed latency guarantee.

## A place for the things that matter

### Apple Calendar — know what's next

See today's schedule, the next ongoing or upcoming timed event, and the next seven days. Choose which calendars to display, keep their system colors, and view all-day, cross-day and recurring event instances.

![Today's Calendar event, rendered by the actual Notchime interface using fictional data](docs/assets/calendar-preview.png)

**Calendar is read-only in Notchime's application behavior.** Create, edit and delete events in Apple Calendar.

### Apple Reminders — clear a little space in your day

Today's due and overdue incomplete reminders appear alongside today's schedule. Click the circle to complete a supported item; Notchime confirms the EventKit write before refreshing the list.

![The actual today's reminders area and completion circle, using a fictional reminder](docs/assets/reminders-preview.png)

No-due-date and future-due reminders are outside this list. Recurring reminders and items in read-only lists remain visible when due, but must be completed in Apple Reminders. Notchime does not create, edit, delete or reopen reminders, or manage lists.

### Countdown — keep your milestones close

Create, edit, delete and pin local countdowns, with a date, optional time and color. Date-only countdowns follow local calendar days; timed countdowns use the local time zone. Your countdowns persist across restarts, independently of Calendar and Reminders.

![A pinned local countdown with its target date and management controls, using fictional data](docs/assets/countdown-preview.png)

**Countdowns stay on this Mac.** They do not sync to iPhone or iCloud. Dates shown in the screenshots are fictional examples, not a release schedule.

### Smart Notch — a glance when it helps

A brief overview appears on startup, wake or unlock. Selected, non-all-day events can bring up a visual reminder **5, 10 or 15 minutes** before their start; the default is 10 minutes, and reminders can be turned off.

![The actual upcoming-event banner in Notchime, using a fictional event](docs/assets/smart-notch-preview.png)

Automatic reveals stay open for about **four seconds** by default; Settings allows 1–60 seconds. Hovering pauses the timer, and leaving starts a full interval again. Intentional interaction hands control to you. A manually opened panel is not closed by the automatic timer, and an automatic reveal does not switch away from your Settings or Countdown form.

These are notch visual reminders, without Notification Center messages, sound or Dock bouncing. Wake/unlock behavior has user acceptance on the development machine; macOS 13/14 and the final distributed app still need device validation.

## Your Schedule. Your Data. Your Privacy.

- **No Notchime accounts.** Use the accounts already configured in macOS.
- **No custom sync servers.** Calendar and Reminders synchronization belongs to Apple/system account services.
- **No tracking or analytics in the current application code.**
- **Local-first by design.** Countdown and preferences are saved locally; system events and reminders are not copied into a second task database.
- **Limited application operations.** Calendar reads only; completing a supported reminder is the only reminder write operation.
- **No application feature uploads personal Calendar or Reminders content to a Notchime server.**

On macOS 14+, reading Calendar requires system **Full Access**, and Reminders also uses **Full Access**. Notchime limits what its code does; macOS does not grant it a special “read-only” or “complete-only” permission. Apple account sync, dependency downloads and OS/framework diagnostics are separate from these application claims.

Read the [privacy notice](docs/PRIVACY.md) for data fields, local storage, permission revocation and audit limits. The [security audit](docs/phase5a-privacy-security-audit.md) and [code review](docs/phase5b-final-code-review.md) document evidence and unresolved release checks, rather than promising absolute security.

## Get started

### Download Notchime 1.0.0 — test Release Candidate

**[Download the Apple Silicon DMG from Google Drive](https://drive.google.com/file/d/1JIidJ8UssXWtGOK3YWHOgUAH_S-Ndok2/view?usp=sharing)**

Package: **`Notchime-1.0.0-arm64.dmg`** · approximately **125 MB** · macOS **13+**, **Apple Silicon**. macOS 13/14 device behavior has not yet been verified; Intel Macs are not supported by this package.

This is a test RC with **ad-hoc signing**, not a Developer ID-signed or Apple-notarized release. The local package passed isolated startup and functional checks; Gatekeeper assessment rejected it. Downloaded-file and Applications installation acceptance are still pending. See the [RC report](docs/release/notchime-v1.0.0-release-report.md) for the exact verification scope.

### Install and launch

1. Open the Google Drive link and use its **Download** button to save the DMG. You do not need Node.js or Xcode to run the packaged app.
2. Double-click the DMG, then drag **Notchime.app** onto the **Applications** shortcut. If a copy already exists, back it up before deciding whether to replace it.
3. Open **Applications → Notchime**. The app appears as a small bar at the top of your screen; click it to expand the dashboard. It normally has no Dock icon.
4. If macOS says the developer cannot be verified or Apple cannot check the app, only proceed if you trust the source and have verified the file. After trying to open it, go to **System Settings → Privacy & Security → Open Anyway**, then confirm **Open**, if macOS offers that option. This creates an exception for this app; it is not notarization. Follow [Apple's guidance](https://support.apple.com/en-us/102445). Do not disable Gatekeeper or remove quarantine attributes with terminal commands. If the warning says the app is damaged or will harm your computer, stop and report it instead.
5. Once the installed app is running, eject the DMG. For optional startup at login, enable **开机自动启动** in Notchime's **设置** page after installing in Applications.

<details>
<summary>Check the downloaded file (optional)</summary>

The previously validated local RC has this SHA-256. The Google Drive copy has not been downloaded and independently checked in this documentation update:

```text
aed32944bd98885fbf5a779f9a51d0c75558e729ae91eb49c5b9958a8715579a
```

Run `shasum -a 256` followed by the downloaded DMG's path in Terminal. A matching hash confirms that the bytes match the tested local RC; it does not prove Apple notarization. Do not run a mismatching file until its origin/version has been checked.

</details>

### Grant Calendar and Reminders access

The current app interface is Chinese. Calendar and Reminders permissions are separate; grant each through the corresponding button:

1. **Calendar:** expand the top bar → **设置 → 日历 → 允许读取日历** (Settings → Calendar → Allow Calendar access). Personally approve the macOS prompt, then select the calendars you want displayed.
2. **Reminders:** open **日程**, find **今天的日程 → 今日待办**, and click **允许访问提醒事项** (Allow Reminders access). Personally approve the separate prompt. Notchime shows incomplete reminders due today or overdue; future-due and undated reminders are excluded.
3. **No prompt or access previously denied?** Open **System Settings → Privacy & Security → Calendars / Reminders** and check the **Notchime** entry for each permission. Return to the app and click **重新加载** or **重新加载待办**. If access is already granted, macOS may not prompt again. Restrictions set by a managed Mac must be handled by its administrator; do not reset the permission database.

On macOS 14+, both use system **Full Access**. Notchime's Calendar code only reads events; the only supported Reminder write is your explicit completion of a current, non-recurring item in a writable list. Declining either permission leaves local Countdown available; declining Reminders does not disable Calendar. No camera, microphone or screen-recording permission is needed.

The release identity is `com.notchime.app`, with an independent Notchime data directory. Old development permissions/data are not automatically migrated or deleted. Countdowns stay on this Mac. Apple account services handle iPhone/Mac sync; if data is missing, check that it is already visible in the Mac's Calendar or Reminders app. Sync has no fixed latency guarantee.

### Alternative — run from source

With Node.js and Apple's Xcode Command Line Tools installed, open a terminal in a trusted copy of the project root:

```sh
npm ci
npm start
```

`npm ci` installs the locked development dependencies and downloads Electron. `npm start` first compiles and **ad-hoc signs the local Swift Helper** when needed, then launches Electron; it does not install the app in Applications. Inspect the scripts before running them, and resolve compilation/signature failures rather than bypassing verification. Source mode does not register the generic Electron app as a login item.

## System requirements

| Item | Current evidence |
|---|---|
| Platform | macOS only; designed around the MacBook notch. |
| Architecture | Apple Silicon / arm64 configured and tested. Intel builds are not provided or verified. |
| Minimum configured target | macOS 13.0+, in the Builder configuration and Swift compilation target. |
| Actually tested environment | Apple Silicon, macOS 27.0; Node 22.22.0, npm 10.9.4, Swift 6.1.2 and Electron 44.0.0. macOS 13/14 device behavior is not verified. |
| Development tools | Node.js **22.12.0+**, npm (no separate minimum is declared), and Xcode Command Line Tools with Swift and the macOS SDK. |
| Displays without a notch | Code positions the panel using display/menu-bar geometry and a fallback height. A physical notch is not a code requirement; final non-notch/external-display acceptance is still pending. |

## Development and architecture

**Electron-powered macOS app with native Swift EventKit integration.** Electron owns the local interface and window lifecycle; EventKit gives the Helper access to the Mac's existing system calendars and reminders, without another sync service.

```mermaid
flowchart TD
  UI["Local HTML / CSS / JavaScript Renderer"] <--> P["Restricted Preload APIs"]
  P <--> M["Electron Main"]
  M <--> H["Swift EventKit Helper · bounded JSON Lines"]
  H <--> S["macOS Calendar / Reminders"]
  M --> L["Local Countdown / settings / reminder deduplication metadata"]
```

Calendar writes are absent by design. The only Reminders write is a validated completion request. Countdown storage is separate from system data. See [CONTRIBUTING](CONTRIBUTING.md) for the module map and safe test workflow.

```sh
npm run test:unit
npm test
```

`npm test` runs unit tests, JavaScript syntax checks, isolated Fixture Electron scenarios and source startup without the signing prestart script. The pure Swift date tests compile a test executable in the project's test cache. GUI checks require a usable macOS desktop. These tests do not prove real iCloud sync or final package signing.

<details>
<summary>Packaging commands and their current limitations</summary>

| Script | Actual behavior |
|---|---|
| `npm run native:build` | Compile and ad-hoc sign a changed Helper; verify the new build strictly, or reuse the unchanged cache. |
| `npm run pack` | Build an unpacked app through electron-builder. |
| `npm run build:zip` | Build a macOS ZIP. |
| `npm run build` | Build an arm64 macOS DMG with publishing disabled. |

All packaging scripts first run the Helper build and then the existing afterPack ad-hoc signing hook, including final strict/deep signature verification. Outputs target `dist.noindex`. File Provider may reattach Finder metadata on Desktop outputs; the RC uses a project-local APFS build volume and retains strict validation. Developer ID signing/notarization and final user installation acceptance remain separate release gates.

</details>

## FAQ

**Does Notchime require an account?**  
No Notchime account. Your existing Apple/system account is what syncs Calendar and Reminders.

**Does it upload my Calendar or Reminders?**  
The current application has no feature for uploading personal event or task content to a Notchime server. Apple/system synchronization and OS diagnostics have their own behavior; see [Privacy](docs/PRIVACY.md).

**Does it sync directly with my iPhone?**  
No. Apple system accounts sync to the Mac; Notchime then reads the local EventKit store. Completion changes follow the same system sync path back.

**Can I edit Calendar events or complete every reminder?**  
Calendar is read-only. Only current, due/overdue, non-recurring reminders in writable lists can be completed. Use Apple Reminders for recurring or read-only items and for other task management.

**Do Countdowns sync across devices?**  
No. They are independent local records on this Mac.

**Does it support Windows, Linux or Intel Macs?**  
Windows/Linux are out of scope. Intel has no verified build or acceptance coverage.

**Is it a fully native Swift application?**  
No. The app uses Electron with a native Swift EventKit Helper.

**What permissions are required?**  
Separate Calendar and Reminders access, only when you choose to grant them. On macOS 14+ these are Full Access; the application's operations remain limited. Camera, microphone, screen-recording and accessibility access are not requested for the current core features.

**Is the downloadable DMG an official notarized release?**  
No. The linked 1.0.0 DMG is a test RC with ad-hoc signing. Developer ID signing, Apple notarization, public artwork redistribution rights and final installation/device acceptance remain release gates; see the [RC report](docs/release/notchime-v1.0.0-release-report.md).

## Contributing and security

Bug reports and focused improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md); use fictional or redacted data in any report. Do not publish account addresses, private schedules or reminder lists.

Report vulnerabilities privately to **[tianyu.gaospk@gmail.com](mailto:tianyu.gaospk@gmail.com)**. See [SECURITY.md](SECURITY.md). No guaranteed response SLA or encrypted email channel is implied.

## License and acknowledgments

Maintained by **GAO TIANYU** · [GitHub](https://github.com/GAO9228TIANYU) · [Contact](mailto:tianyu.gaospk@gmail.com).

Notchime evolved from [TO-DO Panel v1.2.0](https://github.com/xiaopu-ai/TO-DO-Panel/tree/v1.2.0), by xiaopu-ai and contributors. The original MIT copyright, permission and disclaimer remain in [LICENSE](LICENSE); see [NOTICE](NOTICE) and [third-party attribution](THIRD_PARTY_NOTICES.md). Third-party code and artwork retain their respective rights. The supplied icon's public redistribution rights still require maintainer confirmation before publication; the source MIT license does not automatically relicense media.

Apple, iPhone, MacBook, Calendar and Reminders are referenced to describe compatibility, without implying Apple sponsorship or endorsement.

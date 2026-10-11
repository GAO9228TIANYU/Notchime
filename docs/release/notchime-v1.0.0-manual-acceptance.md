# Notchime 1.0.0 RC — 人工安装验收

本地候选包：`Notchime-1.0.0-arm64.dmg`。使用 ad-hoc 签名，不是 Developer ID 或 Apple 公证版本；不得关闭 Gatekeeper、重置 TCC 或移除系统安全保护来制造验收通过。

## 本轮自动验证与人工验证的边界

自动测试使用项目隔离目录及合成数据；真实读取只记录权限状态和数量。本轮不自动安装到 Applications、不登记真实登录项、不导入真实旧数据、不完成真实待办。最终自动结果见[交付报告](notchime-v1.0.0-release-report.md)。

## 最短验收清单

1. 退出旧开发版和测试窗口。挂载最终 DMG，确认 **Notchime.app**、图标和 Applications 入口。若 Applications 已有 Notchime，先备份并确认覆盖策略，不能直接覆盖。
2. 经你确认后拖入 Applications，再从该位置正常启动。若系统拒绝，保留提示并停止；不把隔离目录启动成功当作 Gatekeeper 下载验收。
3. 在“设置 → 日历”和“日程 → 今日待办”分别亲自授权。新 Bundle ID 为 `com.notchime.app`，不会继承或重置旧开发版授权。确认无摄像头、麦克风、蓝牙等请求；拒绝任一权限时 Countdown 仍应可用。
4. 确认真实今日日程、下一项、未来7天、日历选择。用你自行创建的测试日程验证 Mac/iPhone 新增、修改、删除同步；同步延迟由系统账户决定。
5. 在 Apple Reminders 自行准备一条今天到期、非重复、可写清单的测试事项，亲自点击 Notchime 左侧圆圈；确认 Mac 和 iPhone 完成状态。再检查同名任务不误完成，重复/只读事项没有完成入口。
6. 创建一个专用测试 Countdown，编辑时间、置顶、退出重启确认恢复，再确认删除；不删除已有真实记录。
7. 启动自动概览约4秒后收起；手动展开超过4秒保持展开。悬停暂停，移开重新计时；Settings/Countdown 表单不会被抢走。检查 Escape、手动失焦、快速开合。
8. 实际合盖/唤醒、锁屏/解锁分别确认只出现一次；在 Apple Calendar 自行设置未来事件，测试5/10/15分钟提醒与关闭提醒。
9. 如有外接屏，测试连接、断开、分辨率和 Spaces/全屏应用。确认“关于”、菜单及系统显示名称为 Notchime 1.0.0 / GAO TIANYU。
10. 登录项仅在你确认后，在正式安装位置启用并测试真实注销登录。旧开发版登录项不自动删除，应由你检查是否仍存在。

## 旧开发数据安全导入（可选，需另行确认）

正式目录默认 `~/Library/Application Support/Notchime`；旧 `Calendar Notch Dev` 数据留在原处。本轮没有访问或迁移真实用户目录。新身份首次运行为空并不表示旧数据被删除。

没有可信方法仅凭目录名称认定它一定属于旧开发版，因此不自动探测。只有你确认来源后才使用 `scripts/import-development-profile.js`：

- 先关闭新旧应用，并准备可信的旧开发 profile **备份副本**。工具本身不负责备份。
- 目标目录必须不存在。已经启动产生正式数据时拒绝导入，不合并、不覆盖；不要为导入而删除该目录，先另行制定备份/合并方案。
- 只复制 `countdowns.json`、`app-settings.json`、`calendar-preferences.json`、`calendar-reminder-receipts.json`。保留有效未知/窗口偏好字段，拒绝损坏JSON、未知schema、符号链接及超限文件。
- 不复制 Chromium缓存、日志、TCC、登录项、workspace、旧任务数据库或凭据。不会把 Calendar/Reminders 正文建成本地数据库。
- 原文件不改；失败保留原始和经过验证的 staging 副本，输出恢复目录。重复导入不覆盖已修改的正式偏好；目标冲突直接拒绝。
- 导入需新旧应用均关闭，不能将它当作运行中的热合并工具。Calendar IDs 不再有效时在界面重新勾选，不根据日历名称猜测。
- 导入生成首次运行标记，防止仅因导入自动登记登录项；登录项由你在正式应用中主动启用。

以下只是参数形式，不是本轮真实迁移授权；路径须在备份/冲突核验后由你明确指定：

```sh
node scripts/import-development-profile.js --source '/confirmed/backup/profile' --destination '/confirmed/nonexistent/Notchime' --confirm-development-profile
```

## 公开分发前

完成 Developer ID 签名与 Apple 公证（涉及账号需你批准）、图标公开再分发权确认，以及真实 Applications/新用户/下载 quarantine 验收。macOS13/14、Intel和其他设备不得因编译目标或Fixture通过而标记真机通过。

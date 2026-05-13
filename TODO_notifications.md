# TODO - Notice/Complaint Alerts

## 1) Add realtime “new item” detection
- Track previous counts/last known IDs for `notices` and `complaints` in `public/js/main.js`.
✅ Completed (toast trigger + dedupe implemented)



## 2) Trigger in-app alerts
- When a new notice/complaint is detected, call `showToast()` with a short message.

## 3) Dedupe
- Prevent repeated toasts for the same item across listener updates/refreshes.

## 4) Test
- Open 2 browser sessions, log in as different users.
- Publish a notice and submit a complaint; confirm both sessions get toasts.


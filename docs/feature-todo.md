# FlowLog Feature Todo

This document tracks requested product features that are not yet implemented in the current MVP.

## Status Legend

- `- [ ]` Planned or not started
- `- [x]` Implemented and documented

## Planned

- [ ] Keep screen awake toggle

  Add a manual user-controlled toggle in the focus UI that asks the browser to keep the device screen awake while the setting is enabled.

  Intended behavior:

  - The toggle is global and manual, not limited to an active focus session.
  - The preference is stored locally in the browser on the current device only.
  - The web app uses the browser Screen Wake Lock API when available.
  - If the browser or device does not support wake lock, or the request is rejected, the UI must show that the feature is unavailable or inactive.
  - If the user keeps the setting enabled, the app should attempt to re-acquire the wake lock after visibility changes when the browser allows it.

  Acceptance criteria:

  - The user can enable and disable the setting from the focus UI.
  - Reloading the app on the same device preserves the preference.
  - Opening the app on another device does not inherit the preference.
  - On supported browsers, enabling the setting keeps the screen awake while the wake lock remains active.
  - On unsupported browsers or failed requests, the UI reports the actual state instead of implying success.

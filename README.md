# Device Pulse Table Card

## README in Progress

This README file is currently a work in progress.
Some sections may be incomplete or subject to change.

---

## Introduction

The **Device Pulse Table Card** is a custom Lovelace card designed to work with the [Device Pulse](https://github.com/studiobts/home-assistant-device-pulse) integration.
It provides a table view of devices monitored through the integration.

---

## Features

- **Real-time Monitoring:** Displays live updates for device connectivity, response times, and error counts using Home Assistant WebSockets.
- **Interactive Table:** Supports sorting by column and filtering by text (Name, Host, or Integration).
- **Flexible Views:** Group devices by Integration or filter by status (All, Connected, or Disconnected).
- **Customizable Columns:** Choose which data to display, including Host, Integration Name, Last Response Time, and Pings Failed.
- **Quick Access:** Click on any device name or status icon to open the standard Home Assistant "more-info" dialog.
- **Visual Feedback:** Highlights changes in values and status updates instantly.

## Configuration via Editor

The card supports visual configuration via the Lovelace UI editor.

| Option | Description |
| :--- | :--- |
| **Card Title** | The title displayed at the top of the card. |
| **Statues to Show** | Default filter for the table (All, Only Connected, or Only Disconnected). |
| **Group-By Integration** | Boolean toggle to group devices by their source integration by default. |
| **Columns** | Multi-select list to choose visible columns (Host, Integration Name, Last Response Time, Pings Failed, Connected/Disconnected Since). |

---

## Installation

<!--
### HACS (Recommended)

1. Add the custom repository `REPO` to HACS.
2. Search for **Device Pulse Table Card** and install it.
3. Add the card to your Lovelace dashboard.
-->

### Manual Installation

1. Download the latest release from [https://github.com/studiobts/device-pulse-table-card/releases](https://github.com/studiobts/device-pulse-table-card/releases).
2. Copy the `device-pulse-table-card.js` and `device-pulse-table-card.css` file to `www/device-pulse-table-card` folder.
3. Add the following resource in your Lovelace configuration:

```yaml
url: /local/device-pulse-table-card/device-pulse-table-card.js
type: module
```

## Usage Notes

- The card requires active Device Pulse integration.
- The card supports automatic updates through the Home Assistant WebSocket connection.


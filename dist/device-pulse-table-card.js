import { LitElement, html, css } from "https://unpkg.com/lit@3.1.2/index.js?module";
import { when } from "https://unpkg.com/lit@3.1.2/directives/when.js?module";
import { cardStyles } from "./device-pulse-table-card-style.js";
const CARD_VERSION = "1.0.3";
class DevicePulseTableCard extends LitElement {
  static properties = {
    _devices: { state: true },
    _sortColumn: { type: String },
    _sortDirection: { type: String },
    _filterText: { type: String },
    _showStatus: { type: String },
    _groupBy: { type: String }
  };
  static styles = cardStyles;
  constructor() {
    super();
    this._hass = null;
    this._initialized = false;
    this._config = {};
    this._devices = {};
    this._unsubscribes = [];
    this._sortColumn = "device_name";
    this._sortDirection = "asc";
    this._filterText = "";
    this._showStatus = "all";
    this._groupBy = "none";
    this._valueChangedCells = /* @__PURE__ */ new Map();
    this._statusChangedRows = /* @__PURE__ */ new Map();
  }
  static getStubConfig() {
    return {
      title: "Monitored Network Devices",
      group_by_integration: false,
      show_status: "all",
      columns: ["host", "integration_name"]
    };
  }
  static getConfigElement() {
    return document.createElement("device-pulse-table-card-editor");
  }
  set hass(hass) {
    if (!this._hass) {
      this._hass = hass;
      this._loadDevices();
      this._subscribeToEvents();
    }
  }
  setConfig(config) {
    this._config = {
      title: config.title || "Monitored Network Devices",
      ...config,
      grid_options: {
        rows: config.grid_options?.rows ?? "auto",
        columns: config.grid_options?.columns ?? "auto",
        ...config.grid_options
      }
    };
    if (this._config.group_by_integration) {
      this._groupBy = "integration_name";
    }
    this._showStatus = this._config.show_status;
  }
  getCardSize() {
    return 4;
  }
  disconnectedCallback() {
    if (this._unsubscribe?.length) {
      this._unsubscribes.forEach((unsub) => unsub());
      this._unsubscribes = [];
    }
    super.disconnectedCallback();
  }
  async _subscribeToEvents() {
    if (!this._hass?.connection || this._unsubscribes?.length) {
      return;
    }
    try {
      this._unsubscribes.push(await this._hass.connection.subscribeEvents((event) => this._handleStateChanged(event), "state_changed"));
    } catch (error) {
      console.error("Unable to subscribe to events:", error);
    }
  }
  async _loadDevices() {
    try {
      const result = await this._hass.callWS({
        type: "device_pulse/get_devices"
      });
      if (result && result.devices) {
        this._initialized = true;
        this._devices = result.devices;
      }
    } catch (error) {
      console.error("Unable to load Device Pulse monitored devices list:", error);
    }
  }
  _handleStateChanged(event) {
    const entityId = event.data.entity_id;
    const entity = this._hass.entities[entityId];
    if (entity && entity.platform === "device_pulse") {
      let device_id = entity.device_id;
      let state = event.data.new_state;
      if (!this._devices[device_id]) {
        console.warn(`Device id [${device_id}] not found`);
        return;
      }
      if (!state) {
        return;
      }
      if (!this._valueChangedCells.has(device_id)) {
        this._valueChangedCells.set(device_id, /* @__PURE__ */ new Set());
      }
      if (["ping_status", "pings_failed_count", "last_response_time"].includes(state.attributes.tag)) {
        let property = state.attributes.tag;
        this._devices = {
          ...this._devices,
          [device_id]: {
            ...this._devices[device_id],
            [property]: {
              ...this._devices[device_id][property],
              state: state.state,
              ...property === "ping_status" ? { pings_failed: state.attributes.pings_failed } : {}
            },
            ...property === "ping_status" ? { ping_status_since_timestamp: state.attributes.state_since } : {}
          }
        };
        if (property === "ping_status") {
          this._statusChangedRows.set(device_id, state.state);
          setTimeout(() => {
            this._statusChangedRows.delete(device_id);
            this.requestUpdate();
          }, 2e3);
        }
        this._valueChangedCells.get(device_id).add(property);
        setTimeout(() => {
          this._valueChangedCells.get(device_id)?.delete(property);
          this.requestUpdate();
        }, 2e3);
      }
    }
  }
  _handleSort(column) {
    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === "asc" ? "desc" : "asc";
    } else {
      this._sortColumn = column;
      this._sortDirection = "asc";
    }
  }
  _handleFilter(e) {
    this._filterText = e.target.value;
  }
  _handleShowStatusChange(e) {
    this._showStatus = e.target.value;
  }
  _handleGroupChange(e) {
    this._groupBy = e.target.value;
  }
  _openEntityDialog(entity_id) {
    const event = new Event("hass-action", {
      bubbles: true,
      composed: true
    });
    event.detail = {
      action: "tap",
      config: {
        entity: entity_id,
        tap_action: {
          action: "more-info"
        }
      }
    };
    this.dispatchEvent(event);
  }
  _getFilteredAndSortedDevices() {
    let devices = Object.values(this._devices);
    if (this._filterText) {
      const filter = this._filterText.toLowerCase();
      devices = devices.filter(
        (d) => d.device_name.toLowerCase().includes(filter) || d.host.toLowerCase().includes(filter) || d.integration_name.toLowerCase().includes(filter)
      );
    }
    if (this._showStatus !== "all") {
      devices = devices.filter((d) => d.ping_status.state === this._showStatus);
    }
    devices.sort((a, b) => {
      const valA = a[this._sortColumn]?.toLowerCase() || "";
      const valB = b[this._sortColumn]?.toLowerCase() || "";
      const cmp = valA.localeCompare(valB);
      return this._sortDirection === "asc" ? cmp : -cmp;
    });
    return devices;
  }
  _groupDevices(devices) {
    if (this._groupBy === "none") {
      return { "": devices };
    }
    const groups = {};
    devices.forEach((device) => {
      const key = device[this._groupBy] || "Unknown";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(device);
    });
    return groups;
  }
  _hasSort(column) {
    return !["ping_status", "last_response_time"].includes(column);
  }
  _getSortIcon(column) {
    if (this._sortColumn !== column) {
      return "";
    }
    return this._sortDirection === "asc" ? "\u2191" : "\u2193";
  }
  _getColumnLabel(column) {
    const labels = {
      device_name: "Name",
      host: "Host",
      integration_name: "Integration",
      ping_status: " ",
      ping_status_since_timestamp: "Since",
      pings_failed_count: "Pings Failed",
      last_response_time: "Last Response Time"
    };
    return labels[column] || column;
  }
  _renderCellValue(device, column) {
    if (column === "device_name") {
      return html`
                <span 
                    class="clickable"
                    @click=${() => this._openEntityDialog(device["ping_status"].entity_id)}
                >
                    ${device[column]}
                </span>
            `;
    }
    if (column === "ping_status") {
      return html`
                <span 
                  @click=${() => this._openEntityDialog(device[column].entity_id)}
                  class="clickable status-indicator status-${device.ping_status.pings_failed && device.ping_status.state === "on" ? "warning" : device.ping_status.state}"
                  title="${device.ping_status.state === "on" ? "Connected" : "Disconnected"}"
                ></span>
            `;
    }
    if (column === "ping_status_since_timestamp" && device[column]) {
      const now = /* @__PURE__ */ new Date();
      const diff = now - new Date(device[column] * 1e3);
      const seconds = Math.floor(diff / 1e3);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      let parts = [];
      if (days) {
        parts.push(`${days}d`);
      }
      const remainingHours = hours % 24;
      if (days || remainingHours) {
        parts.push(`${remainingHours}h`);
      }
      const remainingMinutes = minutes % 60;
      if (days || remainingHours || remainingMinutes) {
        parts.push(`${remainingMinutes}m`);
      }
      const remainingSeconds = seconds % 60;
      parts.push(`${remainingSeconds}s`);
      return html`${parts.join(" ")}`;
    }
    if (["pings_failed_count", "last_response_time"].includes(column)) {
      return !device[column] ? html`<span class="not-available" title="Not Available">n.a.</span>` : html`<span class="clickable" @click=${() => this._openEntityDialog(device[column].entity_id)}>
                    ${device[column].state && !["unknown", "0"].includes(device[column].state) ? device[column].state : "-"} 
                    ${device[column].state && device[column].state !== "unknown" ? device[column].unit_of_measurement : ""}
                </span>
            `;
    }
    return device[column] || "-";
  }
  _shouldShowColumn(column) {
    if (column === "device_name") {
      return true;
    }
    if (column === "ping_status") {
      return this._groupBy !== "ping_status";
    }
    if (column === "integration_name") {
      return this._groupBy !== "integration_name";
    }
    return this._config.columns.includes(column);
  }
  render() {
    const devices = this._getFilteredAndSortedDevices();
    const groupedDevices = this._groupDevices(devices);
    const visibleColumns = [
      "ping_status",
      "device_name",
      "host",
      "ping_status_since_timestamp",
      "last_response_time",
      "pings_failed_count",
      "integration_name"
    ].filter((col) => this._shouldShowColumn(col));
    return html`
            <ha-card>
                <div class="card">
                    <div class="header">
                        <h2>${this._config?.title || "Monitored Network Devices"}</h2>
                    </div>
        
                    <div class="controls">
                        <input
                                type="text"
                                class="filter-input"
                                placeholder="Filter Devices ..."
                                .value=${this._filterText}
                                @input=${this._handleFilter}
                        />
                        <select class="status-select filter-select" @change=${this._handleShowStatusChange}>
                            <option value="all" ?selected=${this._showStatus === "all"}>
                                All Statuses
                            </option>
                            <option value="on" ?selected=${this._showStatus === "on"}>
                                Only Connected
                            </option>
                            <option value="off" ?selected=${this._showStatus === "off"}>
                                Only Disconnected
                            </option>
                        </select>
                        <select class="group-select filter-select" @change=${this._handleGroupChange}>
                            <option value="none" ?selected=${this._groupBy === "none"}>
                                No Group
                            </option>
                            <option value="integration_name" ?selected=${this._groupBy === "integration_name"}>
                                Group By Integration
                            </option>
                        </select>
                    </div>
        
                    <div class="table-container">
                        ${devices.length === 0 ? html` <div class="no-data">No Device Found</div>` : Object.entries(groupedDevices).map(
      ([groupName, groupDevices]) => html`
                                    ${this._groupBy !== "none" ? html`
                                            <div class="group-header">
                                                ${groupName} (${groupDevices.length})
                                            </div>` : ""}
                                    <table>
                                        <thead>
                                        <tr>
                                            ${visibleColumns.map(
        (col) => when(
          this._hasSort(col),
          () => html`
                                                        <th class="sortable" @click=${() => this._handleSort(col)}>
                                                            ${this._getColumnLabel(col)}
                                                            ${this._getSortIcon(col)}
                                                        </th>
                                                    `,
          () => html`
                                                    <th>
                                                        ${this._getColumnLabel(col)}
                                                    </th>
                                                `
        )
      )}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        ${groupDevices.map(
        (device) => html`
                                                <tr class="device-status-${device["ping_status"]["state"]} ${this._statusChangedRows.has(device["device_id"]) ? "status-changed" : ""}">
                                                    ${visibleColumns.map(
          (col) => {
            const valueChanged = this._valueChangedCells.get(device.device_id)?.has(col) || this._valueChangedCells.get(device.device_id)?.size && col === "ping_status";
            return html`
                                                                <td class="${col} ${valueChanged ? "value-changed" : ""}">
                                                                    <span>${this._renderCellValue(device, col)}</span>
                                                                </td>`;
          }
        )}
                                                </tr>
                                            `
      )}
                                        </tbody>
                                    </table>
                                `
    )}
                    </div>
                </div>
            </ha-card>
        `;
  }
}
class DevicePulseTableCardEditor extends LitElement {
  static properties = {
    _config: { state: true }
  };
  setConfig(config) {
    this._config = config;
  }
  _valueChanged(evt) {
    const target = evt.target;
    if (!this._config || !target) {
      return;
    }
    let config = {
      ...this._config,
      ...evt.detail.value
    };
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true
    });
    event.detail = { config };
    this.dispatchEvent(event);
  }
  _computeLabel(schema) {
    switch (schema.name) {
      case "title":
        return "Card Title";
      case "show_status":
        return "Statues to Show";
      case "group_by_integration":
        return "Group-By Integration";
      case "columns":
        return "Columns";
    }
    return void 0;
  }
  render() {
    if (!this._config) {
      return html``;
    }
    const schema = [
      { name: "title", selector: {
        text: {}
      } },
      { name: "show_status", selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "all", label: "All" },
            { value: "on", label: "Only Connected" },
            { value: "off", label: "Only Disconnected" }
          ]
        }
      } },
      { name: "group_by_integration", selector: {
        boolean: {}
      } },
      { name: "columns", selector: {
        select: {
          multiple: true,
          mode: "dropdown",
          options: [
            { value: "host", label: "Host" },
            { value: "integration_name", label: "Integration Name" },
            { value: "last_response_time", label: "Last Response Time" },
            { value: "pings_failed_count", label: "Pings Failed" },
            { value: "ping_status_since_timestamp", label: "Connected/Disconnected Since" }
          ]
        }
      } }
    ];
    return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${schema}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
  }
}
customElements.define("device-pulse-table-card", DevicePulseTableCard);
customElements.define("device-pulse-table-card-editor", DevicePulseTableCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "device-pulse-table-card",
  name: "Device Pulse Table",
  description: "Show a table of monitored network devices with Device Pulse integration",
  preview: true,
  documentationURL: "https://github.com/studiobts/device-pulse-table-card"
});
console.info(
  `%c DEVICE-PULSE-TABLE-CARD %c v${CARD_VERSION} `,
  "background: #1976d2; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "background: #ff7043; color: white; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
);

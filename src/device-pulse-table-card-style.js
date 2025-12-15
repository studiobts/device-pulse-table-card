import { css } from "https://unpkg.com/lit@3.1.2/index.js?module";

export const cardStyles = css`
    :host {
        display: block;
        font-family: var(--paper-font-body1_-_font-family);
    }
    .card {
        background: var(--ha-card-background, var(--card-background-color));
        border-radius: var(--ha-card-border-radius, 12px);
    }
    .header {
        margin-bottom: 10px;
        margin-top: 24px;
        text-align: center;
    }
    .header h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin: 0;
    }
    .controls {
        padding: 0 8px 16px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }
    .filter-input {
        flex: 1;
        min-width: 200px;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
    }
    .filter-select {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
    }
    
    .table-container {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        border-top: 1px solid var(--divider-color);
    }
    th {
        text-align: left;
        padding: 12px 8px;
        border-bottom: 3px solid var(--divider-color);
        user-select: none;
        white-space: nowrap;
        background: rgba(0, 0, 0, 0.03);
    }
    td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--divider-color);
        white-space: nowrap;
    }
    table tr:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.015);
    }
    table tr:last-child td {
        border-bottom: none;
    }
    th.sortable:hover {
        cursor: pointer;
        border-bottom: 3px solid rgba(0, 0, 0, 0.3);
    }
    td.ping_status {
        min-width: 30px;
        text-align: center;
    }
    td.host {
        user-select: text;
    }
    .group-header {
        background: var(--secondary-background-color);
        font-weight: 500;
        padding: 8px;
        margin-top: 16px;
    }
    .group-header:first-child {
        margin-top: 0;
    }
    table.background-status .device-status-off {
        background-color: #db44371a;
    }
    table.background-status .device-status-on {
        background-color: #4caf501a;
    }
    table.background-status .device-status-warning {
        background-color: #f4a8361a;
    }
    .device_name {
        font-weight: bold;
    }
    .status-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    .status-on {
        background-color: var(--success-color);
        box-shadow: 0 0 6px var(--success-color);
    }
    .status-off {
        background-color: var(--error-color);
        box-shadow: 0 0 6px var(--error-color);
    }
    .status-warning {
        background-color: var(--warning-color);
        box-shadow: 0 0 6px var(--warning-color);
    }
    .no-data {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text-color);
    }
    .clickable {
        cursor: pointer;
    }
    .clickable:hover {
        color: var(--primary-color);
    }
    .not-available {
        text-transform: uppercase;
        font-size: 13px;
        color: #777;
    }
    @keyframes valueChangedAnimation {
        0% {
            transform: scale(1.2);
            font-weight: 700;
        }
        100% {
            transform: scale(1);
            font-weight: normal;
        }
    }
    td.value-changed span {
        animation: valueChangedAnimation 2s ease-out;
        display: inline-block;
    }
`;
# Reusable meeting-intake module

## Goal

Make the existing DTC and Amazon Book a meeting flows portable without changing their current UI, validation, Notion data contract, or Calendly behavior.

## Delivered design

`meeting-intake/` owns the two React forms, their CSS, client submission helper, Notion adapter, request security, and a route handler. The existing DTC and Amazon pages now import their form and CSS from that folder.

The client requests a short-lived form token, submits JSON to the server, and opens Calendly only after the server has created the Notion page. The server validates all data, checks origin and rate limits, rejects duplicate submissions, and keeps secrets server-side.

## Reuse boundary

Copy the entire `meeting-intake/` folder into a React + Node project. Import the desired component and stylesheet, then register `handleMeetingIntakeRequest` before the project’s fallback routes. The destination project provides its own environment values and Notion database.

## Verification

- TypeScript and production build pass.
- Server modules load without syntax errors.
- No live test submission is created during implementation.

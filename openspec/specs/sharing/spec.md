# Sharing Specification

## Purpose

This specification defines the unified sharing capability for the Private Chef application, covering supported share targets, share interaction outcomes, dedicated share pages, share cards, poster generation, privacy boundaries, and WeChat-facing presentation quality.

## Requirements

### Requirement: Unified share targets
The system SHALL provide a unified sharing capability for orders, recipes, achievements, and daily menu content.

#### Scenario: Supported share targets are discoverable
- **WHEN** product or engineering reviews the supported sharing surface list for the authenticated app
- **THEN** the supported targets include order, recipe, achievements, and daily menu content under one sharing capability

### Requirement: Consistent share interaction outcomes
The system SHALL treat a completed share action as both a user-facing action and a recordable product event.

#### Scenario: Share action completes successfully
- **WHEN** a user completes a supported share action for any supported target
- **THEN** the system records the share event using a target-aware contract and returns enough data for the UI to confirm success

### Requirement: Dedicated share pages
The system SHALL provide a dedicated share page for every supported share target.

#### Scenario: Recipient opens a shared link
- **WHEN** a recipient opens a copied link or scans a QR code for a supported share target
- **THEN** the system resolves a dedicated share page that presents the target in a share-friendly format without requiring access to the authenticated app shell

#### Scenario: Share page includes human and family context when available
- **WHEN** a supported share target has a family name, requester, or cook value available for public presentation
- **THEN** the dedicated share page may include the family name and the requester/cook display identity to make the shared story more vivid

### Requirement: Share cards are structured snapshots
The system SHALL expose structured share-card payloads for each supported share target instead of requiring pre-rendered media assets.

#### Scenario: Share card is requested for a supported target
- **WHEN** the frontend requests a share card for an order, recipe, achievements view, or daily menu view
- **THEN** the system returns structured JSON describing the target summary, key display fields, and any imagery needed for presentation or native share actions

### Requirement: Poster download with QR code
The system SHALL support downloadable share posters that include a QR code resolving to the dedicated share page.

#### Scenario: User downloads a share poster
- **WHEN** a user chooses the poster download action for a supported share target
- **THEN** the system provides a downloadable image containing target summary content and a QR code pointing to the target share page

#### Scenario: Poster is generated on the frontend
- **WHEN** a user prepares to download a poster for a supported share target
- **THEN** the poster image is generated in real time on the frontend from the share payload and QR target instead of depending on a pre-rendered backend image

### Requirement: Sharing preserves curated public privacy boundaries
The system SHALL preserve source privacy while exposing only a curated public representation through sharing flows.

#### Scenario: Share data is assembled
- **WHEN** a share-card payload or share mutation is processed
- **THEN** the system exposes only the curated fields intended for public share viewing and excludes private operational or family-management data

#### Scenario: Allowed identity fields are shown publicly
- **WHEN** the public share representation includes family name, requester identity, or cook identity
- **THEN** the system limits those fields to display-oriented names only and excludes sensitive profile or account data

### Requirement: WeChat-facing copy stays concise and premium
The system SHALL provide WeChat-friendly share titles and summaries that are concise, attractive, and derived from the shared content.

#### Scenario: Share metadata is composed for WeChat distribution
- **WHEN** the system prepares titles, subtitles, or summary text for a shared target
- **THEN** the resulting copy uses the target content plus allowed family/requester/cook context to produce a concise and polished presentation rather than dense generic text

## ADDED Requirements

### Requirement: Shared share target vocabulary
The system SHALL use a consistent vocabulary for supported share targets and share channels across frontend and backend modules.

#### Scenario: Share payload is exchanged across modules
- **Given** the frontend sends a share mutation or consumes a share-card response
- **When** the payload crosses the API boundary
- **Then** both sides use compatible target and channel values for order, recipe, achievements, and daily menu sharing

### Requirement: Shared public share identifier contract
The system SHALL use a stable contract for public share-page resolution and QR-code targeting.

#### Scenario: Public share link is generated
- **Given** the frontend receives data for a created share target
- **When** it builds a copied link, WeChat share, or poster QR code
- **Then** it can rely on a stable public share identifier or URL contract that resolves the intended target without exposing internal private identifiers directly

### Requirement: Shared share-card contract
The system SHALL preserve a predictable payload shape for structured share-card responses.

#### Scenario: Frontend consumes a share-card payload
- **Given** a supported share target is requested from the backend
- **When** the share-card response is returned
- **Then** the contract includes enough stable summary fields, metadata, and optional imagery for the frontend to render a consistent share experience without target-specific ad hoc parsing

### Requirement: Shared poster contract
The system SHALL preserve a predictable payload shape for poster generation and QR-code embedding.

#### Scenario: Frontend prepares a downloadable poster
- **Given** the frontend requests or assembles poster data for a supported share target
- **When** it receives the response payload
- **Then** the contract includes the share-page URL or equivalent QR target plus the stable summary fields needed for image composition

#### Scenario: Poster is generated client-side
- **Given** the frontend implements poster export for a supported share target
- **When** it consumes the poster contract
- **Then** the contract is sufficient for real-time client-side poster rendering without requiring a pre-rendered image from the backend

### Requirement: Shared public identity display contract
The system SHALL use a consistent contract for publicly visible family and identity fields in share flows.

#### Scenario: Public share payload contains family and role context
- **Given** a supported share target includes a family name and optional requester or cook display identity
- **When** the payload is exchanged across the API boundary
- **Then** both sides use stable, display-oriented fields for those values and exclude sensitive profile attributes beyond the names needed for presentation

### Requirement: Shared WeChat metadata contract
The system SHALL use a predictable contract for WeChat-friendly titles and summaries.

#### Scenario: Frontend consumes WeChat-facing metadata
- **Given** the frontend receives share metadata intended for WeChat distribution or preview
- **When** it consumes the response
- **Then** it can rely on concise title and summary fields derived from target content and allowed public context

#### Scenario: Metadata remains concise and target-aware
- **Given** the backend prepares WeChat-facing metadata for different share targets
- **When** the payload is returned to the frontend
- **Then** the contract supports concise target-aware titles and summaries rather than forcing one generic text template across all share types

### Requirement: Shared visual composition contract
The system SHALL preserve a stable contract for target-specific share composition.

#### Scenario: Frontend renders different share targets
- **Given** the frontend receives share payloads for order, recipe, achievements, and daily menu targets
- **When** it renders share pages or posters
- **Then** the contract provides enough stable fields for a shared premium base layout with target-specific hero emphasis and restrained supporting facts

#### Scenario: Contract supports deterministic fallback composition
- **Given** optional public fields or hero assets are missing from a supported share target
- **When** the frontend renders the output
- **Then** the contract still supports deterministic fallback composition without placeholder leakage or target-specific guesswork

### Requirement: Shared cover-selection contract
The system SHALL provide a predictable contract for choosing cover imagery across share outputs.

#### Scenario: Frontend selects cover imagery
- **Given** the frontend needs a share-page hero image, a poster hero image, or WeChat cover imagery
- **When** it consumes the share payload
- **Then** the contract provides a stable priority order or resolved hero reference so cover selection stays aligned across outputs

## MODIFIED Requirements

### Requirement: API payload naming compatibility
The system SHALL preserve predictable payload shapes across the HTTP boundary, including the sharing contract used by multiple target types and public share pages.

#### Scenario: Request and response mapping
- **Given** the frontend sends or reads API payloads
- **When** backend routes validate and serialize data
- **Then** the payloads remain consistent enough for forms, list pages, detail pages, public share pages, poster generation, and sharing flows to function without ad hoc per-endpoint translation rules beyond intentional naming differences

#### Scenario: Mixed naming conventions across layers
- **Given** domain entities move between database, backend, and frontend layers
- **When** API payloads are exchanged
- **Then** contract fields may use snake_case names such as `display_name`, `cook_minutes`, `invite_code`, `meal_date`, and sharing-related response fields such as public share identifiers or poster metadata when that matches the established API surface

### Requirement: Shared API resource groups
The system SHALL organize major JSON APIs around stable resource groups, including the sharing resources required for supported targets.

#### Scenario: Resource grouping
- **Given** a caller integrates with the backend
- **When** it discovers the API surface
- **Then** it can rely on resource groups for auth, tags, recipes, uploads/images, orders, wishes, favorites, cook logs, ratings, families, home summary, profile summary, achievements, and sharing-related endpoints

#### Scenario: Error semantics
- **Given** requests fail at the contract level
- **When** the backend returns an error payload
- **Then** the response usually includes an `error` string and may include `details` for validation failures across both existing features and sharing flows

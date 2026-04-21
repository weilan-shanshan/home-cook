## ADDED Requirements

### Requirement: Recipe sharing APIs
The backend SHALL provide share mutation and share-card APIs for recipes.

#### Scenario: Recipe share API contract
- **Given** a client calls a recipe share mutation endpoint for a recipe that belongs to the caller's family
- **When** the request body contains a valid share type and channel
- **Then** the backend records the share event and returns a created share response aligned with the shared sharing contract

#### Scenario: Recipe share-card API contract
- **Given** a client calls a recipe share-card endpoint for a recipe that belongs to the caller's family
- **When** the request is valid
- **Then** the backend returns a structured share-card payload containing recipe summary information and optional lead imagery

### Requirement: Aggregate sharing APIs
The backend SHALL provide share mutation and share-card APIs for achievements and daily menu content.

#### Scenario: Achievements share API contract
- **Given** a client calls an achievements share mutation or share-card endpoint
- **When** the requester is authenticated within a family context
- **Then** the backend returns a family-scoped achievements share record or a structured achievements summary card payload

#### Scenario: Daily menu share API contract
- **Given** a client calls a daily menu share mutation or share-card endpoint
- **When** the requester is authenticated within a family context
- **Then** the backend returns a share record or a structured card payload representing the current menu recommendation snapshot

### Requirement: Public share-page APIs
The backend SHALL provide public share-page data for supported share targets.

#### Scenario: Public share page is requested
- **Given** a recipient calls a public share-page endpoint with a valid share identifier
- **When** the identifier resolves to a supported shared target
- **Then** the backend returns the curated public payload required to render the share page without exposing private operational fields

#### Scenario: Public share page includes allowed family and identity fields
- **Given** a supported share target has a family name and optional requester or cook display names available for public presentation
- **When** the public share payload is assembled
- **Then** the backend may include those display-oriented fields in the response while excluding sensitive account data

#### Scenario: Share poster metadata is requested
- **Given** a client requests poster data for a supported shared target
- **When** the share identifier is valid
- **Then** the backend returns the summary fields and share URL needed to embed a QR code and render a downloadable poster

#### Scenario: WeChat-oriented share metadata is requested
- **Given** a client or rendering layer needs share metadata for WeChat-friendly distribution
- **When** a supported share target is resolved
- **Then** the backend returns concise display metadata derived from the target content and allowed family/requester/cook fields

#### Scenario: Visual composition metadata is requested
- **Given** a client needs to render a target-specific share page or poster
- **When** a supported share target is resolved
- **Then** the backend returns enough stable summary fields, hero content references, and supporting context for the frontend to apply the correct target-specific visual hierarchy without additional ad hoc lookups

#### Scenario: Missing fields degrade cleanly
- **Given** optional fields such as requester, cook, family name, or hero imagery are absent for a supported share target
- **When** the backend assembles the share payload
- **Then** it omits those fields cleanly and still returns a payload that supports deterministic fallback rendering

## MODIFIED Requirements

### Requirement: Order social and feedback APIs
The backend SHALL provide comment, review, like, share, and share-card APIs for orders, and SHALL align order sharing with the broader sharing contract used by other supported share targets and public share pages.

#### Scenario: Order comment API contract
- **Given** a client calls `GET /api/orders/:id/comments` or `POST /api/orders/:id/comments`
- **When** the order belongs to the caller's family
- **Then** the backend returns comment arrays or `201` created comment payloads with `display_name`, `role_type`, and timestamps

#### Scenario: Order review API contract
- **Given** a client calls `GET /api/orders/:id/reviews` or `POST /api/orders/:id/reviews`
- **When** the order belongs to the caller's family
- **Then** the backend returns review arrays or a `201` created review payload containing `score`, `taste_score`, `portion_score`, and optional `overall_note`
- **And** duplicate reviews by the same user return `409`

#### Scenario: Order like/share API contract
- **Given** a client calls `POST /api/orders/:id/like`, `DELETE /api/orders/:id/like`, or the order share mutation endpoint
- **When** the order belongs to the caller's family
- **Then** the backend returns JSON confirming the current liked state or created share record using the shared share field vocabulary, including enough metadata to resolve the target's share page
- **And** like creation is idempotent in practice because existing likes return a liked response instead of an error

#### Scenario: Order share-card API contract
- **Given** a client calls the order share-card endpoint
- **When** the order belongs to the caller's family
- **Then** the backend returns a structured share-card payload containing the order summary, included items, interaction summary, and share-page metadata needed by the frontend share experience

### Requirement: Input validation and API errors
The backend SHALL validate request payloads before applying state changes, including sharing-specific target, channel, identifier, and public-share resolution constraints.

#### Scenario: Invalid request body
- **Given** a request body fails schema validation
- **When** the endpoint processes the request
- **Then** the backend returns a `400` response with validation error details

#### Scenario: Missing or invalid resource identifiers
- **Given** a route parameter is malformed or non-positive
- **When** the endpoint validates the identifier
- **Then** the backend returns a client error instead of performing the operation

#### Scenario: Global validation and conflict handling
- **Given** a request is syntactically valid but violates route-specific constraints such as family ownership or unsupported share target state
- **When** the backend rejects the request
- **Then** it returns a non-2xx response that distinguishes validation, not-found, and conflict cases closely enough for the frontend to present appropriate feedback

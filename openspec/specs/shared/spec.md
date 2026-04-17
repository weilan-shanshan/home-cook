# Shared Specification

## Purpose

This specification defines cross-module domain concepts and integration contracts shared by the Private Chef frontend and backend, even though the repository does not currently expose a standalone shared package.

## Requirements

### Requirement: Family-centered domain model
The system SHALL treat family membership as the primary boundary for application data.

#### Scenario: Household-owned resources
- **Given** recipes, wishes, and orders are created in the system
- **When** those resources are stored or queried
- **Then** they are associated with a family and are expected to remain family-scoped across both frontend and backend behavior

### Requirement: Consistent identity model
The system SHALL represent authenticated users with stable identifiers and display-oriented profile fields.

#### Scenario: Authenticated user payload
- **Given** the frontend receives the current user payload from auth endpoints
- **When** it consumes the response
- **Then** it can rely on identity fields such as user id, username, display name, role, and family association

### Requirement: Shared status vocabularies
The system SHALL use consistent status values for core flows.

#### Scenario: Order status handling
- **Given** an order moves through its lifecycle
- **When** frontend and backend exchange order data
- **Then** both sides use a compatible vocabulary spanning submitted/pending, confirmed, preparing, completed, and cancelled states

#### Scenario: Wish status handling
- **Given** a wish is displayed or updated
- **When** state is exchanged across the API boundary
- **Then** both sides use the statuses `pending`, `fulfilled`, and `cancelled`

### Requirement: API payload naming compatibility
The system SHALL preserve predictable payload shapes across the HTTP boundary.

#### Scenario: Request and response mapping
- **Given** the frontend sends or reads API payloads
- **When** backend routes validate and serialize data
- **Then** the payloads remain consistent enough for forms, list pages, and detail pages to function without ad hoc per-endpoint translation rules beyond intentional naming differences

#### Scenario: Mixed naming conventions across layers
- **Given** domain entities move between database, backend, and frontend layers
- **When** API payloads are exchanged
- **Then** contract fields may use snake_case names such as `display_name`, `cook_minutes`, `invite_code`, and `meal_date` even when backend internals use camelCase

### Requirement: Upload integration contract
The system SHALL implement a direct-upload pattern for recipe media.

#### Scenario: Client uploads an image
- **Given** the frontend needs to attach a recipe image
- **When** it follows the upload flow
- **Then** the backend provides presign/upload metadata and the binary file is uploaded to Tencent COS rather than stored through the app server filesystem

### Requirement: Shared authentication contract
The system SHALL use credentialed HTTP requests backed by a session cookie.

#### Scenario: Browser-authenticated API access
- **Given** the frontend calls protected endpoints
- **When** the browser sends requests to the backend
- **Then** the requests include credentials and rely on the backend `session` cookie plus compatible CORS policy

#### Scenario: Auth response shape
- **Given** the frontend consumes auth responses from register, login, or me endpoints
- **When** the backend returns authenticated user data
- **Then** the contract includes `id`, `username`, `display_name`, `role`, and `familyId`, with create-family registration additionally returning `inviteCode`

### Requirement: Operational environment contract
The system SHALL depend on a small set of runtime configuration values across modules.

#### Scenario: Frontend and backend are deployed together
- **Given** the application is deployed to its current production topology
- **When** configuration is applied
- **Then** frontend API base URL, backend frontend-origin/CORS settings, database path, session secret, COS configuration, and optional notification webhook settings are treated as core integration inputs

### Requirement: Shared API resource groups
The system SHALL organize major JSON APIs around stable resource groups.

#### Scenario: Resource grouping
- **Given** a caller integrates with the backend
- **When** it discovers the API surface
- **Then** it can rely on resource groups for auth, tags, recipes, uploads/images, orders, wishes, favorites, cook logs, ratings, families, home summary, profile summary, and achievements

#### Scenario: Error semantics
- **Given** requests fail at the contract level
- **When** the backend returns an error payload
- **Then** the response usually includes an `error` string and may include `details` for validation failures

### Requirement: Runbook precedence for deployment truth
The system SHALL use the runbook as the source of truth for current deployment behavior.

#### Scenario: Design doc conflicts with deployment reality
- **Given** historical technical design notes diverge from the live deployment model
- **When** specs or operators need the current operational answer
- **Then** `private-chef/DEPLOYMENT_RUNBOOK.md` takes precedence over older planning material for deployment-specific behavior

# Backend Specification

## Purpose

The backend SHALL provide authenticated family-scoped APIs for the Private Chef application, including onboarding, recipes, orders, wishes, ratings, uploads, notifications, and supporting profile/home data.

## API surface

- Root health check: `GET /`
- Auth routes: `/api/auth/*`
- Tags routes: `/api/tags/*`
- Upload and image routes: `/api/upload/presign`, `/api/recipes/:id/images`, `/api/images/:id`
- Recipe routes: `/api/recipes/*`
- Order routes: `/api/orders/*`
- Home summary: `/api/home/summary`
- Profile summary: `/api/profile/summary`
- Achievement routes: `/api/achievements/*`
- Wish routes: `/api/wishes/*`
- Favorite routes: `/api/favorites/*`
- Cook log routes: `/api/cook-logs/*`
- Rating routes: `/api/recipes/:id/logs`, `/api/cook-logs/:id/ratings`
- Family routes: `/api/families/*`
- Sharing routes: `/api/share/*`, `/api/recipes/:id/share`, `/api/achievements/share`, `/api/menus/share`

Unless noted otherwise, `/api/*` endpoints return JSON.

## Requirements

### Requirement: Root service health endpoint
The backend SHALL expose a simple health-style endpoint for service availability checks.

#### Scenario: Read root status
- **Given** a caller requests `GET /`
- **When** the server is reachable
- **Then** the backend returns a JSON object containing `status: "ok"`

### Requirement: Session-based authentication
The backend SHALL authenticate users with a server-issued session cookie.

#### Scenario: Register and create a family
- **Given** a new user submits username, display name, password, and `mode=create`
- **When** the registration succeeds
- **Then** the backend creates an admin user, creates a family with an invite code, adds the user to that family, sets a `session` cookie, and returns the authenticated user payload

#### Scenario: Register and join a family
- **Given** a new user submits valid registration data with `mode=join` and a valid invite code
- **When** the registration succeeds
- **Then** the backend creates a member user, adds the user to the referenced family, sets a `session` cookie, and returns the authenticated user payload

#### Scenario: Login
- **Given** an existing user submits valid credentials
- **When** the password matches
- **Then** the backend creates a session, sets an HttpOnly cookie, and returns user identity plus family membership information

#### Scenario: Login API contract
- **Given** a client calls `POST /api/auth/login`
- **When** the request body contains `username` and `password`
- **Then** the response body contains `id`, `username`, `display_name`, `role`, and `familyId`
- **And** invalid credentials return `401`

#### Scenario: Logout
- **Given** an authenticated user has an active session
- **When** the user calls logout
- **Then** the backend invalidates the session and clears the session cookie

#### Scenario: Register API contract
- **Given** a client calls `POST /api/auth/register`
- **When** the request body contains `username`, `display_name`, `password`, and `mode`
- **Then** create-mode responses return `201` with `id`, `username`, `display_name`, `role`, `familyId`, and `inviteCode`
- **And** join-mode responses return `201` with `id`, `username`, `display_name`, `role`, and `familyId`
- **And** invalid data returns `400`
- **And** duplicate usernames return `409`

#### Scenario: Read current session identity
- **Given** a client calls `GET /api/auth/me` with a valid session
- **When** the request is authenticated
- **Then** the backend returns `id`, `username`, `display_name`, `role`, and `familyId`

### Requirement: Family-scoped authorization
The backend SHALL scope protected data access to the authenticated user's family.

#### Scenario: Access family resources
- **Given** an authenticated request reaches a protected route
- **When** family context is resolved
- **Then** the backend uses the authenticated `familyId` to filter recipes, wishes, orders, and related resources

#### Scenario: Cross-family resource access
- **Given** a resource does not belong to the authenticated family
- **When** the request attempts to read or mutate that resource
- **Then** the backend rejects the operation with an error response

#### Scenario: Protected endpoint without session
- **Given** a client calls a protected API without a valid session cookie
- **When** authentication is required
- **Then** the backend returns an authorization error such as `401 Unauthorized`

### Requirement: Recipe management API
The backend SHALL support creating, listing, reading, and updating recipes with images, tags, and cooking metadata.

#### Scenario: List recipes
- **Given** an authenticated user requests the recipe collection
- **When** optional tag, search, page, or limit filters are provided
- **Then** the backend returns a paginated family-scoped list with first-image and rating summary data

#### Scenario: Recipe list API contract
- **Given** a client calls `GET /api/recipes`
- **When** query parameters `tag`, `q`, `page`, or `limit` are supplied
- **Then** the backend responds with `{ data, total, page, limit }`
- **And** each recipe item includes `id`, `title`, `description`, `steps`, `cook_minutes`, `servings`, `created_by`, `created_at`, `updated_at`, `first_image`, `tags`, and `avg_rating`

#### Scenario: Read recipe detail
- **Given** an authenticated user requests a specific recipe in their family
- **When** the recipe exists
- **Then** the backend returns recipe fields, images, tags, recent cook logs, favorite state, and aggregate rating information

#### Scenario: Recipe detail API contract
- **Given** a client calls `GET /api/recipes/:id`
- **When** the recipe belongs to the authenticated family
- **Then** the response includes recipe fields, `images`, `tags`, `recent_cook_logs`, `avg_rating`, and `is_favorited`
- **And** invalid ids return `400`
- **And** missing recipes return `404`

#### Scenario: Create or update a recipe
- **Given** an authenticated user submits valid recipe payload data
- **When** validation passes
- **Then** the backend persists recipe data and associated tag relationships and keeps the data family-scoped

#### Scenario: Create recipe API contract
- **Given** a client calls `POST /api/recipes`
- **When** the request body includes `title`, `steps`, and optional `description`, `cook_minutes`, `servings`, and `tags`
- **Then** the backend returns `201` with the created recipe summary and resolved tags
- **And** tags outside the caller's family return `400`

#### Scenario: Update recipe API contract
- **Given** a client calls `PUT /api/recipes/:id`
- **When** the request body includes any supported mutable fields
- **Then** the backend returns the updated recipe payload with `tags`
- **And** invalid ids return `400`
- **And** missing recipes return `404`

#### Scenario: Delete recipe API contract
- **Given** a client calls `DELETE /api/recipes/:id`
- **When** the recipe exists and is deletable
- **Then** the backend returns `{ success: true }`
- **And** invalid ids return `400`
- **And** missing recipes return `404`
- **And** recipes referenced by existing orders return `409`

### Requirement: Recipe image API
The backend SHALL let authenticated users persist and remove recipe image metadata while using direct object storage uploads.

#### Scenario: Generate upload presign contract
- **Given** a client calls `GET /api/upload/presign`
- **When** `filename` is provided and an optional `contentType` is supplied
- **Then** the backend returns JSON containing Tencent COS upload metadata
- **And** a missing `filename` returns `400`

#### Scenario: Save recipe image metadata
- **Given** a client calls `POST /api/recipes/:id/images`
- **When** the request body includes `url` and optional `thumb_url` and `sort_order`
- **Then** the backend returns `201` with saved image metadata for the specified family-owned recipe
- **And** invalid recipe ids return `400`
- **And** missing family-owned recipes return `404`

#### Scenario: Delete recipe image metadata
- **Given** a client calls `DELETE /api/images/:id`
- **When** the image belongs to a recipe in the caller's family
- **Then** the backend returns `{ success: true }`
- **And** invalid image ids return `400`
- **And** missing images return `404`

### Requirement: Tag API
The backend SHALL provide family-scoped tag management.

#### Scenario: List tags API contract
- **Given** a client calls `GET /api/tags`
- **When** the caller has a valid session and family membership
- **Then** the backend returns an array of `{ id, name }`
- **And** unauthenticated callers receive `401`
- **And** users without family membership receive `403`

#### Scenario: Create tag API contract
- **Given** a client calls `POST /api/tags`
- **When** the body contains a non-empty `name`
- **Then** the backend returns `201` with `{ id, name }`
- **And** duplicate family tag names return `409`

#### Scenario: Delete tag API contract
- **Given** a client calls `DELETE /api/tags/:id`
- **When** the target tag belongs to the caller's family
- **Then** the backend returns `{ success: true }`
- **And** invalid ids return `400`
- **And** missing tags return `404`

### Requirement: Order lifecycle API
The backend SHALL support meal ordering and status progression for family members.

#### Scenario: Create an order
- **Given** an authenticated user submits a valid order containing one or more family recipes
- **When** the request is accepted
- **Then** the backend creates the order, creates order items, records an initial status event, and enqueues or emits a notification event

#### Scenario: Create order API contract
- **Given** a client calls `POST /api/orders`
- **When** the request body contains `meal_type`, `meal_date`, optional `note`, and at least one item with `recipe_id` and `quantity`
- **Then** the backend returns `201` with the created order including normalized status and item summaries
- **And** requests containing recipes outside the caller's family return `400`

#### Scenario: List orders
- **Given** an authenticated user requests orders
- **When** optional status or meal-date filters are provided
- **Then** the backend returns family orders with items and normalized status values

#### Scenario: Order list API contract
- **Given** a client calls `GET /api/orders`
- **When** optional `status` and `meal_date` filters are provided
- **Then** the backend returns an array of orders with `items`
- **And** unsupported `status` filter values return `400`

#### Scenario: Advance order status
- **Given** an existing order is in a valid state transition path
- **When** a supported new status is submitted
- **Then** the backend updates status fields, timestamps relevant completion/cancellation fields, and records the transition event

#### Scenario: Order detail API contract
- **Given** a client calls `GET /api/orders/:id`
- **When** the target order belongs to the caller's family
- **Then** the backend returns requester info, optional cook info, item list, like/share counts, and a `statusTimeline`
- **And** invalid ids return `400`
- **And** missing orders return `404`

#### Scenario: Order status update API contract
- **Given** a client calls `PUT /api/orders/:id/status`
- **When** the request body contains a target `status`
- **Then** the backend returns `{ id, status }` for valid transitions
- **And** unsupported transitions return `400`
- **And** missing orders return `404`

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

### Requirement: Wish management API
The backend SHALL allow family members to create and update meal wishes.

#### Scenario: Create a wish
- **Given** an authenticated user submits a non-empty dish name
- **When** validation passes
- **Then** the backend stores a pending wish for the user's family and may trigger a wish notification

#### Scenario: Wish list API contract
- **Given** a client calls `GET /api/wishes`
- **When** an optional `status` filter is supplied
- **Then** the backend returns family wish rows ordered by creation time
- **And** unsupported status filters return `400`

#### Scenario: Fulfill a wish with a recipe
- **Given** a family wish is updated to `fulfilled`
- **When** a recipe reference is supplied
- **Then** the backend verifies the recipe belongs to the same family before attaching it to the wish

#### Scenario: Create and update wish API contract
- **Given** a client calls `POST /api/wishes` or `PUT /api/wishes/:id`
- **When** request data satisfies validation requirements
- **Then** the backend returns `201` for create or the updated wish for update
- **And** invalid ids return `400`
- **And** missing wishes return `404`
- **And** fulfilling a wish with a recipe outside the family returns `400`

### Requirement: Favorites API
The backend SHALL allow users to maintain personal favorite recipes within their family context.

#### Scenario: Favorites API contract
- **Given** a client calls `GET /api/favorites`, `POST /api/favorites/:recipeId`, or `DELETE /api/favorites/:recipeId`
- **When** the target recipe belongs to the caller's family
- **Then** list responses return favorite recipe summaries and mutation responses return either created favorite data or `{ success: true }`
- **And** invalid recipe ids return `400`
- **And** missing recipes return `404`
- **And** duplicate favorite creation returns `409`

### Requirement: Cook log and rating APIs
The backend SHALL expose cooking activity and per-cook-log rating data.

#### Scenario: Cook log list API contract
- **Given** a client calls `GET /api/cook-logs`
- **When** optional `page` and `limit` query parameters are supplied
- **Then** the backend returns `{ data, total, page, limit }` where each log includes rating summary data and inline ratings

#### Scenario: Create cook log API contract
- **Given** a client calls `POST /api/cook-logs`
- **When** the body contains `recipe_id` and optional `cooked_at` and `note`
- **Then** the backend returns `201` with the created log payload, recipe title, and zeroed rating summary
- **And** recipes outside the family return `400`

#### Scenario: Recipe log listing API contract
- **Given** a client calls `GET /api/recipes/:id/logs`
- **When** the recipe belongs to the caller's family
- **Then** the backend returns recipe-specific cook logs with inline ratings, `avg_rating`, and `rating_count`

#### Scenario: Cook log ratings API contract
- **Given** a client calls `GET /api/cook-logs/:id/ratings` or `POST /api/cook-logs/:id/ratings`
- **When** the cook log belongs to the caller's family
- **Then** the backend returns rating arrays or a `201` created rating payload containing `score`, `comment`, and `display_name`
- **And** duplicate ratings by the same user return `409`

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

### Requirement: Upload preparation and external integrations
The backend SHALL coordinate with external services required by the application.

#### Scenario: Image upload flow
- **Given** the frontend needs to upload a recipe image
- **When** it requests upload preparation
- **Then** the backend provides the data needed for direct Tencent COS upload rather than proxying the file through the API server

#### Scenario: Notification-capable events
- **Given** a recipe, order, or wish event requires family notification
- **When** the triggering action completes
- **Then** the backend records or triggers notification behavior using the configured integration path

### Requirement: Family and summary APIs
The backend SHALL expose family metadata and dashboard-style summary endpoints.

#### Scenario: Family API contract
- **Given** a client calls `POST /api/families`, `GET /api/families/:id`, `GET /api/families/:id/members`, or `POST /api/families/join`
- **When** authorization and membership rules are satisfied
- **Then** the backend returns family records, member lists, or join results with family metadata
- **And** non-admin family creation returns `403`
- **And** invalid invite codes return `400`
- **And** duplicate join attempts return `409`

#### Scenario: Summary API contract
- **Given** a client calls `GET /api/home/summary`, `GET /api/profile/summary`, `GET /api/achievements/summary`, or `GET /api/achievements/leaderboard`
- **When** the request is authenticated
- **Then** the backend returns JSON summary objects derived from family-scoped service computations

### Requirement: Deployment and runtime constraints
The backend SHALL operate according to the current runbook-defined deployment model.

#### Scenario: Production deployment
- **Given** the backend is deployed to production
- **When** operators follow the current repository guidance
- **Then** the service is built from `private-chef/backend`, managed by PM2, exposed through Cloudflare Tunnel, and configured through runtime environment variables

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


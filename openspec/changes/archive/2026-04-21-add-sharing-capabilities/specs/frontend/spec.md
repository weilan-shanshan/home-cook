## ADDED Requirements

### Requirement: Cross-surface share entry points
The frontend SHALL expose sharing entry points on order detail, recipe detail, achievements, and daily menu-related surfaces.

#### Scenario: User opens a supported share surface
- **Given** the user is authenticated and viewing an order detail page, recipe detail page, achievements page, or home/menu surface with today's recommendations
- **When** the page renders successfully
- **Then** the UI shows a discoverable share trigger appropriate to that surface

### Requirement: Reusable share action flow
The frontend SHALL provide a consistent share interaction model across supported share targets.

#### Scenario: User starts sharing from any supported surface
- **Given** a share trigger is available on a supported page
- **When** the user activates the share trigger
- **Then** the UI loads or reuses the target share payload and presents consistent share actions such as copy link, WeChat-friendly distribution, and poster download

### Requirement: Public share-page rendering
The frontend SHALL render dedicated public share pages for supported share targets.

#### Scenario: Shared link is opened outside the authenticated app
- **Given** a recipient opens a supported share URL directly
- **When** the public share page loads successfully
- **Then** the UI renders the shared target summary, branded context, and an experience suitable for external viewing without requiring the authenticated application shell

#### Scenario: Public share page shows family and role context
- **Given** the share payload includes a family name and optional requester or cook display names
- **When** the public share page renders
- **Then** the UI displays those fields in a tasteful way that enhances the story of the shared content without overwhelming the layout

### Requirement: Poster export experience
The frontend SHALL allow users to download a share image that includes a QR code to the dedicated share page.

#### Scenario: User downloads a poster
- **Given** the user has opened a share flow for a supported target
- **When** the user selects the poster download action
- **Then** the UI generates or retrieves a share poster image containing the target summary and QR code and downloads it successfully

#### Scenario: Poster is generated in real time on the client
- **Given** the user requests a poster download
- **When** the export flow runs
- **Then** the frontend composes the poster in real time from the current share payload and QR-code data instead of waiting for a server-rendered image asset

### Requirement: WeChat-oriented presentation quality
The frontend SHALL present share content in a concise and visually polished way suitable for WeChat forwarding and preview.

#### Scenario: Share copy and preview are shown to the sharer
- **Given** a user opens the share actions for a supported target
- **When** the UI presents the WeChat-oriented share option or preview information
- **Then** the text and visual hierarchy emphasize brevity, quality, and appeal using the target content plus allowed family/requester/cook context

#### Scenario: Different targets use different hero emphasis
- **Given** the user previews share output for order, recipe, achievements, or daily menu content
- **When** the preview or poster renders
- **Then** the UI applies one shared premium visual system but changes the hero emphasis so recipes lead with imagery, achievements lead with rank or score, orders lead with meal and people context, and daily menus lead with grouped dish composition

#### Scenario: Poster layout stays vertically scannable
- **Given** the user downloads or previews a share poster
- **When** the poster is composed on the client
- **Then** the layout follows a vertically structured hierarchy with brand context, hero zone, concise title, limited supporting chips, and a calm QR-code footer suitable for screenshot and chat forwarding

#### Scenario: Different outputs remain visually aligned
- **Given** the frontend renders a share page, a poster preview, and WeChat-oriented preview information for the same target
- **When** those outputs are shown
- **Then** the title theme, hero selection, public family/requester/cook visibility, and QR destination remain aligned so the outputs feel like one system

### Requirement: Share feedback states
The frontend SHALL provide explicit loading, success, and error feedback for sharing actions.

#### Scenario: Share request is pending
- **Given** the user has initiated a share flow
- **When** the frontend is waiting for share mutation or share-card data
- **Then** the UI indicates loading and prevents accidental duplicate submission for the same in-flight action

#### Scenario: Share request succeeds or fails
- **Given** the user completes or attempts a share action
- **When** the backend or browser share capability returns success or failure
- **Then** the UI shows a clear success confirmation or error message without leaving the current page context

## MODIFIED Requirements

### Requirement: Order creation and tracking
The frontend SHALL support creating orders, reviewing their lifecycle, and sharing completed or in-progress order context through external share pages and downloadables.

#### Scenario: Create an order
- **Given** a user wants to request a meal
- **When** the user selects one or more recipes, meal type, and date
- **Then** the UI submits the order and shows the created order in order-related views

#### Scenario: View order list and detail
- **Given** a user navigates to order history or current orders
- **When** order data is loaded
- **Then** the UI displays order statuses, selected items, detail context appropriate to the current order state, and a share entry point on the order detail surface that can produce a link, WeChat-friendly share target, or poster

### Requirement: Recipe browsing and detail views
The frontend SHALL allow users to discover, inspect, and share recipe content.

#### Scenario: Browse recipes
- **Given** the user is authenticated
- **When** the recipe list page loads
- **Then** the UI displays recipe cards or list items with summary information and supports search/filter behaviors backed by the API

#### Scenario: View recipe detail
- **Given** a user selects a recipe
- **When** the detail page loads successfully
- **Then** the UI shows recipe description, steps, images, tags, related household activity such as ratings or cook logs, and a share entry point for the recipe that supports link sharing, WeChat circulation, and poster download

### Requirement: Responsive app shell
The frontend SHALL provide a polished mobile-first application structure suitable for daily household use on phones and coherent standalone use when installed on larger screens, including consistent presentation of cross-surface share actions.

#### Scenario: Handheld shell feels app-like
- **Given** a user opens the authenticated app on a phone-sized screen
- **When** the main authenticated pages render
- **Then** the layout uses consistent page framing, navigation placement, spacing rhythm, and safe-area handling so the product feels like one app shell rather than a centered desktop dashboard

#### Scenario: Key surfaces share one visual system
- **Given** a user navigates between core authenticated pages such as home, menu, profile, achievements, order detail, and recipe detail
- **When** each page loads
- **Then** headers, content spacing, bottom actions, persistent navigation, authenticated share affordances, and public share-page presentation follow a shared visual system instead of page-specific dashboard conventions

#### Scenario: Wider screens preserve app coherence
- **Given** a user views the authenticated app on a tablet, laptop, or desktop-sized viewport
- **When** the shell adapts to the available width
- **Then** it remains visually intentional and installable-app-like instead of simply expanding phone content into a generic PC layout

#### Scenario: Deep-link navigation in production
- **Given** a user refreshes or opens a client-side route directly
- **When** the app is served from Cloudflare Pages
- **Then** the SPA fallback configuration preserves route access rather than failing with a server-side 404

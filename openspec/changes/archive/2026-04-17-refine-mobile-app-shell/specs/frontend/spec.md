## ADDED Requirements

### Requirement: Desktop installable PWA experience
The frontend SHALL preserve a browser-installable PWA experience that can be launched in standalone form on supported desktop browsers.

#### Scenario: Supported browser offers installability
- **WHEN** a user opens the production frontend in a supported browser that meets installability requirements
- **THEN** the application remains eligible for browser-provided installation using the existing manifest, icon, and service-worker setup

#### Scenario: Installed app launches as a coherent standalone shell
- **WHEN** a user launches the installed application from the desktop or app launcher
- **THEN** the frontend opens into a standalone app surface that preserves authenticated navigation and does not depend on browser-tab-specific UI to remain usable

#### Scenario: Installed app deep links remain routable
- **WHEN** a user refreshes or opens a client-side route after installation or standalone launch
- **THEN** the frontend preserves route access through the SPA fallback instead of failing with a routing error

## MODIFIED Requirements

### Requirement: Responsive app shell
The frontend SHALL provide a polished mobile-first application structure suitable for daily household use on phones and coherent standalone use when installed on larger screens.

#### Scenario: Handheld shell feels app-like
- **Given** a user opens the authenticated app on a phone-sized screen
- **When** the main authenticated pages render
- **Then** the layout uses consistent page framing, navigation placement, spacing rhythm, and safe-area handling so the product feels like one app shell rather than a centered desktop dashboard

#### Scenario: Key surfaces share one visual system
- **Given** a user navigates between core authenticated pages such as home, menu, and profile
- **When** each page loads
- **Then** headers, content spacing, bottom actions, and persistent navigation follow a shared visual system instead of page-specific dashboard conventions

#### Scenario: Wider screens preserve app coherence
- **Given** a user views the authenticated app on a tablet, laptop, or desktop-sized viewport
- **When** the shell adapts to the available width
- **Then** it remains visually intentional and installable-app-like instead of simply expanding phone content into a generic PC layout

#### Scenario: Deep-link navigation in production
- **Given** a user refreshes or opens a client-side route directly
- **When** the app is served from Cloudflare Pages
- **Then** the SPA fallback configuration preserves route access rather than failing with a server-side 404

## REMOVED Requirements

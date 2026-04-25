## ADDED Requirements

### Requirement: Cohesive expressive visual system
The frontend SHALL present core authenticated surfaces through a cohesive visual system that feels polished, playful, and mobile-native while remaining readable for everyday household planning tasks.

#### Scenario: Shared surfaces feel part of one family
- **WHEN** a user navigates between core authenticated pages such as home, menu, orders, profile, wishes, favorites, and achievements
- **THEN** cards, buttons, badges, section headers, chips, and highlighted actions use a shared visual language for radius, surface depth, accent treatment, and spacing rhythm instead of mixing flat utility styling with isolated expressive sections

#### Scenario: Brighter styling does not reduce readability
- **WHEN** the frontend applies brighter accents, softer backgrounds, and more expressive highlighted surfaces
- **THEN** important text, status cues, navigation labels, and action affordances remain visually clear and distinguishable without relying on low-contrast decoration alone

### Requirement: Friendly high-polish list and empty states
The frontend SHALL give list-heavy and empty-state surfaces a friendlier, more intentional presentation than simple dashed placeholders and utility cards.

#### Scenario: User opens a page with no content yet
- **WHEN** a core page such as orders, wishes, or favorites renders an empty state
- **THEN** the UI shows a welcoming, visually intentional empty state with stronger hierarchy, supportive copy, and a clear next action instead of only a generic bordered card with plain text

#### Scenario: User browses structured list content
- **WHEN** a page such as orders, wishes, profile history, or leaderboard data renders multiple entries
- **THEN** the UI groups and highlights those entries using purposeful card hierarchy, section rhythm, and action emphasis so scanning feels app-like rather than dashboard-like

## MODIFIED Requirements

### Requirement: Responsive app shell
The frontend SHALL provide a polished mobile-first application structure suitable for daily household use on phones and coherent standalone use when installed on larger screens, including a consistent expressive visual system across high-traffic authenticated surfaces.

#### Scenario: Handheld shell feels app-like
- **Given** a user opens the authenticated app on a phone-sized screen
- **When** the main authenticated pages render
- **Then** the layout uses consistent page framing, navigation placement, spacing rhythm, safe-area handling, and surface hierarchy so the product feels like one intentionally designed app shell rather than a centered desktop dashboard

#### Scenario: Key surfaces share one visual system
- **Given** a user navigates between core authenticated pages such as home, menu, profile, achievements, order detail, recipe detail, wishes, favorites, and order list
- **When** each page loads
- **Then** headers, cards, chips, content spacing, bottom actions, persistent navigation, and highlighted CTAs follow one shared visual system instead of page-specific dashboard conventions or isolated accent treatments

#### Scenario: Wider screens preserve app coherence
- **Given** a user views the authenticated app on a tablet, laptop, or desktop-sized viewport
- **When** the shell adapts to the available width
- **Then** it remains visually intentional and installable-app-like instead of simply expanding phone content into a generic PC layout

#### Scenario: Deep-link navigation in production
- **Given** a user refreshes or opens a client-side route directly
- **When** the app is served from Cloudflare Pages
- **Then** the SPA fallback configuration preserves route access rather than failing with a server-side 404

# Decisions - private-chef-v2

## Architecture Decisions
- Notification system: event-sourced with DB persistence (notification_events table)
- No Redis/Bull - use setTimeout/setInterval for async delivery
- P0 does NOT include comments/reviews tables (P1 only)
- OrderStatus extended: submitted/confirmed/preparing/completed/cancelled (keep 'pending' for backward compat)
- Image upload decoupled from recipe creation success state

## Task Dependencies
- T1 (DB Schema) must complete before T2 (notification service) and T4 (order API)
- T3 (TabBar/routes) must complete before T5, T6, T7, T9
- T4 must complete before T7 (order detail page)
- T8 must complete before T10, T11, T12

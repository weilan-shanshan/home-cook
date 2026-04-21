## Context

The current product has only one partial sharing implementation: orders can be marked as shared and expose a backend share-card payload, but the frontend still treats sharing as a logged interaction rather than a complete user-facing flow. Recipes, achievements, and today's menu recommendations are visible product moments with natural sharing value, yet no common share abstraction exists across those surfaces.

This change spans frontend UX, backend APIs, public share-page rendering, and shared contracts. The design must preserve the existing family-scoped data model for authenticated content creation while introducing a controlled public representation for distributed share pages, WeChat circulation, link copying, and downloadable posters with QR codes.

## Goals / Non-Goals

**Goals:**
- Define one product-level sharing model that works across orders, recipes, achievements, and daily menu content.
- Provide explicit share entry points on relevant frontend pages with consistent action language and success/error handling.
- Define backend endpoints and payloads for recording share actions, returning share-page data, and producing poster metadata for every supported share target.
- Support concrete user actions: copy link, open or circulate via WeChat, and download a poster image with a QR code.
- Reuse a common share channel vocabulary and response shape so frontend hooks and analytics do not special-case every content type.
- Preserve authenticated family scoping for underlying content authoring while exposing a sanitized public share representation intended for recipients.
- Allow the public share representation to include family name plus requester/cook identity when those values exist and are part of the intended story of the shared content.
- Generate downloadable posters in real time on the frontend rather than depending on backend-rendered images.

**Non-Goals:**
- Introduce full social-graph platform SDK integrations beyond the minimum needed to produce WeChat-friendly shareable pages.
- Redesign unrelated pages beyond adding share entry points and related card surfaces.
- Add arbitrary user-generated poster composition or a full marketing asset studio.

## Decisions

### 1. Use one logical sharing capability with target-specific APIs behind a common contract

- **Decision:** Keep a single conceptual sharing model (`targetType`, `targetId`, `channel`, `shareType`) while allowing target-specific backend routes and share-page/share-card payload builders.
- **Why:** The product wants consistent UX and analytics, but the underlying data sources differ substantially between orders, recipes, achievements, and daily menu aggregates.
- **Alternatives considered:**
  - One generic `/api/shares` router with polymorphic lookup. Rejected because each target has different authorization and data assembly needs, which would centralize too much branching in one route.
  - Fully separate ad hoc share implementations per page. Rejected because it would fragment contracts and duplicate frontend hook/state logic.

### 2. Treat share pages as the distributed destination and share-card payloads as the reusable assembly contract

- **Decision:** Every supported target should map to a stable share page URL, while backend APIs standardize on structured JSON payloads that power both the share page and poster generation.
- **Why:** The user explicitly wants share pages, copy links, WeChat-friendly distribution, and poster downloads. A stable share URL becomes the common denominator for all three outputs.
- **Alternatives considered:**
  - Generate poster images fully on the backend. Deferred because it raises rendering and storage complexity; a frontend or edge-rendered poster path can be decided during implementation.
  - Only record share counts without share pages. Rejected because it does not create a usable product share experience.

### 3. Model share pages as sanitized snapshots addressable by public share identifiers

- **Decision:** Share actions should generate or resolve a stable public share identifier that can be used in copied links, QR codes, and poster downloads.
- **Why:** Recipients opening a copied link or scanning a QR code need a route that works outside the authenticated family app shell.
- **Alternatives considered:**
  - Reuse authenticated app routes directly. Rejected because recipients outside the session would hit auth walls and fail to view the shared content.
  - Encode raw internal IDs directly in public URLs. Rejected because it exposes internal structure and weakens future access control.

### 4. Model achievements and daily menu sharing as aggregate targets, not persisted family resources

- **Decision:** Add dedicated share-card builders for achievements summary and daily menu summary even though they are aggregate views rather than row-backed entities.
- **Why:** These are user-visible surfaces with strong share intent, and forcing them into a fake persisted resource model would add unnecessary schema complexity.
- **Alternatives considered:**
  - Skip aggregate sharing until a generic share table exists. Rejected because the user explicitly wants these surfaces covered now.
  - Persist snapshot rows for every share attempt. Rejected because the summary can be assembled on demand and should stay derived unless audit requirements change.

### 5. Keep family scoping strict at source while allowing limited public share projections

- **Decision:** Public share pages SHALL expose only a curated subset of target data, but that subset MAY include family name and requester/cook display identity when those values exist and strengthen the storytelling value of the share.
- **Why:** The product is family-centered, and the user explicitly wants these human details visible. Privacy must therefore be preserved through careful field curation rather than removing all household context.
- **Alternatives considered:**
  - Keep all share output authenticated. Rejected because it would break copy-link, QR-scan, and WeChat recipient flows.

### 6. Define the frontend share UX as a layered action sheet pattern

- **Decision:** Relevant pages should expose a share trigger that opens lightweight share actions such as copy link, WeChat guidance or handoff, and poster download, backed by the same share payload and share URL.
- **Why:** This keeps the experience consistent across mobile and desktop PWA contexts while supporting the concrete channels the user requested.
- **Alternatives considered:**
  - Single-tap share with no intermediate UI. Rejected because capability support differs across browsers and some surfaces need multiple share outputs.
  - Full page share composer. Rejected as too large for the initial rollout.

### 7. Make the poster a downloadable image that always contains a QR code to the share page

- **Decision:** Poster downloads should be generated in real time on the frontend and should embed a QR code that resolves to the target's share page URL.
- **Why:** This matches the desired implementation model, reduces backend rendering complexity, and keeps poster output tightly aligned with the final client-side visual language.
- **Alternatives considered:**
  - Poster without QR code. Rejected because it breaks the user's requested download behavior.
  - QR code pointing to authenticated app routes. Rejected because recipients may not have an active session.
  - Backend-rendered poster images. Rejected for now because the user chose real-time frontend generation.

### 8. Use a concise, premium visual tone for WeChat distribution metadata and poster copy

- **Decision:** WeChat-facing titles, subtitles, and poster copy should be derived from target content plus the allowed family/requester/cook fields, but remain concise, visually calm, and premium rather than verbose or heavily promotional.
- **Why:** The user wants the shares to feel attractive, tasteful, and easy to forward, which favors short high-signal copy over feature-heavy text.
- **Alternatives considered:**
  - Generic template text shared across all targets. Rejected because it would feel flat and reduce click-through appeal.
  - Dense descriptive copy with many fields. Rejected because it weakens visual quality and scanability in WeChat contexts.

### 9. Use a hybrid visual language inspired by strong market share patterns rather than one single template

- **Decision:** The share system should combine several proven patterns: strong hero imagery and quiet copy hierarchy similar to lifestyle content cards, clear score or highlight chips similar to fitness or music recap cards, and QR-first conversion structure similar to local-services posters.
- **Why:** The product needs both emotional appeal and practical conversion. A pure content card is attractive but weak for scanning; a pure poster is functional but less likely to be forwarded.
- **Alternatives considered:**
  - One uniform poster template for all targets. Rejected because order, dish, achievements, and daily menu content do not carry the same storytelling center.
  - Highly decorative templates with many ornaments. Rejected because they age quickly and reduce perceived quality.

### 10. Define one premium base system with target-specific hero zones

- **Decision:** All share pages and posters should share one premium base system: generous whitespace, dark-text-on-light-card contrast, subtle warm neutral backgrounds, restrained accent color, rounded large-radius cards, and sparse but deliberate data chips. Within that system, each target gets a different hero emphasis.
- **Why:** This preserves brand consistency while letting each target surface the most compelling content.
- **Target-specific emphasis:**
  - **Order:** meal moment + dish list + requester/cook relationship
  - **Recipe:** food image + dish name + short sensory hook
  - **Achievements:** rank/score hero + family atmosphere + lightweight stats
  - **Daily menu:** curated meal combination + today's tone + easy decision feeling

### 11. Keep WeChat titles and summaries to a two-line mental model

- **Decision:** Share metadata should follow a two-line mental model: line 1 is the core hook, line 2 is the contextual softener. The actual payload may still be `title` and `summary`, but both should stay short enough to scan instantly in WeChat.
- **Why:** This matches high-performing social share previews where users decide in seconds whether to tap.
- **Content rules:**
  - `title` should usually stay within roughly 12-22 Chinese characters.
  - `summary` should usually stay within roughly 18-36 Chinese characters.
  - Avoid stacked punctuation, exclamation-heavy tone, or generic CTA spam.

### 12. Use target-specific copy templates with restrained emotional tone

- **Decision:** Copy templates should be deterministic enough for consistent implementation but flexible enough to feel human. Titles should foreground the object being shared; summaries should add family/requester/cook context only when it improves narrative value.
- **Why:** This gives the product a polished editorial feel without requiring manual writing.
- **Template direction:**
  - **Order title:** `<mealType><核心菜名/菜品组合>` or `<requester>点的<mealType>`
  - **Order summary:** `<familyName> · <requester>点单` and append `· <cook>掌勺` when present
  - **Recipe title:** `<recipeTitle>`
  - **Recipe summary:** `<familyName>私厨灵感` or `<cook/requester>推荐的家常味`
  - **Achievements title:** `<familyName>本期厨房成就` or `<displayName>的家庭成就卡`
  - **Achievements summary:** `点餐、掌勺与互动热度一页看完`
  - **Daily menu title:** `今天吃什么，已经替你想好了` or `<familyName>今日菜单`
  - **Daily menu summary:** `几道刚刚好的搭配，扫码就能看完整内容`

### 13. Make poster composition vertically structured, scannable, and screenshot-friendly

- **Decision:** Poster composition should follow a stable vertical structure that works well as a saved image in chat threads and Moments.
- **Why:** This layout pattern is familiar in high-performing service posters and makes screenshots, forwarding, and gallery browsing all work better.
- **Poster structure:**
  1. Top brand strip: small logo/brand mark + family name
  2. Hero zone: main image, rank block, or meal combination visual depending on target
  3. Core title: one strong line, max two lines
  4. Secondary context: requester/cook/family/date chips when available
  5. Supporting facts: 2-4 chips only, never dense paragraphs
  6. QR zone: QR code + short helper copy
  7. Bottom atmosphere line: calm brand sentence, not promotional clutter

### 14. Use different visual weights for the four share targets

- **Decision:** The four targets should not share identical hierarchy weights.
- **Why:** Different targets persuade through different cues.
- **Visual hierarchy guidance:**
  - **Order:** medium image weight, stronger relational/context chips, highest emphasis on "who ordered / who cooked"
  - **Recipe:** strongest image weight, minimal data chips, strongest appetite trigger
  - **Achievements:** strongest numeric/rank weight, image optional, medal/accent chip allowed but restrained
  - **Daily menu:** strongest composition/grouping weight, show 2-4 dishes as a set rather than one hero item dominating

### 15. Define QR helper copy as soft guidance instead of hard sell

- **Decision:** QR helper text should be inviting and understated.
- **Why:** Premium-feeling designs avoid loud CTA blocks.
- **Preferred helper copy directions:**
  - `扫码查看完整内容`
  - `长按识别，看看这份分享`
  - `扫码进入分享页`
  - `保存图片后扫码查看`

### 16. Define concrete wireframe families for share pages and posters

- **Decision:** The design should include explicit wireframe families for each target so implementation can preserve hierarchy, spacing intent, and content order without guessing.
- **Why:** Sharing surfaces are sensitive to visual rhythm. Small hierarchy mistakes can make the output feel ordinary even if all required data is present.
- **Wireframe rule:** Share pages and posters may differ in aspect ratio, but they should preserve the same information order per target.

#### Order Share Page Wireframe

```text
┌──────────────────────────────────────┐
│ 私厨分享                    FAMILY   │
│ 温暖的一餐，刚刚出锅                  │
├──────────────────────────────────────┤
│                                      │
│      [ 主视觉：1 张菜品/订单图 ]       │
│                                      │
├──────────────────────────────────────┤
│ 今晚这顿很值得分享                    │
│ 红烧排骨 / 清炒时蔬 / 玉米汤           │
│                                      │
│ [晚餐] [3道菜] [已完成]               │
│                                      │
│ 张三点单 · 李四掌勺                   │
│ 2026.04.19                           │
├──────────────────────────────────────┤
│ 这份订单里有什么                      │
│ • 红烧排骨 x1                         │
│ • 清炒时蔬 x1                         │
│ • 玉米汤 x1                           │
├──────────────────────────────────────┤
│              [ QR CODE ]             │
│            扫码查看完整内容            │
│         Private Chef · 私厨           │
└──────────────────────────────────────┘
```

#### Order Poster Wireframe

```text
┌──────────────────────────────┐
│ 私厨 / FAMILY                │
│                              │
│ [ Hero dish image ]          │
│                              │
│ 今晚这顿很值得分享            │
│ 红烧排骨 / 清炒时蔬 / 玉米汤   │
│                              │
│ 张三点单 · 李四掌勺           │
│ [晚餐] [3道菜] [刚刚完成]     │
│                              │
│             [QR]             │
│         扫码进入分享页        │
└──────────────────────────────┘
```

#### Recipe Share Page Wireframe

```text
┌──────────────────────────────────────┐
│ 私厨灵感                    FAMILY   │
│ 一道让人想立刻收藏的家常菜             │
├──────────────────────────────────────┤
│                                      │
│      [ 大图主视觉：菜品成品图 ]         │
│                                      │
├──────────────────────────────────────┤
│ 糖醋里脊                              │
│ 酸甜明亮，外酥里嫩                    │
│                                      │
│ [家常] [30分钟] [高频下单]            │
│                                      │
│ 来自 FAMILY 的私厨灵感                │
│ 李四推荐                              │
├──────────────────────────────────────┤
│ 为什么值得一试                        │
│ 口味平衡 / 上桌好看 / 家人接受度高      │
├──────────────────────────────────────┤
│              [ QR CODE ]             │
│            扫码查看做法与详情           │
│         Private Chef · 私厨           │
└──────────────────────────────────────┘
```

#### Recipe Poster Wireframe

```text
┌──────────────────────────────┐
│ FAMILY 私厨灵感              │
│                              │
│ [ Large food image ]         │
│                              │
│ 糖醋里脊                      │
│ 酸甜明亮，外酥里嫩            │
│                              │
│ [家常] [30分钟] [推荐]        │
│ 李四推荐                      │
│                              │
│             [QR]             │
│       扫码查看做法与详情      │
└──────────────────────────────┘
```

#### Achievements Share Page Wireframe

```text
┌──────────────────────────────────────┐
│ 家庭成就                    FAMILY   │
│ 这一段时间的厨房热度，被认真记录         │
├──────────────────────────────────────┤
│                                      │
│        #2                            │
│      李四的成就卡                     │
│                                      │
│   成就分 18                          │
│ [点餐 8] [掌勺 10] [分享 3]           │
│                                      │
├──────────────────────────────────────┤
│ 家庭本期亮点                          │
│ • 最常点：晚餐                        │
│ • 最活跃：李四                        │
│ • 最近大家都爱分享                    │
├──────────────────────────────────────┤
│              [ QR CODE ]             │
│            扫码查看完整榜单            │
│         Private Chef · 私厨           │
└──────────────────────────────────────┘
```

#### Achievements Poster Wireframe

```text
┌──────────────────────────────┐
│ FAMILY 家庭成就              │
│                              │
│            #2                │
│         李四的成就卡          │
│                              │
│         成就分 18             │
│ [点餐 8] [掌勺 10] [分享 3]   │
│                              │
│ 本期厨房热度，一页看完        │
│                              │
│             [QR]             │
│         扫码查看完整榜单      │
└──────────────────────────────┘
```

#### Daily Menu Share Page Wireframe

```text
┌──────────────────────────────────────┐
│ 今日菜单                    FAMILY   │
│ 今天吃什么，已经替你想好了             │
├──────────────────────────────────────┤
│                                      │
│ [ 菜品组合主视觉：2-4 道菜拼图 ]       │
│                                      │
├──────────────────────────────────────┤
│ 今日推荐组合                          │
│ 红烧鸡翅 / 蒜蓉西兰花 / 紫菜蛋汤        │
│                                      │
│ [适合晚餐] [均衡搭配] [家庭高频]       │
│                                      │
│ 来自 FAMILY 的今日菜单                │
│ 简单、稳妥、大家都愿意吃               │
├──────────────────────────────────────┤
│ 为什么今天适合这套                    │
│ 下饭 / 不费脑 / 搭配完整               │
├──────────────────────────────────────┤
│              [ QR CODE ]             │
│            扫码查看完整菜单            │
│         Private Chef · 私厨           │
└──────────────────────────────────────┘
```

#### Daily Menu Poster Wireframe

```text
┌──────────────────────────────┐
│ FAMILY 今日菜单              │
│                              │
│ [ 2-4 dish collage ]         │
│                              │
│ 今天吃什么，已经替你想好了    │
│ 红烧鸡翅 / 西兰花 / 蛋汤      │
│                              │
│ [均衡搭配] [适合晚餐]         │
│ 简单、稳妥、好吃              │
│                              │
│             [QR]             │
│         扫码查看完整菜单      │
└──────────────────────────────┘
```

### 17. Constrain typography and spacing so the premium feel survives implementation

- **Decision:** Typography and spacing rules should be explicit enough that the final output does not drift into generic dashboard styling.
- **Why:** The difference between premium and ordinary share assets often comes from spacing discipline rather than ornament.
- **Rules:**
  - Titles should occupy at most two lines.
  - Secondary summaries should occupy at most two lines.
  - Supporting fact chips should stay within 2-4 items.
  - Every poster should have one dominant visual zone only.
  - QR blocks should be visually calm and never compete with the title.
  - Decorative effects should be restrained to subtle shadow, soft border, mild gradient, and warm neutral surface layering.

### 18. Prefer warm editorial photography treatment over saturated app-banner treatment

- **Decision:** Food and menu imagery should favor warm, slightly editorial, appetite-led treatment rather than hyper-saturated promotional banners.
- **Why:** This keeps the product closer to tasteful recipe and lifestyle references and avoids cheapening the visual system.
- **Practical implication:**
  - Use one high-quality image when available rather than multiple low-quality thumbnails.
  - If imagery is weak, allow text-first layouts rather than forcing noisy collage effects except in daily-menu compositions where grouping is essential.

### 19. Define target-specific field inventories for share page, WeChat metadata, and poster rendering

- **Decision:** Each share target should have an explicit field inventory so implementation does not guess which data belongs in which presentation layer.
- **Why:** The same target may appear in three outputs: share page, WeChat metadata, and poster. Without a field matrix, outputs drift quickly.

#### Order field inventory

**Core identity fields**
- `familyName`
- `mealTypeLabel`
- `mealDate`
- `requesterDisplayName` when present
- `cookDisplayName` when present

**Hero content**
- `heroImageUrl` from the best available order item image
- `primaryDishNames` using 1-3 representative dish names
- `orderStatusLabel`

**Supporting facts**
- `dishCount`
- `items[]` with `recipeTitle` and `quantity`
- optional `noteSnippet` when short and suitable for public display

**WeChat metadata candidates**
- title: meal + representative dish or requester-led phrase
- summary: family/requester/cook line
- cover: `heroImageUrl`

**Poster-only emphasis**
- requester/cook relationship line
- compact meal/date chips
- QR helper copy

#### Recipe field inventory

**Core identity fields**
- `familyName`
- `recipeTitle`
- `authorOrRecommenderName` when suitable

**Hero content**
- `heroImageUrl` from recipe lead image
- `tasteHook` derived from description/tags/title context

**Supporting facts**
- `tagLabels[]`
- `cookMinutes` when present
- `favoriteCount` or `orderCount` if chosen as a light popularity signal

**WeChat metadata candidates**
- title: recipe title
- summary: short taste hook + family/recommender context
- cover: `heroImageUrl`

**Poster-only emphasis**
- single image dominance
- 2-3 light chips only

#### Achievements field inventory

**Core identity fields**
- `familyName`
- `displayName` for the featured user or household subject
- `rank`

**Hero content**
- `score`
- key stat chips such as `orderCount`, `cookCount`, `shareCount`

**Supporting facts**
- `highlightLines[]` derived from leaderboard or summary insights
- optional `memberCount` or `activeMembers` if used sparingly

**WeChat metadata candidates**
- title: family achievement card or personal achievement card
- summary: one-line recap of points, cooking, and interaction heat
- cover: generated score-first preview or branded fallback image when no rich image exists

**Poster-only emphasis**
- oversized rank/score block
- restrained accent medal treatment

#### Daily menu field inventory

**Core identity fields**
- `familyName`
- `menuDateLabel` or implied "today"

**Hero content**
- `menuItems[]` with 2-4 recommended dishes
- `heroCollageImages[]` using up to 4 images

**Supporting facts**
- `menuReasonChips[]` such as balanced, easy, popular, dinner-friendly
- optional `shortMenuMood`

**WeChat metadata candidates**
- title: today's menu hook
- summary: curated combination line
- cover: collage or strongest representative dish image

**Poster-only emphasis**
- grouped composition over single-image dominance
- concise reason chips

### 20. Define deterministic WeChat metadata rules for title, summary, and cover selection

- **Decision:** WeChat metadata should be rule-based and deterministic so sharers get consistently good output without manual editing.
- **Why:** Good sharing systems feel intentional because the default copy is already usable.

#### Order metadata rules

- **Title priority:**
  1. `<requesterDisplayName>点的<mealTypeLabel>` when requester exists and reads naturally
  2. `<mealTypeLabel> · <primaryDishName>`
  3. `<primaryDishName1> / <primaryDishName2>`
- **Summary priority:**
  1. `<familyName> · <requesterDisplayName>点单 · <cookDisplayName>掌勺`
  2. `<familyName> · <requesterDisplayName>点单`
  3. `<familyName>的一顿家常好饭`
- **Cover priority:**
  1. best order-item image
  2. share-page hero composition snapshot
  3. branded fallback with meal chip and dish names

#### Recipe metadata rules

- **Title priority:**
  1. `<recipeTitle>`
  2. `<recipeTitle>，很适合今天这顿`
- **Summary priority:**
  1. `<tasteHook> · 来自<familyName>的私厨灵感`
  2. `<authorOrRecommenderName>推荐的家常味`
  3. `一道值得收藏的家常菜`
- **Cover priority:**
  1. recipe hero image
  2. cropped poster hero image
  3. branded fallback with recipe title

#### Achievements metadata rules

- **Title priority:**
  1. `<familyName>本期厨房成就`
  2. `<displayName>的家庭成就卡`
- **Summary priority:**
  1. `点餐、掌勺与互动热度，一页看完`
  2. `看看这段时间谁最活跃`
- **Cover priority:**
  1. generated score/rank hero card
  2. branded gradient card with key stats

#### Daily menu metadata rules

- **Title priority:**
  1. `今天吃什么，已经替你想好了`
  2. `<familyName>今日菜单`
- **Summary priority:**
  1. `<menuItem1> / <menuItem2> / <menuItem3>`
  2. `几道刚刚好的搭配，今晚照着吃就行`
- **Cover priority:**
  1. 2-4 dish collage
  2. strongest dish image
  3. branded fallback with menu title and chips

#### Global metadata constraints

- Do not exceed two semantic lines of meaning.
- Prefer concrete nouns over abstract adjectives.
- Avoid forced excitement such as repeated exclamation marks.
- If a field is missing, degrade gracefully instead of inserting placeholders.
- If generated copy feels redundant with the title, shorten the summary rather than repeating.

### 21. Define color-token directions for premium but differentiated outputs

- **Decision:** Use one warm premium baseline palette with target-specific accent families.
- **Why:** This keeps the ecosystem coherent while letting users instantly feel the difference between recipe, order, achievement, and menu shares.

#### Global base tokens

- `share.bg.base`: warm off-white / soft rice tone
- `share.surface.card`: pure white with low-contrast border
- `share.text.primary`: deep charcoal
- `share.text.secondary`: muted warm gray
- `share.border.soft`: low-contrast beige-gray
- `share.shadow.soft`: shallow warm shadow

#### Target accent families

- **Order accents:** muted amber, tea brown, cooked-gold
  - emotional cue: warmth, human meal moment
- **Recipe accents:** tomato red, herb green, apricot orange used sparingly
  - emotional cue: appetite, freshness, craft
- **Achievements accents:** champagne gold, soft plum, graphite
  - emotional cue: status, recap, pride
- **Daily menu accents:** sage green, oat beige, muted orange
  - emotional cue: ease, balance, everyday decision comfort

#### Usage rules

- One dominant accent per target, one supporting accent at most.
- Accent color should appear mainly in chips, micro-icons, thin dividers, and score blocks.
- Large gradient areas should remain soft and low-saturation.
- QR zone should remain neutral to preserve legibility.

### 22. Define consistency rules across share page, poster, and metadata outputs

- **Decision:** The three outputs for a given share target must feel like one system, not three separate designs.
- **Why:** Inconsistent outputs reduce trust and make the product feel unfinished.

#### Must-match rules

- The primary title theme must stay semantically aligned across share page, poster, and WeChat title.
- The same `familyName`, `requesterDisplayName`, and `cookDisplayName` visibility rules must apply across all outputs.
- The hero image selection logic must be shared between page, poster, and metadata cover wherever possible.
- The QR target must always resolve to the same share page URL used by copied links.
- Supporting chips on the poster should be a subset of the share page facts, never a contradictory set.

#### Allowed differences

- Poster copy may be shorter than share-page copy.
- WeChat summary may be more condensed than poster subtitle.
- Share page may contain 1-2 extra supporting modules that are omitted from the poster.

#### Fallback rules

- If no strong image exists, both share page and poster should shift to a text-first composition instead of inventing decorative placeholders.
- If requester/cook fields are absent, drop the relationship line cleanly rather than reserving blank space.
- If family name is unavailable for a target, preserve layout by elevating the content title rather than adding a generic family label.

## Risks / Trade-offs

- **[Risk]** Public share pages could leak more data than intended. -> **Mitigation:** Define per-target public payload subsets and avoid exposing operational or family-management fields.
- **[Risk]** Showing family name and requester/cook identity increases sensitivity of public shares. -> **Mitigation:** Limit these fields to display-oriented names only, show requester/cook only when values exist, and exclude contact or account-management information.
- **[Risk]** Four share targets can create inconsistent cards or naming drift. -> **Mitigation:** Introduce shared contract fields and one frontend interaction pattern before page-specific polish.
- **[Risk]** Aggregate share targets such as achievements and daily menu may become stale between fetch and user action. -> **Mitigation:** Build cards from current server data on demand and treat them as snapshots at share time.
- **[Risk]** Backend route growth may duplicate validation and logging logic. -> **Mitigation:** Centralize shared validation/channel vocabularies and share-record service helpers where practical during implementation.
- **[Risk]** Order sharing already exists and could regress during migration. -> **Mitigation:** Preserve the existing order routes while aligning them to the new contract incrementally.
- **[Risk]** WeChat sharing behavior differs between direct browser share, in-app open, and image forwarding. -> **Mitigation:** Treat WeChat support as WeChat-friendly page metadata plus stable share links and poster downloads, not as a hard dependency on a proprietary SDK unless later required.
- **[Risk]** Frontend real-time poster generation may produce visual or performance inconsistencies across devices. -> **Mitigation:** Keep poster layout deterministic, constrain asset sizes, and verify output quality on representative mobile devices.
- **[Risk]** Borrowing too many market patterns could make the result feel derivative or over-designed. -> **Mitigation:** Keep one restrained design system, use inspiration only at the level of information hierarchy and emotional tone, and avoid decorative mimicry.

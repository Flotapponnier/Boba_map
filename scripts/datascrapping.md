# Luma Event Data Scraping Strategy

## Overview

This document outlines the approach for scraping ETH Denver 2026 events from Luma to pre-populate the Boba Map application.

## Research Findings

### Location Data Structure

Luma events include the following location-related fields:

```json
{
  "geo_latitude": "39.7392",
  "geo_longitude": "-104.9903",
  "geo_address_info": {
    "address": "123 Main St",
    "city": "Denver",
    "region": "Colorado",
    "country": "United States",
    "full_address": "123 Main St, Denver, CO, United States",
    "place_id": "ChIJ..."
  },
  "geo_address_visibility": "public" | "shown" | "private"
}
```

### Visibility Modes

| Mode | Behavior |
|------|----------|
| `public` | Location visible to anyone without registration |
| `shown` | Location hidden until user registers for event |
| `private` | Location never exposed via API, only in email confirmation |

### Official API Limitations

- **Requirement:** Luma Plus subscription (not available)
- **Base URL:** `https://public-api.luma.com`
- **Auth:** `x-luma-api-key` header
- **Rate Limits:** 500 GET requests / 5 minutes per calendar

## Selected Approach: Claude Code Web Browser Control

### Why Browser Control Wins

1. **No API subscription required** - Works without Luma Plus
2. **Handles conditional logic** - Can detect if registration is needed
3. **Flexible** - Adapts to different event configurations
4. **Email parsing capability** - Can extract location from confirmation emails if needed
5. **No setup overhead** - No Puppeteer/Playwright configuration

### Workflow

```
1. Navigate to event page
   ↓
2. Check if location data is visible
   ├─→ YES: Extract and store
   └─→ NO: Continue to registration
          ↓
3. Fill registration form (name, email)
   ↓
4. Submit registration
   ↓
5. Fetch updated location data
   ├─→ Location visible: Extract and store
   └─→ Location still hidden: Parse email for address
          ↓
6. Store complete event data
```

### Target URLs

- **ETH Denver 2026 main page:** `https://luma.com/ethdenverfeb?period=past&e=calev-v8wY9Di2lRVCtXQ`
- **Individual event example:** `https://luma.com/1whk73qd?tk=cXRxH1`

## Output Data Schema

Each scraped event should produce:

```typescript
interface ScrapedEvent {
  name: string;
  description: string;
  start_at: string;        // ISO 8601 format
  end_at: string;          // ISO 8601 format
  url: string;
  cover_image?: string;
  location: {
    address: string;
    city: string;
    region?: string;
    country: string;
    latitude: number;
    longitude: number;
    full_address: string;
  };
  organizer?: {
    name: string;
    url?: string;
  };
  attendee_count?: number;
  registration_required: boolean;
  scraped_at: string;
}
```

## Implementation Notes

### Browser Control Commands

When running with Claude Code Web:

```bash
# Navigate to event page
navigate https://luma.com/ethdenverfeb

# Check for location visibility
querySelector "[data-location]" or .location-section

# Extract location data
getAttribute .geo-latitude data-lat or similar

# Fill registration if needed
type input[name="name"] "Your Name"
type input[name="email"] "your@email.com"
click button[type="submit"]

# Parse confirmation email for address
# (if location still hidden after registration)
```

### Error Handling

- **Rate limiting:** Add delays between requests
- **CAPTCHA:** May require manual intervention
- **Login walls:** Consider using personal Google account login
- **Missing location:** Fall back to email parsing or manual entry

## Next Steps

1. Run Claude Code Web browser session
2. Navigate to ETH Denver Luma calendar
3. Loop through all past events (Feb 2026)
4. Apply registration flow where needed
5. Store results in JSON format for import into Boba Map

## Estimated Effort

- **Scraping time:** ~5-10 seconds per event
- **Total events:** Depends on ETH Denver 2026 lineup (likely 50-200 events)
- **Estimated runtime:** 10-30 minutes for full scrape

# 🌍 Real-Time Analytics System

A comprehensive real-time visitor tracking and analytics system with 3D globe visualization, similar to Shopify's analytics dashboard.

## ✨ Features

- **Real-time visitor tracking** with live updates
- **3D Globe visualization** showing visitor locations worldwide
- **Geographic analytics** with country and city-level data
- **Session tracking** with page views and activity monitoring
- **API endpoints** for external website integration
- **CORS support** for cross-domain tracking
- **Automatic cleanup** of old visitor sessions
- **Privacy-focused** - no sensitive data stored in localStorage

## 🏗️ Architecture

### Components

1. **LiveVisitorsGlobe** - 3D globe component using react-globe.gl
2. **VisitorTracker** - Client-side tracking component
3. **Analytics API** - RESTful endpoints for data collection and retrieval
4. **Convex Backend** - Real-time database with visitor sessions

### Data Flow

```
Website Visitor → Tracking Script → API Endpoint → Convex Database → Analytics Dashboard
```

## 📊 Analytics Dashboard

The analytics dashboard (`/dashboard/analytics`) includes:

- **Live visitor count** with real-time updates
- **3D globe visualization** showing visitor locations
- **Geographic statistics** (countries, cities, active locations)
- **Session metrics** (page views, average session duration)
- **Top locations** ranked by visitor count

## 🔧 API Endpoints

### Track Visitor
```
POST /api/v1/analytics/track-visitor
```
Records visitor activity and location data.

**Request Body:**
```json
{
  "sessionId": "session_123456789_abc123",
  "page": "/products",
  "country": "United States",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "referrer": "https://google.com"
}
```

### Get Live Visitors
```
GET /api/v1/analytics/live-visitors
```
Returns current online visitors (requires API key).

### Get Visitor Locations
```
GET /api/v1/analytics/visitor-locations
```
Returns geographic data for globe visualization (requires API key).

### Cleanup Old Sessions
```
POST /api/v1/analytics/cleanup
```
Removes visitor sessions older than 24 hours (admin only).

## 🌐 Website Integration

### Method 1: Auto-initialization
```html
<script 
  src="https://your-admin-domain.com/analytics-tracker.js"
  data-api-url="https://your-admin-domain.com/api/v1/analytics/track-visitor"
  data-debug="false">
</script>
```

### Method 2: Manual initialization
```html
<script src="https://your-admin-domain.com/analytics-tracker.js"></script>
<script>
  BenzochemAnalytics.init({
    apiUrl: 'https://your-admin-domain.com/api/v1/analytics/track-visitor',
    trackingEnabled: true,
    debug: false
  });
</script>
```

## 🔒 Security & Privacy

- **No sensitive data** stored in browser localStorage
- **IP-based geolocation** (no GPS tracking)
- **Session-based tracking** (not user-based)
- **CORS protection** with configurable origins
- **API key authentication** for data access
- **Automatic data cleanup** (24-hour retention)

## 🛠️ Configuration

### Environment Variables
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### Tracking Configuration
```javascript
{
  apiUrl: 'string',           // Required: API endpoint URL
  trackingEnabled: boolean,   // Enable/disable tracking
  trackingInterval: number,   // Tracking frequency (ms)
  heartbeatInterval: number,  // Heartbeat frequency (ms)
  debug: boolean             // Debug logging
}
```

## 📈 Database Schema

### visitor_sessions
```typescript
{
  sessionId: string,          // Unique session identifier
  ipAddress: string,          // Visitor IP address
  userAgent: string,          // Browser user agent
  country: string,            // Country name
  city: string,               // City name
  latitude: number,           // Geographic latitude
  longitude: number,          // Geographic longitude
  currentPage: string,        // Current page path
  referrer: string,           // Referrer URL
  startTime: number,          // Session start timestamp
  lastSeen: number,           // Last activity timestamp
  pageViews: number,          // Total page views
  isActive: boolean           // Session active status
}
```

## 🎯 Usage Examples

### Basic Tracking
```javascript
// Initialize tracking
BenzochemAnalytics.init({
  apiUrl: '/api/v1/analytics/track-visitor'
});

// Manual tracking
BenzochemAnalytics.track();

// Get session ID
const sessionId = BenzochemAnalytics.getSessionId();
```

### Advanced Configuration
```javascript
BenzochemAnalytics.init({
  apiUrl: '/api/v1/analytics/track-visitor',
  trackingEnabled: true,
  trackingInterval: 120000,  // 2 minutes
  heartbeatInterval: 30000,  // 30 seconds
  debug: true
});

// Update configuration
BenzochemAnalytics.updateConfig({
  trackingEnabled: false
});

// Enable/disable tracking
BenzochemAnalytics.enable();
BenzochemAnalytics.disable();
```

## 🧪 Testing

### Test Pages
- `/analytics-demo` - Live analytics demonstration
- `/test-analytics.html` - Tracking functionality test

### Manual Testing
1. Visit the test page: `http://localhost:3001/test-analytics.html`
2. Open browser console to see tracking logs
3. Check analytics dashboard: `http://localhost:3001/dashboard/analytics`
4. Verify real-time updates on the 3D globe

### API Testing
```bash
# Test tracking endpoint
curl -X POST http://localhost:3001/api/v1/analytics/track-visitor \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session",
    "page": "/test",
    "country": "United States",
    "city": "New York"
  }'
```

## 🔄 Real-time Updates

The system provides real-time updates through:
- **30-second refresh intervals** for live data
- **Automatic session tracking** with activity detection
- **Page visibility API** for accurate online status
- **Heartbeat mechanism** for continuous monitoring

## 🌟 Features Comparison

| Feature | Our System | Shopify Analytics |
|---------|------------|-------------------|
| 3D Globe | ✅ | ✅ |
| Real-time tracking | ✅ | ✅ |
| Geographic data | ✅ | ✅ |
| Session analytics | ✅ | ✅ |
| API integration | ✅ | ✅ |
| Privacy-focused | ✅ | ✅ |
| Custom domains | ✅ | ❌ |
| Open source | ✅ | ❌ |

## 🚀 Performance

- **Lightweight tracking script** (~15KB minified)
- **Efficient API endpoints** with response caching
- **Optimized database queries** with proper indexing
- **Automatic cleanup** prevents data bloat
- **Throttled requests** to prevent spam

## 🔧 Maintenance

### Regular Tasks
1. **Monitor API usage** and rate limits
2. **Review cleanup logs** for data retention
3. **Update geolocation database** if needed
4. **Check CORS configuration** for new domains

### Troubleshooting
- Check browser console for tracking errors
- Verify API endpoint accessibility
- Confirm CORS headers for cross-domain requests
- Review Convex database connection status

## 📝 License

This analytics system is part of the Benzochem Industries admin dashboard and follows the same licensing terms.
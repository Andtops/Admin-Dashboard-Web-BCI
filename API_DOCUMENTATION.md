# Benzochem Industries API Documentation

## Overview

The Benzochem Industries API provides secure, programmatic access to chemical products, collections, and analytics data. This RESTful API uses industry-standard authentication and follows best practices for security and rate limiting.

## Base URL

```
Production: https://admin.benzochem.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### API Key Format

Benzochem API keys follow a structured format for security and identification:

```
bzk_[environment]_[32_random_chars][4_checksum_chars]
```

Examples:
- Live environment: `bzk_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r`
- Test environment: `bzk_test_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i`

### Authentication Methods

#### 1. Authorization Header (Recommended)
```http
Authorization: Bearer <your_api_key>
```

#### 2. Custom Header
```http
X-API-Key: <your_api_key>
```

#### 3. Query Parameter (Not recommended for production)
```http
GET /api/v1/products?api_key=<your_api_key>
```

## Rate Limits

Rate limits are enforced per API key and vary by subscription tier:

### Standard Tier
- **Per minute**: 100 requests
- **Per hour**: 5,000 requests  
- **Per day**: 50,000 requests
- **Burst limit**: 150 requests

### Premium Tier
- **Per minute**: 500 requests
- **Per hour**: 25,000 requests
- **Per day**: 250,000 requests
- **Burst limit**: 750 requests

### Enterprise Tier
- **Per minute**: 2,000 requests
- **Per hour**: 100,000 requests
- **Per day**: 1,000,000 requests
- **Burst limit**: 3,000 requests

### Rate Limit Headers

All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Permissions

API keys are granted specific permissions that control access to different resources:

| Permission | Description |
|------------|-------------|
| `products:read` | Read product information |
| `products:write` | Create and update products |
| `products:delete` | Delete products |
| `collections:read` | Read collection information |
| `collections:write` | Create and update collections |
| `collections:delete` | Delete collections |
| `quotations:read` | Read quotation requests and history |
| `quotations:write` | Create and update quotation requests |
| `analytics:read` | Read analytics data |
| `webhooks:read` | Read webhook configurations |
| `webhooks:write` | Create and update webhooks |

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | API key is missing or invalid |
| `FORBIDDEN` | 403 | API key lacks required permissions |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INVALID_LIMIT` | 400 | Request limit parameter is invalid |
| `MISSING_FIELD` | 400 | Required field is missing |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Endpoints

### Products

#### List Products
```http
GET /api/v1/products
```

**Parameters:**
- `limit` (optional): Number of products to return (max 100, default 50)
- `offset` (optional): Number of products to skip (default 0)
- `search` (optional): Search term for product title or description
- `status` (optional): Filter by status (`active`, `inactive`, `discontinued`)
- `featured` (optional): Filter by featured status (`true`, `false`)

**Required Permission:** `products:read`

**Example Request:**
```bash
curl -H "Authorization: Bearer <your_api_key>" \
     "https://admin.benzochem.com/api/v1/products?limit=10&featured=true"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "title": "Sodium Chloride",
      "description": "High purity sodium chloride for laboratory use",
      "casNumber": "7647-14-5",
      "purity": "99.9%",
      "priceRange": {
        "minVariantPrice": {
          "amount": "25.00",
          "currencyCode": "USD"
        }
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Product
```http
POST /api/v1/products
```

**Required Permission:** `products:write`

**Request Body:**
```json
{
  "title": "Product Name",
  "description": "Product description",
  "casNumber": "123-45-6",
  "purity": "99.5%",
  "priceRange": {
    "minVariantPrice": {
      "amount": "50.00",
      "currencyCode": "USD"
    }
  }
}
```

### Collections

#### List Collections
```http
GET /api/v1/collections
```

**Required Permission:** `collections:read`

#### Create Collection
```http
POST /api/v1/collections
```

**Required Permission:** `collections:write`

### Quotations

#### List Quotations
```http
GET /api/v1/quotations
```

**Parameters:**
- `limit` (optional): Number of quotations to return (max 100, default 50)
- `offset` (optional): Number of quotations to skip (default 0)
- `userId` (optional): Filter by specific user ID
- `status` (optional): Filter by status (`pending`, `processing`, `quoted`, `accepted`, `rejected`, `expired`)

**Required Permission:** `quotations:read`

**Example Request:**
```bash
curl -H "Authorization: Bearer <your_api_key>" \
     "https://admin.benzochem.com/api/v1/quotations?limit=10&status=pending"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "quot_123",
      "userId": "user_456",
      "userEmail": "customer@example.com",
      "userName": "John Doe",
      "businessName": "ABC Chemicals",
      "products": [
        {
          "productId": "prod_789",
          "productName": "Sodium Chloride",
          "quantity": "100",
          "unit": "kg",
          "specifications": "99.9% purity"
        }
      ],
      "status": "pending",
      "createdAt": 1640995200000,
      "updatedAt": 1640995200000
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Quotation
```http
POST /api/v1/quotations
```

**Required Permission:** `quotations:write`

**Request Body:**
```json
{
  "userId": "user_456",
  "userEmail": "customer@example.com",
  "userName": "John Doe",
  "userPhone": "+1234567890",
  "businessName": "ABC Chemicals",
  "products": [
    {
      "productId": "prod_789",
      "productName": "Sodium Chloride",
      "quantity": "100",
      "unit": "kg",
      "specifications": "99.9% purity"
    }
  ],
  "additionalRequirements": "Need COA and MSDS",
  "deliveryLocation": "New York, NY",
  "urgency": "standard"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "quot_123",
    "message": "Quotation created successfully"
  },
  "meta": {
    "apiKeyId": "key_abc123",
    "environment": "live",
    "timestamp": 1640995200000
  }
}
```

### Analytics

#### Get Overview Analytics
```http
GET /api/v1/analytics/overview
```

**Parameters:**
- `start_date` (optional): Start date in ISO 8601 format (YYYY-MM-DD)
- `end_date` (optional): End date in ISO 8601 format (YYYY-MM-DD)

**Required Permission:** `analytics:read`

### Webhooks

#### List Webhooks
```http
GET /api/v1/webhooks
```

**Required Permission:** `webhooks:read`

#### Create Webhook
```http
POST /api/v1/webhooks
```

**Required Permission:** `webhooks:write`

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["product.created", "product.updated"],
  "isActive": true
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const BenzochemAPI = {
  baseURL: 'https://admin.benzochem.com/api/v1',
  apiKey: '<your_api_key>',
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products?${query}`);
  },
  
  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }
};

// Usage
const products = await BenzochemAPI.getProducts({ limit: 10, featured: true });
```

### Python

```python
import requests

class BenzochemAPI:
    def __init__(self, api_key, base_url='https://admin.benzochem.com/api/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def get_products(self, **params):
        response = self.session.get(f'{self.base_url}/products', params=params)
        response.raise_for_status()
        return response.json()
    
    def create_product(self, product_data):
        response = self.session.post(f'{self.base_url}/products', json=product_data)
        response.raise_for_status()
        return response.json()

# Usage
api = BenzochemAPI('<your_api_key>')
products = api.get_products(limit=10, featured=True)
```

## Best Practices

### Security
1. **Never expose API keys in client-side code**
2. **Use environment variables** to store API keys
3. **Rotate keys regularly** (recommended: every 90 days)
4. **Use test keys** for development and testing
5. **Monitor API key usage** for suspicious activity

### Performance
1. **Implement caching** for frequently accessed data
2. **Use pagination** for large datasets
3. **Batch requests** when possible
4. **Handle rate limits** gracefully with exponential backoff

### Error Handling
1. **Always check the `success` field** in responses
2. **Implement retry logic** for transient errors
3. **Log errors** for debugging and monitoring
4. **Handle rate limit errors** with appropriate delays

## Support

- **Documentation**: https://docs.benzochem.com/api
- **Support Email**: api-support@benzochem.com
- **Status Page**: https://status.benzochem.com

## Changelog

### v1.0.0 (Current)
- Initial API release
- Products and collections endpoints
- Analytics and webhooks support
- Comprehensive authentication and rate limiting

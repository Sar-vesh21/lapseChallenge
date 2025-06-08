# API Documentation

## Base URL

```
http://localhost:3000/api
```

---

## Health Check

**GET** `/health`

- **Description:** Returns the health status of the API.
- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

---

## Get Feed Posts

**GET** `/feed?start=<start>&end=<end>`

- **Description:** Retrieves a paginated list of feed posts from the cache.
- **Query Parameters:**
  - `start` (integer, required): Start index for pagination.
  - `end` (integer, required): End index for pagination.
- **Response:**
  ```json
  [
    {
      "id": "string",
      "type": "like | comment | follow",
      "actor": {
        "id": "string",
        "username": "string",
        "avatar_url": "string"
      },
      "target": {
        "id": "string",
        "type": "post | comment",
        "preview_url": "string"
      },
      "created_at": "ISO8601 timestamp",
      "read": true
    }
  ]
  ```
- **Notes:**  
  - If the requested range is near the end of the cached items, the system will asynchronously warm up the cache in the background.

---

## Mark Feed Post as Read

**POST** `/feed/read`

- **Description:** Marks a feed post as read and removes it from the cache (write-back).
- **Request Body:**
  ```json
  {
    "feedPost_id": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Feed post marked as read"
  }
  ```
- **Notes:**  
  - The operation is asynchronous; the cache is updated immediately, and the database is updated in the background.

---

## Error Responses

- All endpoints return standard HTTP error codes and a JSON error message:
  ```json
  {
    "error": "Error message"
  }
  ``` 
---
title: API Reference
description: Complete reference for the AnimeStream API
dateAdded: 2024-03-21
lastUpdated: 2024-03-21
author: "1248626823638552701"
tags: ["api", "reference"]
icon: "globe"
order: 1
---

# API Reference

AnimeStream provides a RESTful API for interacting with the platform. This documentation covers all available endpoints, authentication, and common usage patterns.

## Authentication

All API endpoints require authentication using Discord OAuth2. After authentication, your session token will be automatically included in requests.

:::callout{type="important"}
Keep your authentication tokens secure and never share them publicly.
:::

## Base URL

All API endpoints are available at `https://anime.choco.rip/api`.


## Common Endpoints

### Get All Anime

:::api-tester
{
    "endpoint": "/api/anime",
    "method": "GET",
    "description": "Retrieve a list of all anime in the database"
}
:::

### Get Anime Details

:::api-tester
{
    "endpoint": "/api/anime/{id}",
    "method": "GET",
    "description": "Get detailed information about a specific anime",
    "params": [
        {
            "name": "id",
            "type": "path",
            "description": "Unique identifier of the anime",
            "required": true
        }
    ]
}
:::

### Search Anime

:::api-tester
{
    "endpoint": "/api/search",
    "method": "GET",
    "description": "Search for anime by title or other criteria",
    "params": [
        {
            "name": "q",
            "type": "query",
            "description": "Search query string",
            "required": true
        }
    ],
    "responses": [
        {
            "status": 400,
            "description": "Bad Request",
            "example": {
                "error": "Search query required"
            }
        }
    ]
}
:::

### Get Recent Anime

:::api-tester
{
    "endpoint": "/api/recent",
    "method": "GET",
    "description": "Get recently added anime",
    "params": [
        {
            "name": "limit",
            "type": "query",
            "description": "Maximum number of results to return",
            "default": "10"
        }
    ]
}
:::

### Get All Genres

:::api-tester
{
    "endpoint": "/api/genres",
    "method": "GET",
    "description": "Get a list of all available anime genres"
}
:::

### Get Anime by Genre

:::api-tester
{
    "endpoint": "/api/genres/{genre}",
    "method": "GET",
    "description": "Get all anime belonging to a specific genre",
    "params": [
        {
            "name": "genre",
            "type": "path",
            "description": "Genre name to filter by",
            "required": true
        }
    ]
}
:::

### Get Platform Statistics

:::api-tester
{
    "endpoint": "/api/stats",
    "method": "GET",
    "description": "Get platform-wide statistics",
    "responses": [
        {
            "status": 200,
            "description": "Success",
            "example": {
                "totalAnime": 100,
                "totalEpisodes": 1200,
                "totalUsers": 500,
                "newThisWeek": 5,
                "activeUsers": 250,
                "genres": ["Action", "Comedy", "Drama"]
            }
        }
    ]
}
:::
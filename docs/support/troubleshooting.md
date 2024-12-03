---
title: Troubleshooting Guide
description: Common issues and their solutions
dateAdded: 2024-12-01T21:50:34.061Z
lastUpdated: 2024-12-01T21:50:34.061Z
author: "1248626823638552701"
tags: ["support", "troubleshooting"]
icon: "question"
order: 1
---

# Troubleshooting Guide

## Common Issues

### Authentication Issues

#### Discord Login Not Working

1. Check your Discord application configuration
2. Verify OAuth2 redirect URI matches your BASE_URL
3. Ensure all environment variables are set correctly
4. Check server logs for specific error messages

#### Session Expires Too Quickly

1. Check `sessionConfig` settings
2. Verify cookie settings in production environment
3. Ensure secure flag is set appropriately

### Media Playback Issues

#### Videos Not Playing

1. Check file permissions
2. Verify file format is supported (MP4 recommended)
3. Ensure media directory is properly configured
4. Check browser console for errors

### Database Issues

#### Connection Errors

1. Verify Supabase credentials
2. Check network connectivity
3. Ensure database is accessible from server

#### Data Not Updating

1. Clear browser cache
2. Check database permissions
3. Verify API endpoints are working

## Performance Issues

### Slow Loading Times

1. Check server resources
2. Verify database query performance
3. Enable caching
4. Optimize media files

### High Memory Usage

1. Check media processing
2. Monitor cache size
3. Review database connections
4. Check for memory leaks

## Getting Help

1. Check existing [GitHub Issues](https://github.com/chocoOnEstrogen/AnimeStream/issues)
2. Join our [Discord Server](/discord)
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Logs (if applicable) 
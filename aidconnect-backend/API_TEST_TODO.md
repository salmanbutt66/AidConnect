# AidConnect API Test TODO

Use this as a live endpoint tracker while debugging.

How to use:
1. Keep everything in `Pending` initially.
2. After an endpoint works, either:
   - delete that line from `Pending`, or
   - move it to `Passed`.
3. If an endpoint fails, note the error beside it.

## Pending

### Health
- [ ] GET /api/health

### Auth (/api/auth)
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/refresh-token
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me
- [ ] PUT /api/auth/update-profile
- [ ] PUT /api/auth/change-password
- [ ] DELETE /api/auth/delete-account

### Auth Admin Surface (/api/auth/users) [legacy/duplicate admin surface]
- [ ] GET /api/auth/users
- [ ] PUT /api/auth/users/:id/ban
- [ ] PUT /api/auth/users/:id/unban
- [ ] PUT /api/auth/users/:id/role
- [ ] DELETE /api/auth/users/:id

### Users (/api/users)
- [ ] GET /api/users/profile
- [ ] PATCH /api/users/profile
- [ ] PATCH /api/users/profile/picture
- [ ] PATCH /api/users/change-password
- [ ] GET /api/users/my-requests
- [ ] GET /api/users/my-requests/:id
- [ ] POST /api/users/rate
- [ ] GET /api/users/volunteer/:id/ratings
- [ ] PATCH /api/users/notification-preferences

### Requests (/api/requests)
- [ ] POST /api/requests/
- [ ] GET /api/requests/my
- [ ] PUT /api/requests/:id/cancel
- [ ] POST /api/requests/:id/rate
- [ ] GET /api/requests/nearby
- [ ] PUT /api/requests/:id/accept
- [ ] PUT /api/requests/:id/status
- [ ] GET /api/requests/:id
- [ ] GET /api/requests/
- [ ] DELETE /api/requests/:id

### Volunteers (/api/volunteers)
- [ ] GET /api/volunteers/profile
- [ ] PUT /api/volunteers/profile
- [ ] PUT /api/volunteers/availability
- [ ] GET /api/volunteers/stats
- [ ] GET /api/volunteers/ratings
- [ ] GET /api/volunteers/history
- [ ] GET /api/volunteers/active-request
- [ ] PUT /api/volunteers/request/:requestId/accept
- [ ] PUT /api/volunteers/request/:requestId/in-progress
- [ ] PUT /api/volunteers/request/:requestId/complete
- [ ] PUT /api/volunteers/request/:requestId/cancel
- [ ] GET /api/volunteers/available
- [ ] GET /api/volunteers/all
- [ ] PUT /api/volunteers/:id/approve
- [ ] PUT /api/volunteers/:id/suspend
- [ ] PUT /api/volunteers/:id/unsuspend
- [ ] PUT /api/volunteers/:id/recalculate-score
- [ ] POST /api/volunteers/:id/rate
- [ ] GET /api/volunteers/:id

### Providers (/api/providers)
- [ ] POST /api/providers/register
- [ ] GET /api/providers/profile
- [ ] PUT /api/providers/profile
- [ ] PUT /api/providers/availability
- [ ] GET /api/providers/requests
- [ ] PUT /api/providers/requests/:id/accept
- [ ] GET /api/providers/
- [ ] PUT /api/providers/:id/verify
- [ ] PUT /api/providers/:id/suspend

### Matches (/api/matches)
- [ ] GET /api/matches/my
- [ ] PUT /api/matches/:id/decline
- [ ] GET /api/matches/request/:id

### Notifications (/api/notifications)
- [ ] GET /api/notifications/
- [ ] GET /api/notifications/unread-count
- [ ] PUT /api/notifications/read-all
- [ ] PUT /api/notifications/:id/read
- [ ] DELETE /api/notifications/
- [ ] DELETE /api/notifications/:id

### Admin (/api/admin)
- [ ] GET /api/admin/users
- [ ] GET /api/admin/users/:id
- [ ] PATCH /api/admin/users/:id/ban
- [ ] PATCH /api/admin/users/:id/unban
- [ ] PATCH /api/admin/users/:id/verify
- [ ] DELETE /api/admin/users/:id
- [ ] GET /api/admin/requests
- [ ] PATCH /api/admin/requests/:id/cancel
- [ ] GET /api/admin/analytics/overview
- [ ] GET /api/admin/analytics/emergency-types
- [ ] GET /api/admin/analytics/monthly-trends
- [ ] GET /api/admin/analytics/top-volunteers
- [ ] GET /api/admin/analytics/high-risk-areas

## Passed

Move or paste tested endpoints here.

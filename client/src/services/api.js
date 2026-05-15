// Axios instance configured with base URL
// Request interceptor: attaches Bearer token to every request
// Response interceptor: detects 401, calls logout(), redirects to /login

// Request Logs
getRequestLogs()
getRequestLogStats()

// Saved Searches  
getSavedSearches()
createSavedSearch()
deleteSavedSearch()

// Notifications
getNotifications()
markNotificationRead()
markAllNotificationsRead()

// Documents
uploadDocument()
getDocuments()
signDocument()
verifyDocument()

// Reports
createReport()
getReports()
reviewReport()

// Referrals
getMyCode()
requestReferral()
respondToReferral()
getSentReferrals()
getReceivedReferrals()

// Messages
getConversations()
getMessages()
sendMessage()

// Applications
withdrawApplication()
getApplicationDetail()
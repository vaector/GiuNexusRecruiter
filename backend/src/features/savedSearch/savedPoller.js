const SavedSearch = require('../savedSearch/savedSearch');
const JobPost = require('../jobPost/jobPost');
const Notification = require('../notification/notification');
const { NotificationType } = require('../../enums/index');

const POLL_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
const BATCH_SIZE = 50;
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // only process those unchecked for 15+ min

// Produces a stable string key from a filters object
// Sorting keys ensures {type:'full-time', location:'Cairo'} and
// {location:'Cairo', type:'full-time'} hash to the same key

const hashFilters = (filters) => {
  const sorted = Object.keys(filters)
    .filter(k => filters[k] !== null && filters[k] !== undefined && filters[k] !== '')
    .sort()
    .reduce((acc, k) => { acc[k] = filters[k]; return acc; }, {});
  return JSON.stringify(sorted);
};

const buildJobFilter = (filters, lastCheckedAt) => {
  const jobFilter = { status: 'open' };

  if (lastCheckedAt) jobFilter.createdAt = { $gt: lastCheckedAt };
  if (filters.keywords) {
    jobFilter.$or = [
      { title:       { $regex: filters.keywords, $options: 'i' } },
      { description: { $regex: filters.keywords, $options: 'i' } },
    ];
  }
  if (filters.location) jobFilter.location = { $regex: filters.location, $options: 'i' };
  if (filters.type)     jobFilter.type = filters.type;
  if (filters.category) jobFilter.category = filters.category;
  if (filters.isRemote !== undefined && filters.isRemote !== null) jobFilter.isRemote = filters.isRemote;
  if (filters.salaryMin) jobFilter.salary = { $gte: filters.salaryMin };

  return jobFilter;
};

const runPollCycle = async () => {
  try {
    const staleTime = new Date(Date.now() - STALE_THRESHOLD_MS);

    const searches = await SavedSearch.find({
      active: true,
      alertEnabled: true,
      $or: [
        { lastCheckedAt: null },
        { lastCheckedAt: { $lt: staleTime } },
      ],
    }).limit(BATCH_SIZE);

    if (searches.length === 0) return;

    // Group searches by filter hash
    // e.g. { '{"category":"Backend"}': [search1, search2, search3] }
    const groups = {};
    for (const search of searches) {
      const key = hashFilters(search.filters.toObject ? search.filters.toObject() : search.filters);
      if (!groups[key]) groups[key] = [];
      groups[key].push(search);
    }

    // One DB query per unique filter combination
    await Promise.all(Object.entries(groups).map(async ([, groupSearches]) => {
      try {
        // Use the earliest lastCheckedAt in the group so we don't miss jobs
        // that were created between the oldest and newest check time
        const earliestCheck = groupSearches.reduce((earliest, s) => {
          if (!s.lastCheckedAt) return null;
          if (!earliest) return s.lastCheckedAt;
          return s.lastCheckedAt < earliest ? s.lastCheckedAt : earliest;
        }, groupSearches[0].lastCheckedAt);

        const jobFilter = buildJobFilter(
          groupSearches[0].filters.toObject ? groupSearches[0].filters.toObject() : groupSearches[0].filters,
          earliestCheck
        );

        const matchingJobs = await JobPost.find(jobFilter).select('_id title company').limit(5);

        if (matchingJobs.length > 0) {
          // Fan out to all users in this group
          await Promise.all(groupSearches.flatMap(search =>
            matchingJobs.map(job =>
              Notification.send({
                recipient: search.user,
                type: NotificationType.NEW_JOB_MATCH,
                title: 'New Job Match',
                message: `A new job matching "${search.name}" was posted: ${job.title} at ${job.company}`,
                relatedJob: job._id,
              })
            )
          ));
        }

        // Update lastCheckedAt for all searches in the group
        const now = new Date();
        await Promise.all(groupSearches.map(s => {
          s.lastCheckedAt = now;
          return s.save();
        }));

      } catch (err) {
        console.error(`[Poller] Failed to process filter group:`, err.message);
      }
    }));

  } catch (err) {
    console.error('[Poller] Cycle failed:', err.message);
  }
};

const startSavedSearchPoller = () => {
  console.log('[Poller] Saved search poller started');
  setInterval(runPollCycle, POLL_INTERVAL_MS);
};

module.exports = { startSavedSearchPoller };
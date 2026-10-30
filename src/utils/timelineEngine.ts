import { TimelineTask, PlanningHorizon, ScheduleConflict, TimelinePhase, TaskPriority } from '@/types/timeline'
import { CelebrationEvent } from '@/types/event'

/**
 * Safely parses a date string into a Date object at local midnight.
 * Returns null if the date is missing, empty, or invalid.
 */
export function parseSafeDate(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // Support YYYY-MM-DD
  const parts = trimmed.split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null
    if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900 || year > 2200) return null
    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return null
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null
    return date
  }

  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
export function formatDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Deterministically adds a number of days to a YYYY-MM-DD string.
 * Returns the offset date string or empty string if baseDate is invalid.
 */
export function addDays(baseDateStr: string, days: number): string {
  const date = parseSafeDate(baseDateStr)
  if (!date) return ''
  date.setDate(date.getDate() + days)
  return formatDateIso(date)
}

/**
 * Calculates calendar days remaining until an event date relative to referenceDate.
 * Returns null if the event date is missing or invalid.
 * Returns negative numbers for past dates.
 */
export function calculateDaysRemaining(eventDate?: string, referenceDate: Date = new Date()): number | null {
  const target = parseSafeDate(eventDate)
  if (!target) return null

  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const diffMs = target.getTime() - refMidnight.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Maps the number of remaining days to a calibrated planning horizon.
 */
export function getPlanningHorizon(daysRemaining: number | null): PlanningHorizon {
  if (daysRemaining === null) return 'undated'
  if (daysRemaining < 0) return 'past'
  if (daysRemaining <= 14) return 'rush-7'
  if (daysRemaining <= 45) return 'sprint-30'
  if (daysRemaining <= 120) return 'standard-90'
  return 'runway-180'
}

/**
 * Returns human-readable label and advice for the current planning horizon.
 */
export function getPlanningHorizonInfo(horizon: PlanningHorizon) {
  switch (horizon) {
    case 'rush-7':
      return {
        label: '7-Day Rush Sprint',
        badgeColor: 'terracotta' as const,
        description: 'Immediate countdown mode. Focuses strictly on essential contracts, food delivery, and day-of execution.',
        recommendation: 'Prioritize confirmed venue access and headcount lock. Defer non-critical custom manufacturing.',
      }
    case 'sprint-30':
      return {
        label: '30-Day Accelerated Sprint',
        badgeColor: 'gold' as const,
        description: 'Fast-track preparation cycle. Requires tight turnaround on supplier agreements and rapid RSVP locking.',
        recommendation: 'Finalize top-3 vendor contracts within the next 48 hours to preserve delivery buffers.',
      }
    case 'standard-90':
      return {
        label: '90-Day Standard Planning',
        badgeColor: 'forest' as const,
        description: 'Optimal quarterly planning rhythm with phased tastings, styling mockups, and structured RSVPs.',
        recommendation: 'Follow standard sequential milestones: locked venue, creative team curation, menu tastings.',
      }
    case 'runway-180':
      return {
        label: '180+ Day Comprehensive Runway',
        badgeColor: 'forest' as const,
        description: 'Generous planning horizon allowing bespoke styling, save-the-dates, and relaxed supplier negotiation.',
        recommendation: 'Secure high-demand venue and photography early before peak celebration season slots book up.',
      }
    case 'past':
      return {
        label: 'Past Event (Retrospective)',
        badgeColor: 'neutral' as const,
        description: 'This celebration date has passed. Active focus shifts to post-event vendor settlement and keepsake archiving.',
        recommendation: 'Reconcile outstanding invoices, follow up on security deposits, and send gratitude notes.',
      }
    case 'undated':
      return {
        label: 'Date Pending (T-Minus Blueprint)',
        badgeColor: 'neutral' as const,
        description: 'Event date has not been set yet. Displaying milestone sequencing relative to eventual target date.',
        recommendation: 'Select and confirm a celebration date to activate dynamic calendar countdowns.',
      }
  }
}

/**
 * Determines if an uncompleted task is past its target date.
 */
export function isTaskOverdue(task: TimelineTask, referenceDate: Date = new Date()): boolean {
  if (task.status === 'completed') return false
  const target = parseSafeDate(task.targetDate || task.deadline)
  if (!target) return false

  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  return target.getTime() < refMidnight.getTime()
}

/**
 * Determines if an uncompleted task is due within a given threshold (default 7 days).
 */
export function isTaskDueSoon(task: TimelineTask, daysThreshold = 7, referenceDate: Date = new Date()): boolean {
  if (task.status === 'completed') return false
  const target = parseSafeDate(task.targetDate || task.deadline)
  if (!target) return false

  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const diffDays = Math.round((target.getTime() - refMidnight.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= daysThreshold
}

/**
 * Returns the urgency classification of a task.
 */
export function getTaskUrgency(task: TimelineTask, referenceDate: Date = new Date()): 'overdue' | 'due-soon' | 'upcoming' | 'completed' {
  if (task.status === 'completed') return 'completed'
  if (isTaskOverdue(task, referenceDate)) return 'overdue'
  if (isTaskDueSoon(task, 7, referenceDate)) return 'due-soon'
  return 'upcoming'
}

interface MilestoneTemplate {
  offsetDays: number // negative days before eventDate
  title: string
  description: string
  phase: TimelinePhase
  priority: TaskPriority
  isMilestone: boolean
  isCriticalPath: boolean
  assignedTo?: string
  category?: string
  dependencyIndices?: number[]
}

/**
 * Generates calibrated preparation tasks based on event date, event type, and planning horizon.
 * INVARIANT: Every generated task defaults strictly to 'todo' status.
 */
export function generatePreparationTasks(
  event: CelebrationEvent,
  referenceDate: Date = new Date(),
): TimelineTask[] {
  const eventId = event.id
  const eventDate = event.date
  const daysRemaining = calculateDaysRemaining(eventDate, referenceDate)
  const horizon = getPlanningHorizon(daysRemaining)

  let templates: MilestoneTemplate[] = []

  // Past event: wrap-up & retrospective
  if (horizon === 'past') {
    templates = [
      {
        offsetDays: 1,
        title: 'Reconcile Final Supplier Invoices & Gratuities',
        description: 'Verify final billed amounts against quoted contracts; disburse remaining balances.',
        phase: 'wrap-up',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Lead Planner',
        category: 'venue',
      },
      {
        offsetDays: 3,
        title: 'Follow Up on Venue & Equipment Security Deposit Return',
        description: 'Confirm facility post-inspection sign-off and track electronic release of escrow funds.',
        phase: 'wrap-up',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Finance Lead',
        category: 'venue',
      },
      {
        offsetDays: 7,
        title: 'Send Personalized Thank You Notes to Attendees & Honorees',
        description: 'Transmit gratitude messages with digital snapshot previews.',
        phase: 'wrap-up',
        priority: 'medium',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'stationery',
      },
      {
        offsetDays: 14,
        title: 'Archive High-Resolution Photography & Video Highlights',
        description: 'Download master media gallery deliverables and backup to long-term storage.',
        phase: 'wrap-up',
        priority: 'medium',
        isMilestone: true,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'photography',
      },
    ]
  } else if (horizon === 'rush-7') {
    // 7-day rush sprint
    templates = [
      {
        offsetDays: -6,
        title: 'Lock Venue Access Protocol, Entry Keys & Loading Dock',
        description: 'Confirm freight elevator timing, parking permits, and vendor security badges.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host / Coordinator',
        category: 'venue',
      },
      {
        offsetDays: -5,
        title: 'Confirm Catering Headcount Lock & Dietary Substitutions',
        description: 'Transmit final guaranteed headcount to kitchen team with acute allergen callouts.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'catering',
      },
      {
        offsetDays: -4,
        title: 'Program Master Audio Playlist & Test Microphones/Lighting',
        description: 'Check wireless frequency channels, background dinner setlist, and transition cues.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'AV Lead',
        category: 'entertainment',
      },
      {
        offsetDays: -3,
        title: 'Pack Day-Of Emergency Kit & Print Contact Cheat Sheet',
        description: 'Gather sewing kit, stain remover, audio adapters, extra stationery, and cash envelopes.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Coordinator',
      },
      {
        offsetDays: -2,
        title: 'Reconfirm Vendor Load-In Windows & Arrival Contacts',
        description: 'Send 1-page timeline sheet to all suppliers with onsite phone contacts.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
      },
      {
        offsetDays: -1,
        title: 'On-Site Staging, Table Setting & Directional Signage Walk',
        description: 'Verify floral centerpiece heights, place cards, and welcome easel positioning.',
        phase: 'rehearsal-prep',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host / Coordinator',
      },
      {
        offsetDays: 0,
        title: 'Day-Of Celebration Execution & Master Run of Show',
        description: 'Doors open to guests; coordinate welcome drinks, transitions, and closing wrap.',
        phase: 'day-of-execution',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'All Leads',
      },
    ]
  } else if (horizon === 'sprint-30') {
    // 30-day accelerated sprint
    templates = [
      {
        offsetDays: -26,
        title: 'Execute Venue Contract & Transmit Deposit',
        description: 'Sign facility agreement and verify curfew and insurance requirements.',
        phase: 'concept-planning',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'venue',
      },
      {
        offsetDays: -22,
        title: 'Secure Primary Catering & Beverage Proposal',
        description: 'Approve menu tiers and confirm bartending staffing levels.',
        phase: 'vendor-curation',
        priority: 'critical',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'catering',
      },
      {
        offsetDays: -18,
        title: 'Book Photographer & Confirm Key Shot List',
        description: 'Lock coverage window, portrait list, and lighting requirements.',
        phase: 'vendor-curation',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'photography',
      },
      {
        offsetDays: -14,
        title: 'Send Digital Invitations & Launch RSVP Collection',
        description: 'Distribute event portal link with meal preferences and accessibility options.',
        phase: 'logistics-coordination',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'invitations',
      },
      {
        offsetDays: -7,
        title: 'Lock RSVP Deadline & Transmit Final Count to Kitchen',
        description: 'Finalize seating chart and special dietary table flags.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
        category: 'catering',
      },
      {
        offsetDays: -3,
        title: 'Distribute Master Run-of-Show to All Vendors',
        description: 'Verify load-in order, parking allocations, and contact telephone numbers.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
      },
      {
        offsetDays: -1,
        title: 'Space Walkthrough, Decor Staging & Soundcheck',
        description: 'Test sound projection and set up signage and gift table.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
      },
      {
        offsetDays: 0,
        title: 'Celebration Commencement & Run of Show',
        description: 'Guest arrivals, signature presentations, dining, and celebratory toasts.',
        phase: 'day-of-execution',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'All Leads',
      },
    ]
  } else if (horizon === 'standard-90') {
    // 90-day standard planning rhythm
    templates = [
      {
        offsetDays: -80,
        title: 'Execute Venue Contract & Secure Date Reservation',
        description: 'Lock facility booking with refundable damage deposit in place.',
        phase: 'concept-planning',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'venue',
      },
      {
        offsetDays: -65,
        title: 'Select Catering Partner & Complete Tasting Session',
        description: 'Sample entrée selections and pair table wines.',
        phase: 'vendor-curation',
        priority: 'critical',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'catering',
      },
      {
        offsetDays: -55,
        title: 'Contract Photography, Cinematography & Music Ensemble',
        description: 'Lock core creative team and review cancellation policies.',
        phase: 'vendor-curation',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'photography',
      },
      {
        offsetDays: -42,
        title: 'Mail Invitations & Open Online RSVP Gateway',
        description: 'Dispatch stationery with clear response deadline and lodging details.',
        phase: 'logistics-coordination',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'invitations',
      },
      {
        offsetDays: -25,
        title: 'Décor & Floral Mockup Review',
        description: 'Confirm centerpiece scale, candle heights, and table runners.',
        phase: 'vendor-curation',
        priority: 'medium',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Stylist',
        category: 'decor',
      },
      {
        offsetDays: -14,
        title: 'Final RSVP Count Lock & Seating Allocation',
        description: 'Confirm exact headcounts for catering procurement.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
        category: 'catering',
      },
      {
        offsetDays: -7,
        title: 'Comprehensive Run-of-Show Alignment Call with Vendors',
        description: 'Walk through chronological schedule step-by-step with vendor leads.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
      },
      {
        offsetDays: -1,
        title: 'Pre-Event Staging & Walkthrough Rehearsal',
        description: 'Inspect lighting cues and verify speech mic placements.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
      },
      {
        offsetDays: 0,
        title: 'Celebration Day Execution & Master Timeline Flow',
        description: 'Live celebration proceedings, toasts, entertainment, and farewells.',
        phase: 'day-of-execution',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'All Leads',
      },
    ]
  } else {
    // 180+ days comprehensive runway (or undated blueprint)
    templates = [
      {
        offsetDays: -160,
        title: 'Curate Venue Shortlist, Site Tours & Contract Locking',
        description: 'Evaluate physical layout, acoustic parameters, and parking accessibility.',
        phase: 'concept-planning',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'venue',
      },
      {
        offsetDays: -130,
        title: 'Curate Creative Vendor Team (Catering, Floral, Photography)',
        description: 'Request formal RFPs and compare quotes against budget allocations.',
        phase: 'vendor-curation',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'catering',
      },
      {
        offsetDays: -100,
        title: 'Dispatch Save-the-Dates & Launch Guest Portal',
        description: 'Give guests advance calendar notice to ensure maximum attendance.',
        phase: 'concept-planning',
        priority: 'medium',
        isMilestone: true,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'invitations',
      },
      {
        offsetDays: -70,
        title: 'Catering Tasting & Styling Palette Finalization',
        description: 'Lock menu courses, signature cocktails, and seasonal floral specs.',
        phase: 'vendor-curation',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'Host',
        category: 'catering',
      },
      {
        offsetDays: -45,
        title: 'Mail Formal Invitations with Dietary Inquiries',
        description: 'Collect meal selections, transportation needs, and accessibility requirements.',
        phase: 'logistics-coordination',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
        category: 'invitations',
      },
      {
        offsetDays: -21,
        title: 'Strict RSVP Lock & Table Arrangement Map',
        description: 'Lock final headcount with kitchen team to avoid late change surcharges.',
        phase: 'logistics-coordination',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Coordinator',
        category: 'catering',
      },
      {
        offsetDays: -10,
        title: 'On-Site Technical Walkthrough with Stage & Audio Leads',
        description: 'Verify power distribution, wireless ranges, and lighting dimmers.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: false,
        isCriticalPath: false,
        assignedTo: 'AV Lead',
        category: 'entertainment',
      },
      {
        offsetDays: -2,
        title: 'Comprehensive Run-of-Show Rehearsal',
        description: 'Full choreography review for ceremony or stage program.',
        phase: 'rehearsal-prep',
        priority: 'high',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'Host',
      },
      {
        offsetDays: 0,
        title: 'Master Celebration Commencement & Run of Show',
        description: 'Arrival, formal program, celebratory dinner, and festivities.',
        phase: 'day-of-execution',
        priority: 'critical',
        isMilestone: true,
        isCriticalPath: true,
        assignedTo: 'All Leads',
      },
    ]
  }

  // Category specific customizations
  if (event.category === 'wedding') {
    templates.splice(templates.length - 2, 0, {
      offsetDays: -1,
      title: 'Wedding Ceremony Rehearsal & Processional Walkthrough',
      description: 'Align wedding party walking order, vows microphone checks, and processional music cues.',
      phase: 'rehearsal-prep',
      priority: 'high',
      isMilestone: true,
      isCriticalPath: true,
      assignedTo: 'Officiant / Coordinator',
    })
  } else if (event.category === 'birthday') {
    templates.splice(templates.length - 1, 0, {
      offsetDays: -1,
      title: 'Birthday Cake Delivery Confirmation & Surprise Cue Timing',
      description: 'Confirm patisserie temperature-controlled arrival window and toast staging.',
      phase: 'rehearsal-prep',
      priority: 'medium',
      isMilestone: false,
      isCriticalPath: false,
      assignedTo: 'Host',
      category: 'catering',
    })
  } else if (event.category === 'community') {
    templates.unshift({
      offsetDays: Math.min(-15, templates[0]?.offsetDays ?? -15),
      title: 'City Permits, Sound Ordinances & Fire Marshal Clearance',
      description: 'Ensure community gathering license, parking reservations, and emergency egress approvals.',
      phase: 'concept-planning',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      assignedTo: 'Civic Coordinator',
      category: 'venue',
    })
  }

  // Cultural Tradition specific milestone enrichments
  const traditionKey = (
    event.culturalPreferences?.traditionId ||
    event.themePreference ||
    event.title ||
    ''
  ).toLowerCase()

  if (traditionKey.includes('bengali') || traditionKey.includes('biye')) {
    templates.splice(Math.max(1, templates.length - 2), 0, {
      offsetDays: -4,
      title: 'Assemble Gaye Holud Tattwa Trays, Pidi & Shola Topor',
      description: 'Prepare decorated brass trays, bridal Mukut, groom Topor, fresh turmeric, and celebratory sweets.',
      phase: 'rehearsal-prep',
      priority: 'high',
      isMilestone: true,
      isCriticalPath: true,
      assignedTo: 'Family Elders & Coordinator',
      category: 'stationery',
    })
  } else if (traditionKey.includes('punjabi') || traditionKey.includes('sangeet')) {
    templates.splice(Math.max(1, templates.length - 2), 0, {
      offsetDays: -4,
      title: 'Rehearse Sangeet Choreography & Coordinate Dhol Troupe Cues',
      description: 'Run through family dance performances, audio mashups, and late-night Jaggo route.',
      phase: 'rehearsal-prep',
      priority: 'high',
      isMilestone: true,
      isCriticalPath: false,
      assignedTo: 'Sangeet Choreographer',
      category: 'entertainment',
    })
  } else if (traditionKey.includes('south-indian') || traditionKey.includes('muhurtham')) {
    templates.splice(Math.max(1, templates.length - 2), 0, {
      offsetDays: -3,
      title: 'Procure Fresh Madurai Malli (Jasmine) & Banana Leaf Supplies',
      description: 'Lock dawn floral deliveries, Kuthuvilakku lamp oil, and whole fresh plantain leaves for Elai Saapadu.',
      phase: 'rehearsal-prep',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      assignedTo: 'Florist & Catering Lead',
      category: 'decor',
    })
  } else if (traditionKey.includes('durga-puja') || traditionKey.includes('sharodotsav')) {
    templates.splice(Math.max(1, templates.length - 2), 0, {
      offsetDays: -5,
      title: 'Inspect Eco-Friendly Clay Pratima & Pandal Fire Clearance',
      description: 'Final walkthrough with structural engineers and idol sculptor for Kumartuli transfer.',
      phase: 'logistics-coordination',
      priority: 'critical',
      isMilestone: true,
      isCriticalPath: true,
      assignedTo: 'Puja Committee',
      category: 'decor',
    })
  }

  // Multi-Day Ceremony Run of Show integration
  const selectedCers = event.culturalPreferences?.selectedCeremonies || []
  if (selectedCers.length > 0) {
    const isMultiDay =
      event.culturalPreferences?.ceremonyScheduleType === 'multi-day-2' ||
      event.culturalPreferences?.ceremonyScheduleType === 'multi-day-3' ||
      event.culturalPreferences?.ceremonyScheduleType === 'multi-day-4'

    selectedCers.slice(0, 4).forEach((ceremonyName) => {
      // Determine day offset: e.g. -2 for Sangeet/Mehendi, -1 for Haldi, 0 for Wedding/Pheras, +1 for Reception
      let offset = 0
      const lower = ceremonyName.toLowerCase()
      if (lower.includes('mehendi') || lower.includes('sangeet') || lower.includes('roka') || lower.includes('tilak')) {
        offset = isMultiDay ? -2 : 0
      } else if (lower.includes('haldi') || lower.includes('holud') || lower.includes('vratham')) {
        offset = isMultiDay ? -1 : 0
      } else if (lower.includes('reception') || lower.includes('bou bhaat') || lower.includes('bhojan')) {
        offset = isMultiDay ? 1 : 0
      }

      // Add to templates if not already present
      const alreadyHas = templates.some((t) => t.title.toLowerCase().includes(ceremonyName.toLowerCase()))
      if (!alreadyHas) {
        templates.push({
          offsetDays: offset,
          title: `Ceremony Run of Show: ${ceremonyName}`,
          description: `Master execution, guest movement, and vendor coordination for ${ceremonyName}.`,
          phase: 'day-of-execution',
          priority: 'critical',
          isMilestone: true,
          isCriticalPath: true,
          assignedTo: 'Lead Coordinator & Family',
          category: 'venue',
        })
      }
    })
  }

  // Build tasks with computed deadlines
  const hasValidDate = !!parseSafeDate(eventDate)

  return templates.map((tmpl, idx) => {
    let targetDate = ''
    if (hasValidDate) {
      targetDate = addDays(eventDate, tmpl.offsetDays)
    }

    const prevTaskId = idx > 0 ? `task-${eventId}-${idx}` : undefined

    return {
      id: `task-${eventId}-${idx + 1}`,
      eventId,
      phase: tmpl.phase,
      title: tmpl.title,
      description: tmpl.description,
      targetDate,
      deadline: targetDate,
      assignedTo: tmpl.assignedTo || 'Unassigned',
      owner: tmpl.assignedTo || 'Unassigned',
      status: 'todo' as const, // Strict rule: never claim booked/completed unless user records it!
      priority: tmpl.priority,
      isMilestone: tmpl.isMilestone,
      isCriticalPath: tmpl.isCriticalPath,
      dependencyIds: prevTaskId ? [prevTaskId] : [],
      category: tmpl.category,
    }
  })
}

/**
 * Helper to parse "HH:MM" into minutes from midnight (0 - 1439).
 */
function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/**
 * Detects scheduling anomalies, dependency order violations, critical path compression,
 * and overlapping venue/ceremony time slots.
 */
export function detectScheduleConflicts(tasks: TimelineTask[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const taskMap = new Map<string, TimelineTask>()
  tasks.forEach((t) => taskMap.set(t.id, t))

  // 1. Dependency violations & critical path compression
  tasks.forEach((task) => {
    const taskDate = parseSafeDate(task.targetDate || task.deadline)
    if (!taskDate) return

    task.dependencyIds?.forEach((depId) => {
      const dep = taskMap.get(depId)
      if (!dep) return

      const depDate = parseSafeDate(dep.targetDate || dep.deadline)
      if (!depDate) return

      // If dependency is scheduled AFTER the dependent task
      if (depDate.getTime() > taskDate.getTime()) {
        conflicts.push({
          taskId: task.id,
          conflictType: 'dependency-violation',
          severity: 'critical',
          description: `"${task.title}" is scheduled for ${task.targetDate}, but its prerequisite "${dep.title}" is due later on ${dep.targetDate}.`,
          suggestedResolution: `Reschedule "${task.title}" after "${dep.title}" or advance the prerequisite deadline.`,
        })
      }
    })

    // If critical path task is overdue and downstream dependent tasks exist
    if (task.isCriticalPath && task.status !== 'completed' && isTaskOverdue(task)) {
      conflicts.push({
        taskId: task.id,
        conflictType: 'deadline-compression',
        severity: 'critical',
        description: `Critical path milestone "${task.title}" is overdue (${task.targetDate}), compressing downstream timeline buffers.`,
        suggestedResolution: 'Complete this milestone or adjust downstream delivery dates immediately.',
      })
    }
  })

  // 2. Same-day time slot overlap conflict detection
  const tasksByDate = new Map<string, TimelineTask[]>()
  tasks.forEach((t) => {
    const dateStr = t.targetDate || t.deadline
    if (dateStr && t.startTime && t.durationMinutes && t.durationMinutes > 0) {
      const arr = tasksByDate.get(dateStr) || []
      arr.push(t)
      tasksByDate.set(dateStr, arr)
    }
  })

  tasksByDate.forEach((dayTasks, dateStr) => {
    for (let i = 0; i < dayTasks.length; i++) {
      for (let j = i + 1; j < dayTasks.length; j++) {
        const t1 = dayTasks[i]
        const t2 = dayTasks[j]

        const start1 = parseTimeToMinutes(t1.startTime)
        const start2 = parseTimeToMinutes(t2.startTime)

        if (start1 !== null && start2 !== null && t1.durationMinutes && t2.durationMinutes) {
          const end1 = start1 + t1.durationMinutes
          const end2 = start2 + t2.durationMinutes

          // Check if intervals [start1, end1) and [start2, end2) overlap
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              taskId: t2.id,
              conflictType: 'overlap',
              severity: 'critical',
              description: `Time conflict on ${dateStr}: "${t2.title}" (${t2.startTime}) overlaps with "${t1.title}" (${t1.startTime} - ${Math.floor(end1 / 60)}:${String(end1 % 60).padStart(2, '0')}) without required setup/transit buffer.`,
              suggestedResolution: `Adjust start time for "${t2.title}" or allow at least 45 minutes between ceremonies for guest movement and venue turnover.`,
            })
          }
        }
      }
    }
  })

  return conflicts
}

/**
 * Proposes an updated schedule when the celebration date shifts.
 * Identifies affected tasks, recalculates target deadlines, and strictly preserves
 * user decisions and completed statuses.
 */
export function recalculateScheduleForDateShift(
  tasks: TimelineTask[],
  oldEventDate: string,
  newEventDate: string,
  referenceDate: Date = new Date(),
): {
  updatedTasks: TimelineTask[]
  affectedTasksCount: number
  newlyOverdueCount: number
} {
  const oldDate = parseSafeDate(oldEventDate)
  const newDate = parseSafeDate(newEventDate)

  if (!oldDate || !newDate) {
    return {
      updatedTasks: [...tasks],
      affectedTasksCount: 0,
      newlyOverdueCount: 0,
    }
  }

  const daysDelta = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDelta === 0) {
    return {
      updatedTasks: [...tasks],
      affectedTasksCount: 0,
      newlyOverdueCount: 0,
    }
  }

  let affectedTasksCount = 0
  let newlyOverdueCount = 0

  const updatedTasks = tasks.map((task) => {
    // PRESERVE USER INTENT: Completed tasks never have status reset
    if (task.status === 'completed') {
      return { ...task }
    }

    const taskDate = parseSafeDate(task.targetDate || task.deadline)
    if (!taskDate) {
      return { ...task }
    }

    const shifted = new Date(taskDate.getTime() + daysDelta * 86400000)
    const shiftedStr = formatDateIso(shifted)

    affectedTasksCount++

    const isNowOverdue = isTaskOverdue(
      {
        ...task,
        targetDate: shiftedStr,
        deadline: shiftedStr,
      },
      referenceDate,
    )

    if (isNowOverdue && !isTaskOverdue(task, referenceDate)) {
      newlyOverdueCount++
    }

    return {
      ...task,
      targetDate: shiftedStr,
      deadline: shiftedStr,
      priority: isNowOverdue && task.priority !== 'critical' ? ('critical' as const) : task.priority,
    }
  })

  return {
    updatedTasks,
    affectedTasksCount,
    newlyOverdueCount,
  }
}

/**
 * Computes high-level health and completion statistics for the timeline.
 */
export function calculateTimelineStats(tasks: TimelineTask[], referenceDate: Date = new Date()) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const overdue = tasks.filter((t) => isTaskOverdue(t, referenceDate)).length
  const dueSoon = tasks.filter((t) => isTaskDueSoon(t, 7, referenceDate)).length
  const criticalPathCount = tasks.filter((t) => t.isCriticalPath).length
  const milestonesCount = tasks.filter((t) => t.isMilestone).length

  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    overdue,
    dueSoon,
    criticalPathCount,
    milestonesCount,
    percentComplete,
  }
}


import cron from 'node-cron';
import Income from '../models/Income.js';
import FamilyMember from '../models/FamilyMember.js';
import { calculateNextRunDate } from '../utils/dateHelpers.js';

// Main task to generate recurring incomes
export const processRecurringIncomes = async () => {
  console.log('[Scheduler] Running recurring income check...');
  try {
    const today = new Date();
    // Get YYYY-MM-DD string for comparison
    const todayStr = today.toISOString().split('T')[0];

    // Find all active templates
    const templates = await Income.find({
      isTemplate: true,
      active: true,
    });

    // Filter templates whose nextRunDate is <= today
    const dueTemplates = templates.filter(t => t.nextRunDate && t.nextRunDate <= todayStr);

    for (const template of dueTemplates) {
      const runDateStr = template.nextRunDate;
      const runDate = new Date(runDateStr);
      
      // Idempotency check: Ensure we haven't already generated an instance for this template for this target date
      const existing = await Income.findOne({
        parentRecurringId: template.id,
        date: runDateStr,
      });

      if (existing) {
        console.log(`[Scheduler] Income for template ${template.id} on date ${runDateStr} already exists. Skipping creation.`);
        // Advance nextRunDate to avoid getting stuck
        const nextRun = calculateNextRunDate(runDate, template.frequency);
        const nextRunStr = nextRun.toISOString().split('T')[0];
        await Income.findByIdAndUpdate(template.id, { nextRunDate: nextRunStr });
        continue;
      }

      console.log(`[Scheduler] Materializing recurring income for template ${template.id} (Date: ${runDateStr}, Amount: ₹${template.amount})`);

      // Create new materialized instance
      const memberId = template.familyMember
        ? (typeof template.familyMember === 'object' ? template.familyMember._id : template.familyMember)
        : null;

      await Income.create({
        source: template.source,
        amount: template.amount,
        date: runDateStr,
        description: template.description,
        isRecurring: false,
        isTemplate: false,
        active: false,
        parentRecurringId: template.id,
        familyMember: memberId,
        notes: template.notes,
        userId: template.userId,
      });

      // Update the template nextRunDate
      const nextRun = calculateNextRunDate(runDate, template.frequency);
      const nextRunStr = nextRun.toISOString().split('T')[0];
      await Income.findByIdAndUpdate(template.id, { nextRunDate: nextRunStr });
    }
  } catch (error) {
    console.error('[Scheduler] Error processing recurring incomes:', error);
  }
};

// Initialize scheduler on server startup
export const initRecurringIncomeScheduler = () => {
  // Run checks once on startup after 5 seconds to ensure server is ready
  setTimeout(processRecurringIncomes, 5000);

  // Schedule to run daily at midnight
  cron.schedule('0 0 * * *', processRecurringIncomes);
  console.log('⏰ Recurring Income Scheduler successfully registered.');
};

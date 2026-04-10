import { appSchema, tableSchema, type TableSchema } from '@nozbe/watermelondb'

export const dairySchema = appSchema({
  version: 1,
  tables: [
    // Farmer profile
    tableSchema({
      name: 'farmers',
      columns: [
        { name: 'phone', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'farm_name', type: 'string' },
        { name: 'village', type: 'string' },
        { name: 'district', type: 'string' },
        { name: 'avatar_initials', type: 'string' },
        { name: 'language', type: 'string' }, // ta, te, kn, ml, hi, en
        { name: 'is_profile_complete', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Animals (cows, buffaloes, calves)
    tableSchema({
      name: 'animals',
      columns: [
        { name: 'farmer_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' }, // cow, buffalo, calf
        { name: 'breed', type: 'string' },
        { name: 'tag_number', type: 'string', isIndexed: true },
        { name: 'photo_uri', type: 'string' },
        { name: 'health_status', type: 'string' }, // healthy, attention, critical
        { name: 'notes', type: 'string' },
        { name: 'birth_date', type: 'number' }, // timestamp
        { name: 'lactation_number', type: 'number' },
        { name: 'last_calving_date', type: 'number' },
        { name: 'expected_calving_date', type: 'number' },
        { name: 'is_pregnant', type: 'boolean' },
        { name: 'body_condition_score', type: 'number' },
        { name: 'weight_kg', type: 'number' },
        { name: 'last_milk_entry_date', type: 'number' },
        { name: 'last_milk_quantity', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Milk production logs
    tableSchema({
      name: 'milk_logs',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' }, // timestamp
        { name: 'shift', type: 'string' }, // morning, evening
        { name: 'quantity_liters', type: 'number' },
        { name: 'fat_percent', type: 'number' },
        { name: 'snf_percent', type: 'number' },
        { name: 'temperature_c', type: 'number' },
        { name: 'notes', type: 'string' },
        { name: 'api_sync_status', type: 'string' }, // pending, synced, failed
        { name: 'sync_attempts', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Health events (vaccinations, treatments, diagnoses)
    tableSchema({
      name: 'health_events',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' },
        { name: 'type', type: 'string' }, // vaccination, treatment, observation, diagnosis
        { name: 'description', type: 'string' },
        { name: 'veterinarian_name', type: 'string' },
        { name: 'cost', type: 'number' },
        { name: 'follow_up_date', type: 'number' },
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Breeding events (heat, insemination, calving, etc.)
    tableSchema({
      name: 'breeding_events',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'event_type', type: 'string' }, // heat, insemination, pregnancy_confirmed, dry_off, calving, abort
        { name: 'event_date', type: 'number' },
        { name: 'note', type: 'string' },
        { name: 'bull_name', type: 'string' },
        { name: 'expected_calving_date', type: 'number' },
        { name: 'calving_gender', type: 'string' }, // male, female
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Vaccination schedules
    tableSchema({
      name: 'vaccinations',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'vaccine_name', type: 'string' },
        { name: 'vaccine_type', type: 'string' }, // FMD, HS, BQ, Brucellosis, etc.
        { name: 'scheduled_date', type: 'number' },
        { name: 'administered_date', type: 'number' },
        { name: 'batch_no', type: 'string' },
        { name: 'administered_by', type: 'string' },
        { name: 'cost', type: 'number' },
        { name: 'next_due_date', type: 'number' },
        { name: 'note', type: 'string' },
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Income entries (milk sales)
    tableSchema({
      name: 'income_entries',
      columns: [
        { name: 'date', type: 'number' },
        { name: 'buyer', type: 'string' },
        { name: 'quantity_sold', type: 'number' },
        { name: 'rate_per_litre', type: 'number' },
        { name: 'total_expected', type: 'number' },
        { name: 'total_received', type: 'number' },
        { name: 'fat_percent', type: 'number' },
        { name: 'snf_percent', type: 'number' },
        { name: 'notes', type: 'string' },
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Expense entries
    tableSchema({
      name: 'expense_entries',
      columns: [
        { name: 'date', type: 'number' },
        { name: 'category', type: 'string' }, // feed, medicine, labor, equipment, other
        { name: 'description', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Daily tasks
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'animal_id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'title_tamil', type: 'string' },
        { name: 'time', type: 'string' },
        { name: 'session', type: 'string' }, // morning, evening, anytime
        { name: 'completed', type: 'boolean' },
        { name: 'date', type: 'number' },
        { name: 'type', type: 'string' }, // milk, feed, health, clean, other, breeding, vaccination
        { name: 'priority', type: 'string' }, // low, normal, high, critical
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Inventory items (feed, medicine, equipment)
    tableSchema({
      name: 'inventory_items',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' }, // feed, medicine, supplement, equipment, other
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'min_quantity', type: 'number' },
        { name: 'price_per_unit', type: 'number' },
        { name: 'last_updated', type: 'number' },
        { name: 'api_sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Rate cards for different states/cooperatives
    tableSchema({
      name: 'rate_cards',
      columns: [
        { name: 'cooperative_code', type: 'string', isIndexed: true }, // KMF, AAVIN, MILMA, TS_DAIRY
        { name: 'state_code', type: 'string' }, // KA, TN, KL, TS, AP
        { name: 'base_rate', type: 'number' },
        { name: 'fat_premium', type: 'number' },
        { name: 'snf_premium', type: 'number' },
        { name: 'transport_deduction', type: 'number' },
        { name: 'gst_percent', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'effective_from', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})

export type DairySchema = typeof dairySchema

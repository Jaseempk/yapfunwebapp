import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface CrashedKOLMindshare {
  market_address: string;
  mindshares: number[];
  last_active_cycle: string;
  created_at?: Date;
}

/**
 * Service for storing and retrieving mindshare data for crashed out KOLs
 * Uses Supabase as a persistent storage solution
 * Falls back to in-memory storage if Supabase credentials are not available
 */
class MindshareStorageService {
  private supabase: SupabaseClient | null = null;
  private readonly tableName = "OrderDirectory";
  private useInMemoryFallback = false;
  private inMemoryStorage: Map<string, CrashedKOLMindshare> = new Map();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "Supabase URL and key not provided. Using in-memory storage for mindshare data."
      );
      this.useInMemoryFallback = true;
    } else {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log("Supabase client initialized for mindshare storage");
      } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        this.useInMemoryFallback = true;
      }
    }
  }

  /**
   * Store mindshare data for a crashed out KOL
   * @param marketAddress The market address of the KOL
   * @param mindshares Array of mindshare values
   * @param cycleId The ID of the last active cycle
   */
  async storeCrashedKOLMindshares(
    marketAddress: string,
    mindshares: number[],
    cycleId: string
  ): Promise<void> {
    const entry: CrashedKOLMindshare = {
      market_address: marketAddress,
      mindshares: mindshares,
      last_active_cycle: cycleId,
    };

    if (this.useInMemoryFallback) {
      // Use in-memory storage
      this.inMemoryStorage.set(marketAddress, entry);
      console.log(
        `[In-Memory] Stored mindshare data for crashed out KOL market ${marketAddress}`
      );
      return;
    }

    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Check if entry already exists
      const { data: existingData } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("marketAddy", marketAddress)
        .single();

      if (existingData) {
        // Update existing entry
        const { error } = await this.supabase
          .from(this.tableName)
          .update(entry)
          .eq("marketAddy", marketAddress);

        if (error) throw error;
        console.log(
          `Updated mindshare data for crashed out KOL market ${marketAddress}`
        );
      } else {
        // Insert new entry
        const { error } = await this.supabase
          .from(this.tableName)
          .insert(entry);

        if (error) throw error;
        console.log(
          `Stored mindshare data for crashed out KOL market ${marketAddress}`
        );
      }
    } catch (error) {
      console.error("Error storing crashed KOL mindshare data:", error);

      // Fallback to in-memory storage on error
      this.inMemoryStorage.set(marketAddress, entry);
      console.log(
        `[Fallback] Stored mindshare data in memory for crashed out KOL market ${marketAddress}`
      );
    }
  }

  /**
   * Retrieve mindshare data for a returning KOL
   * @param marketAddress The market address of the KOL
   * @returns Array of mindshare values or null if not found
   */
  async getStoredMindshares(marketAddress: string): Promise<number[] | null> {
    if (this.useInMemoryFallback) {
      // Use in-memory storage
      const data = this.inMemoryStorage.get(marketAddress);
      return data?.mindshares || null;
    }

    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("mindshares")
        .eq("marketAddy", marketAddress)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No data found (PGRST116 is the "no rows returned" error code)
          return null;
        }
        throw error;
      }

      return data?.mindshares || null;
    } catch (error) {
      console.error("Error retrieving crashed KOL mindshare data:", error);

      // Try in-memory fallback
      const data = this.inMemoryStorage.get(marketAddress);
      return data?.mindshares || null;
    }
  }

  /**
   * Clear mindshare data for a KOL after market reset
   * @param marketAddress The market address of the KOL
   */
  async clearStoredMindshares(marketAddress: string): Promise<void> {
    if (this.useInMemoryFallback) {
      // Use in-memory storage
      this.inMemoryStorage.delete(marketAddress);
      console.log(
        `[In-Memory] Cleared mindshare data for KOL market ${marketAddress}`
      );
      return;
    }

    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq("marketAddy", marketAddress);

      if (error) throw error;
      console.log(`Cleared mindshare data for KOL market ${marketAddress}`);

      // Also clear from in-memory storage if it exists there
      this.inMemoryStorage.delete(marketAddress);
    } catch (error) {
      console.error("Error clearing crashed KOL mindshare data:", error);
      // Don't throw here, just log the error

      // Still try to clear from in-memory storage
      this.inMemoryStorage.delete(marketAddress);
    }
  }

  /**
   * Get all crashed KOL mindshare data
   * @returns Array of CrashedKOLMindshare objects
   */
  async getAllCrashedKOLMindshares(): Promise<CrashedKOLMindshare[]> {
    if (this.useInMemoryFallback) {
      // Use in-memory storage
      return Array.from(this.inMemoryStorage.values());
    }

    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error retrieving all crashed KOL mindshare data:", error);

      // Fallback to in-memory storage
      return Array.from(this.inMemoryStorage.values());
    }
  }
}

export const mindshareStorageService = new MindshareStorageService();

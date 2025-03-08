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
 */
class MindshareStorageService {
  private supabase: SupabaseClient;
  private readonly tableName = "OrderDirectory";

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase URL and key must be provided in environment variables"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
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
    try {
      // Check if entry already exists
      const { data: existingData } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("marketAddy", marketAddress)
        .single();

      const entry: CrashedKOLMindshare = {
        market_address: marketAddress,
        mindshares: mindshares,
        last_active_cycle: cycleId,
      };

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
      throw new Error(
        `Failed to store mindshare data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Retrieve mindshare data for a returning KOL
   * @param marketAddress The market address of the KOL
   * @returns Array of mindshare values or null if not found
   */
  async getStoredMindshares(marketAddress: string): Promise<number[] | null> {
    try {
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
      return null;
    }
  }

  /**
   * Clear mindshare data for a KOL after market reset
   * @param marketAddress The market address of the KOL
   */
  async clearStoredMindshares(marketAddress: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq("marketAddy", marketAddress);

      if (error) throw error;
      console.log(`Cleared mindshare data for KOL market ${marketAddress}`);
    } catch (error) {
      console.error("Error clearing crashed KOL mindshare data:", error);
      // Don't throw here, just log the error
    }
  }

  /**
   * Get all crashed KOL mindshare data
   * @returns Array of CrashedKOLMindshare objects
   */
  async getAllCrashedKOLMindshares(): Promise<CrashedKOLMindshare[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error retrieving all crashed KOL mindshare data:", error);
      return [];
    }
  }
}

export const mindshareStorageService = new MindshareStorageService();

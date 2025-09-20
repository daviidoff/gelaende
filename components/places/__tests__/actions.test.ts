import { getPlaces } from "../actions";
import { createClient } from "@/lib/supabase/server";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Places Actions", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock client for each test
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("getPlaces", () => {
    const mockUserId = "user-123";
    const mockPlaces = [
      {
        place_id: "place-1",
        name: "Central Park",
        location: { lat: 40.7829, lng: -73.9654 },
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
      {
        place_id: "place-2",
        name: "Times Square",
        location: { lat: 40.758, lng: -73.9855 },
        created_at: "2023-01-02T00:00:00Z",
        updated_at: "2023-01-02T00:00:00Z",
      },
    ];

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully retrieve all places", async () => {
      // Mock successful places fetch
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces();

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: mockPlaces,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
      expect(mockPlacesChain.select).toHaveBeenCalledWith("*");
      expect(mockPlacesChain.order).toHaveBeenCalledWith("name");
    });

    it("should return empty array when no places exist", async () => {
      // Mock empty places response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces();

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: [],
      });
    });

    it("should handle null data response", async () => {
      // Mock null data response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces();

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: [],
      });
    });

    it("should fail when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getPlaces();

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it("should fail when authentication error occurs", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });

      const result = await getPlaces();

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it("should handle database error when fetching places", async () => {
      // Mock database error
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST116" },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getPlaces();

      expect(result).toEqual({
        success: false,
        message: "Failed to fetch places",
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching places:", {
        message: "Database error",
        code: "PGRST116",
      });

      consoleSpy.mockRestore();
    });

    it("should handle unexpected errors", async () => {
      // Mock unexpected error
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getPlaces();

      expect(result).toEqual({
        success: false,
        message: "An unexpected error occurred",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error in getPlaces:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should order places by name", async () => {
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      await getPlaces();

      expect(mockPlacesChain.order).toHaveBeenCalledWith("name");
    });
  });
});

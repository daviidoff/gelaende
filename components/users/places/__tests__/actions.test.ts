import { setPlace } from "../actions";
import { getCurrentPlace, getUserPlaces } from "../data";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Mock modules
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("User Places Actions", () => {
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
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("setPlace", () => {
    const mockUserId = "user-123";
    const mockPlaceId = "place-456";
    const mockActivityId = "activity-789";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully set user's current place", async () => {
      // Mock place exists check
      const mockPlaceChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { place_id: mockPlaceId },
          error: null,
        }),
      };

      // Mock activity creation
      const mockActivityChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { activity_id: mockActivityId },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockPlaceChain) // First call for place check
        .mockReturnValueOnce(mockActivityChain); // Second call for activity creation

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: true,
        activity_id: mockActivityId,
      });

      // Verify place check
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
      expect(mockPlaceChain.select).toHaveBeenCalledWith("place_id");
      expect(mockPlaceChain.eq).toHaveBeenCalledWith("place_id", mockPlaceId);
      expect(mockPlaceChain.single).toHaveBeenCalled();

      // Verify activity creation
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("activities");
      expect(mockActivityChain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        place_id: mockPlaceId,
        time: expect.any(String),
      });
      expect(mockActivityChain.select).toHaveBeenCalledWith("activity_id");
      expect(mockActivityChain.single).toHaveBeenCalled();

      // Verify revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/activities");
    });

    it("should return error when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: false,
        error: "Authentication required. Please log in to set your place.",
      });

      // Should not proceed with place check or activity creation
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when authentication fails", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: false,
        error: "Authentication required. Please log in to set your place.",
      });
    });

    it("should return error when place does not exist", async () => {
      // Mock place does not exist
      const mockPlaceChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockPlaceChain);

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: false,
        error: "Place not found. Please ensure the place exists.",
      });

      // Should not proceed with activity creation
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when activity creation fails", async () => {
      // Mock place exists
      const mockPlaceChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { place_id: mockPlaceId },
          error: null,
        }),
      };

      // Mock activity creation fails
      const mockActivityChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockPlaceChain)
        .mockReturnValueOnce(mockActivityChain);

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: false,
        error: "Failed to set place. Please try again.",
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await setPlace(mockPlaceId);

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      });
    });
  });

  describe("getCurrentPlace", () => {
    const mockUserId = "user-123";
    const mockActivity = {
      activity_id: "activity-789",
      time: "2023-01-01T12:00:00Z",
      places: {
        place_id: "place-456",
        name: "Central Park",
        location: { lat: 40.7829, lng: -73.9654 },
      },
    };

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully get current place for authenticated user", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockActivity,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getCurrentPlace();

      expect(result).toEqual({
        success: true,
        activity: mockActivity,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("activities");
      expect(mockActivityChain.select).toHaveBeenCalledWith(`
        activity_id,
        time,
        places (
          place_id,
          name,
          location
        )
      `);
      expect(mockActivityChain.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockActivityChain.order).toHaveBeenCalledWith("time", {
        ascending: false,
      });
      expect(mockActivityChain.limit).toHaveBeenCalledWith(1);
    });

    it("should get current place for specific user when userId provided", async () => {
      const specificUserId = "other-user-456";
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockActivity,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getCurrentPlace(specificUserId);

      expect(result).toEqual({
        success: true,
        activity: mockActivity,
      });

      expect(mockActivityChain.eq).toHaveBeenCalledWith(
        "user_id",
        specificUserId
      );

      // Should not call auth.getUser since userId was provided
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled();
    });

    it("should return null when user has no activities", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getCurrentPlace();

      expect(result).toEqual({
        success: true,
        activity: null,
      });
    });

    it("should return error when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentPlace();

      expect(result).toEqual({
        success: false,
        error: "Authentication required.",
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "OTHER_ERROR", message: "Database error" },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getCurrentPlace();

      expect(result).toEqual({
        success: false,
        error: "Failed to fetch current place.",
      });
    });
  });

  describe("getUserPlaces", () => {
    const mockUserId = "user-123";
    const mockActivities = [
      {
        time: "2023-01-01T12:00:00Z",
        places: {
          place_id: "place-1",
          name: "Central Park",
          location: { lat: 40.7829, lng: -73.9654 },
        },
      },
      {
        time: "2023-01-01T10:00:00Z",
        places: {
          place_id: "place-2",
          name: "Times Square",
          location: { lat: 40.758, lng: -73.9855 },
        },
      },
      {
        time: "2023-01-01T08:00:00Z",
        places: {
          place_id: "place-1",
          name: "Central Park",
          location: { lat: 40.7829, lng: -73.9654 },
        },
      },
    ];

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully get unique places for user", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockActivities,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getUserPlaces();

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(2); // Should dedupe Central Park
      const firstPlace = Array.isArray(result.places![0].places)
        ? result.places![0].places[0]
        : result.places![0].places;
      const secondPlace = Array.isArray(result.places![1].places)
        ? result.places![1].places[0]
        : result.places![1].places;
      expect(firstPlace.place_id).toBe("place-1"); // Most recent Central Park
      expect(secondPlace.place_id).toBe("place-2"); // Times Square
    });

    it("should get places for specific user when userId provided", async () => {
      const specificUserId = "other-user-456";
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockActivities,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getUserPlaces(specificUserId);

      expect(result.success).toBe(true);
      expect(mockActivityChain.eq).toHaveBeenCalledWith(
        "user_id",
        specificUserId
      );
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled();
    });

    it("should return empty array when user has no activities", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getUserPlaces();

      expect(result).toEqual({
        success: true,
        places: [],
      });
    });

    it("should return error when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserPlaces();

      expect(result).toEqual({
        success: false,
        error: "Authentication required.",
      });
    });

    it("should handle database errors", async () => {
      const mockActivityChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockActivityChain);

      const result = await getUserPlaces();

      expect(result).toEqual({
        success: false,
        error: "Failed to fetch user places.",
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await getUserPlaces();

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred.",
      });
    });
  });
});

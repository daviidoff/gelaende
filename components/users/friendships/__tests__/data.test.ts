import { getCurrentUserWithLastPlace } from "../data";
import { getCurrentPlace } from "@/components/users/places/data";
import { createClient } from "@/lib/supabase/server";

// Mock modules
jest.mock("@/lib/supabase/server");
jest.mock("@/components/users/places/data");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockGetCurrentPlace = getCurrentPlace as jest.MockedFunction<
  typeof getCurrentPlace
>;

describe("Friendships Data Functions", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("getCurrentUserWithLastPlace", () => {
    const mockUserId = "user-123";
    const mockProfile = {
      profile_id: "profile-123",
      name: "John Doe",
      studiengang: "Computer Science",
      university: "TU Munich",
      user_id: mockUserId,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };
    const mockActivity = {
      activity_id: "activity-123",
      time: "2023-01-01T12:00:00Z",
      picture: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABg...",
      places: [
        {
          place_id: "place-123",
          name: "Central Park",
          location: { lat: 40.7829, lng: -73.9654 },
        },
      ],
    };

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully get current user with last place", async () => {
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileChain);

      mockGetCurrentPlace.mockResolvedValue({
        success: true,
        activity: mockActivity,
      });

      const result = await getCurrentUserWithLastPlace();

      expect(result).toEqual({
        success: true,
        message: "Current user with last place fetched successfully",
        data: {
          ...mockProfile,
          friendship_created_at: mockProfile.created_at,
          lastPlace: mockActivity,
        },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockProfileChain.select).toHaveBeenCalledWith(
        "profile_id, name, studiengang, university, user_id, created_at, updated_at"
      );
      expect(mockProfileChain.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockGetCurrentPlace).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle case when user has no last place", async () => {
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileChain);

      mockGetCurrentPlace.mockResolvedValue({
        success: false,
        error: "No activities found",
      });

      const result = await getCurrentUserWithLastPlace();

      expect(result).toEqual({
        success: true,
        message: "Current user with last place fetched successfully",
        data: {
          ...mockProfile,
          friendship_created_at: mockProfile.created_at,
          lastPlace: null,
        },
      });
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });

      const result = await getCurrentUserWithLastPlace();

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it("should handle profile not found error", async () => {
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Profile not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileChain);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getCurrentUserWithLastPlace();

      expect(result).toEqual({
        success: false,
        message: "Failed to fetch user profile",
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching user profile:", {
        message: "Profile not found",
      });

      consoleSpy.mockRestore();
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getCurrentUserWithLastPlace();

      expect(result).toEqual({
        success: false,
        message: "An unexpected error occurred",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error in getCurrentUserWithLastPlace:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});

import { getFriendsWithLastPlaces } from "../data";
import { getFriendships } from "@/components/users/friendships/data";
import { getCurrentPlace } from "@/components/users/places/data";

// Mock the dependencies
jest.mock("@/components/users/friendships/data");
jest.mock("@/components/users/places/data");

const mockGetFriendships = getFriendships as jest.MockedFunction<
  typeof getFriendships
>;
const mockGetCurrentPlace = getCurrentPlace as jest.MockedFunction<
  typeof getCurrentPlace
>;

describe("FreundeTab Data Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFriendsWithLastPlaces", () => {
    const mockFriendsData = [
      {
        profile_id: "profile-1",
        name: "John Doe",
        studiengang: "Computer Science",
        university: "TU Munich",
        user_id: "user-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        friendship_created_at: "2024-01-01T00:00:00Z",
      },
      {
        profile_id: "profile-2",
        name: "Jane Smith",
        studiengang: "Mathematics",
        university: "LMU Munich",
        user_id: "user-2",
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        friendship_created_at: "2024-01-02T00:00:00Z",
      },
    ];

    const mockPlaceData = {
      activity_id: "activity-1",
      time: "2024-01-15T12:00:00Z",
      places: {
        place_id: "place-1",
        name: "Central Library",
        location: "Munich City Center",
      },
    } as any;

    const mockPlaceData2 = {
      activity_id: "activity-2",
      time: "2024-01-16T14:30:00Z",
      places: {
        place_id: "place-2",
        name: "Student Cafeteria",
        location: "Campus",
      },
    } as any;

    it("should successfully fetch friends with their last places", async () => {
      // Mock successful friendships fetch
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "Friendships fetched successfully",
        data: mockFriendsData,
      });

      // Mock successful place fetches for each friend
      mockGetCurrentPlace
        .mockResolvedValueOnce({
          success: true,
          activity: mockPlaceData,
        })
        .mockResolvedValueOnce({
          success: true,
          activity: mockPlaceData2,
        });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Friends with last places fetched successfully"
      );
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        ...mockFriendsData[0],
        lastPlace: mockPlaceData,
      });
      expect(result.data![1].lastPlace).not.toBeNull();

      // Verify function calls
      expect(mockGetFriendships).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentPlace).toHaveBeenCalledTimes(2);
      expect(mockGetCurrentPlace).toHaveBeenCalledWith("user-1");
      expect(mockGetCurrentPlace).toHaveBeenCalledWith("user-2");
    });

    it("should handle friends with no last place", async () => {
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "Friendships fetched successfully",
        data: [mockFriendsData[0]],
      });

      // Mock unsuccessful place fetch (no activity found)
      mockGetCurrentPlace.mockResolvedValue({
        success: true,
        activity: null,
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].lastPlace).toBeNull();
    });

    it("should handle failed place fetch for a friend", async () => {
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "Friendships fetched successfully",
        data: [mockFriendsData[0]],
      });

      // Mock failed place fetch
      mockGetCurrentPlace.mockResolvedValue({
        success: false,
        error: "Failed to fetch current place",
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].lastPlace).toBeNull();
    });

    it("should return error when getFriendships fails", async () => {
      mockGetFriendships.mockResolvedValue({
        success: false,
        message: "Authentication required",
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.data).toBeUndefined();
      expect(mockGetCurrentPlace).not.toHaveBeenCalled();
    });

    it("should return error when getFriendships returns no data", async () => {
      mockGetFriendships.mockResolvedValue({
        success: false,
        message: "No friendships found",
        data: undefined,
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(false);
      expect(result.message).toBe("No friendships found");
      expect(result.data).toBeUndefined();
      expect(mockGetCurrentPlace).not.toHaveBeenCalled();
    });

    it("should handle empty friends list", async () => {
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "No friends found",
        data: [],
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Friends with last places fetched successfully"
      );
      expect(result.data).toHaveLength(0);
      expect(mockGetCurrentPlace).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      mockGetFriendships.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(false);
      expect(result.message).toBe("An unexpected error occurred");
      expect(result.data).toBeUndefined();
    });

    it("should handle partial failures when some friends have place fetch errors", async () => {
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "Friendships fetched successfully",
        data: mockFriendsData,
      });

      // First friend succeeds, second friend fails
      mockGetCurrentPlace
        .mockResolvedValueOnce({
          success: true,
          activity: mockPlaceData,
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Place fetch failed",
        });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].lastPlace).toEqual(mockPlaceData);
      expect(result.data![1].lastPlace).toBeNull();
    });

    it("should handle places data as array format", async () => {
      mockGetFriendships.mockResolvedValue({
        success: true,
        message: "Friendships fetched successfully",
        data: [mockFriendsData[0]],
      });

      const mockPlaceDataWithArray = {
        activity_id: "activity-1",
        time: "2024-01-15T12:00:00Z",
        places: [
          {
            place_id: "place-1",
            name: "Central Library",
            location: "Munich City Center",
          },
          {
            place_id: "place-2",
            name: "Study Room",
            location: "Munich City Center",
          },
        ],
      } as any;

      mockGetCurrentPlace.mockResolvedValue({
        success: true,
        activity: mockPlaceDataWithArray,
      });

      const result = await getFriendsWithLastPlaces();

      expect(result.success).toBe(true);
      expect(result.data![0].lastPlace).toEqual(mockPlaceDataWithArray);
    });
  });
});

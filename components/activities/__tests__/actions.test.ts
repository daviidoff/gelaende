import { getPlaces, getPlacesPaginated } from "../data";
import { addActivity } from "../actions";
import { createClient } from "@/lib/supabase/server";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Places Actions", () => {
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
        ilike: jest.fn().mockReturnThis(),
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
        ilike: jest.fn().mockReturnThis(),
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

    it("should filter places by search term", async () => {
      const searchTerm = "Central";
      const filteredPlaces = mockPlaces.filter((place) =>
        place.name.includes(searchTerm)
      );

      // Mock filtered places response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: filteredPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces(searchTerm);

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: filteredPlaces,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
      expect(mockPlacesChain.select).toHaveBeenCalledWith("*");
      expect(mockPlacesChain.ilike).toHaveBeenCalledWith(
        "name",
        `%${searchTerm}%`
      );
      expect(mockPlacesChain.order).toHaveBeenCalledWith("name");
    });

    it("should skip search when search term is empty", async () => {
      const searchTerm = "";

      // Mock empty search response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces(searchTerm);

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: mockPlaces,
      });

      // Should not call ilike when search term is empty
      expect(mockPlacesChain.ilike).not.toHaveBeenCalled();
      expect(mockPlacesChain.order).toHaveBeenCalledWith("name");
    });

    it("should skip search when search term is only whitespace", async () => {
      const searchTerm = "   ";

      // Mock whitespace search response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces(searchTerm);

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: mockPlaces,
      });

      // Should not call ilike when search term is only whitespace
      expect(mockPlacesChain.ilike).not.toHaveBeenCalled();
      expect(mockPlacesChain.order).toHaveBeenCalledWith("name");
    });

    it("should trim search term before filtering", async () => {
      const searchTerm = "  Central  ";
      const trimmedSearchTerm = searchTerm.trim();
      const filteredPlaces = mockPlaces.filter((place) =>
        place.name.includes(trimmedSearchTerm)
      );

      // Mock trimmed search response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: filteredPlaces,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces(searchTerm);

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: filteredPlaces,
      });

      expect(mockPlacesChain.ilike).toHaveBeenCalledWith(
        "name",
        `%${trimmedSearchTerm}%`
      );
    });

    it("should return empty array when no matches found", async () => {
      const searchTerm = "NonexistentPlace";

      // Mock no matches response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlaces(searchTerm);

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: [],
      });

      expect(mockPlacesChain.ilike).toHaveBeenCalledWith(
        "name",
        `%${searchTerm}%`
      );
    });

    it("should return empty array when no places exist", async () => {
      // Mock empty places response
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
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
        ilike: jest.fn().mockReturnThis(),
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
        ilike: jest.fn().mockReturnThis(),
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
        ilike: jest.fn().mockReturnThis(),
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

  describe("getPlacesPaginated", () => {
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

    it("should successfully retrieve paginated places", async () => {
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
          count: 20,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlacesPaginated({ page: 1, limit: 10 });

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: mockPlaces,
        totalCount: 20,
        hasMore: true,
      });

      expect(mockPlacesChain.select).toHaveBeenCalledWith("*", {
        count: "exact",
      });
      expect(mockPlacesChain.range).toHaveBeenCalledWith(0, 9);
    });

    it("should handle search with pagination", async () => {
      const searchTerm = "Central";
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockPlaces[0]],
          error: null,
          count: 1,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlacesPaginated({
        searchTerm,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        success: true,
        message: "Places retrieved successfully",
        places: [mockPlaces[0]],
        totalCount: 1,
        hasMore: false,
      });

      expect(mockPlacesChain.ilike).toHaveBeenCalledWith(
        "name",
        `%${searchTerm}%`
      );
    });

    it("should calculate hasMore correctly", async () => {
      const mockPlacesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockPlaces,
          error: null,
          count: 15,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

      const result = await getPlacesPaginated({ page: 2, limit: 10 });

      expect(result.hasMore).toBe(false); // 15 total, page 2 with limit 10 = no more
      expect(mockPlacesChain.range).toHaveBeenCalledWith(10, 19); // Second page
    });
  });

  describe("addActivity", () => {
    const mockUserId = "user-123";
    const mockPlaceId = "place-1";
    const mockActivity = {
      activity_id: "activity-new",
      user_id: mockUserId,
      place_id: mockPlaceId,
      time: "2023-01-03T12:00:00Z",
      created_at: "2023-01-03T12:00:00Z",
      updated_at: "2023-01-03T12:00:00Z",
    };

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("Creating activities", () => {
      it("should successfully create a new activity", async () => {
        const mockActivitiesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockActivity,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const result = await addActivity({
          place_id: mockPlaceId,
        });

        expect(result).toEqual({
          success: true,
          message: "Activity created successfully",
          activity: mockActivity,
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("activities");
        expect(mockActivitiesChain.insert).toHaveBeenCalledWith({
          user_id: mockUserId,
          place_id: mockPlaceId,
          time: expect.any(String),
        });
        expect(mockActivitiesChain.select).toHaveBeenCalledWith("*");
        expect(mockActivitiesChain.single).toHaveBeenCalled();
      });

      it("should trim whitespace from place_id", async () => {
        const mockActivitiesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockActivity,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        await addActivity({
          place_id: "  " + mockPlaceId + "  ",
        });

        expect(mockActivitiesChain.insert).toHaveBeenCalledWith({
          user_id: mockUserId,
          place_id: mockPlaceId,
          time: expect.any(String),
        });
      });

      it("should set current time for activity", async () => {
        const mockActivitiesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockActivity,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const beforeTime = new Date().toISOString();
        await addActivity({
          place_id: mockPlaceId,
        });
        const afterTime = new Date().toISOString();

        const insertCall = mockActivitiesChain.insert.mock.calls[0][0];
        const activityTime = insertCall.time;

        expect(activityTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(activityTime >= beforeTime).toBe(true);
        expect(activityTime <= afterTime).toBe(true);
      });
    });

    describe("Validation", () => {
      it("should fail when place_id is empty", async () => {
        const result = await addActivity({
          place_id: "",
        });

        expect(result).toEqual({
          success: false,
          message: "Place ID is required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it("should fail when place_id is only whitespace", async () => {
        const result = await addActivity({
          place_id: "   ",
        });

        expect(result).toEqual({
          success: false,
          message: "Place ID is required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });
    });

    describe("Authentication", () => {
      it("should fail when user is not authenticated", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await addActivity({
          place_id: mockPlaceId,
        });

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

        const result = await addActivity({
          place_id: mockPlaceId,
        });

        expect(result).toEqual({
          success: false,
          message: "Authentication required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });
    });

    describe("Database errors", () => {
      it("should handle foreign key constraint violation", async () => {
        const mockActivitiesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23503",
              message: "Foreign key constraint violation",
            },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await addActivity({
          place_id: "invalid-place-id",
        });

        expect(result).toEqual({
          success: false,
          message: "Invalid place reference",
        });

        consoleSpy.mockRestore();
      });

      it("should handle generic database error", async () => {
        const mockActivitiesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST116" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await addActivity({
          place_id: mockPlaceId,
        });

        expect(result).toEqual({
          success: false,
          message: "Failed to create activity",
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error creating activity:", {
          message: "Database error",
          code: "PGRST116",
        });

        consoleSpy.mockRestore();
      });
    });

    describe("Unexpected errors", () => {
      it("should handle unexpected errors during create", async () => {
        mockSupabaseClient.from.mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await addActivity({
          place_id: mockPlaceId,
        });

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in addActivity:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it("should handle unexpected errors during auth", async () => {
        mockSupabaseClient.auth.getUser.mockRejectedValue(
          new Error("Unexpected error")
        );

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await addActivity({
          place_id: mockPlaceId,
        });

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in addActivity:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe("updateActivityPicture", () => {
    const mockUserId = "user-123";
    const mockActivityId = "activity-123";
    const mockPictureData =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABg...";
    const mockActivity = {
      activity_id: mockActivityId,
      user_id: mockUserId,
      place_id: "place-123",
      time: "2023-01-01T12:00:00Z",
      picture: mockPictureData,
      created_at: "2023-01-01T12:00:00Z",
      updated_at: "2023-01-01T12:00:00Z",
    };

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("Success cases", () => {
      it("should successfully update activity picture", async () => {
        const mockActivitiesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockActivity,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: true,
          message: "Picture added successfully",
          activity: mockActivity,
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("activities");
        expect(mockActivitiesChain.update).toHaveBeenCalledWith({
          picture: mockPictureData,
        });
        expect(mockActivitiesChain.eq).toHaveBeenCalledWith(
          "activity_id",
          mockActivityId
        );
        expect(mockActivitiesChain.eq).toHaveBeenCalledWith(
          "user_id",
          mockUserId
        );
      });
    });

    describe("Validation", () => {
      it("should fail when activityId is empty", async () => {
        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: "",
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: false,
          message: "Activity ID is required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it("should fail when pictureData is empty", async () => {
        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: "",
        });

        expect(result).toEqual({
          success: false,
          message: "Picture data is required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it("should fail when authentication error occurs", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: false,
          message: "Authentication required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });
    });

    describe("Database errors", () => {
      it("should handle activity not found error", async () => {
        const mockActivitiesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: "PGRST116",
              message: "No rows found",
            },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: false,
          message:
            "Activity not found or you don't have permission to update it",
        });

        consoleSpy.mockRestore();
      });

      it("should handle generic database error", async () => {
        const mockActivitiesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST500" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: false,
          message: "Failed to update activity picture",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Error updating activity picture:",
          {
            message: "Database error",
            code: "PGRST500",
          }
        );

        consoleSpy.mockRestore();
      });

      it("should handle unexpected errors", async () => {
        mockSupabaseClient.from.mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const { updateActivityPicture } = require("../actions");
        const result = await updateActivityPicture({
          activityId: mockActivityId,
          pictureData: mockPictureData,
        });

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in updateActivityPicture:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe("getUserLastActivity", () => {
    const mockUserId = "user-123";
    const mockActivity = {
      activity_id: "activity-123",
      user_id: mockUserId,
      place_id: "place-123",
      time: "2023-01-01T12:00:00Z",
      picture: null,
      created_at: "2023-01-01T12:00:00Z",
      updated_at: "2023-01-01T12:00:00Z",
    };

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("Success cases", () => {
      it("should successfully get user's last activity", async () => {
        const mockActivitiesChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockActivity,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const { getUserLastActivity } = require("../actions");
        const result = await getUserLastActivity();

        expect(result).toEqual({
          success: true,
          message: "Last activity retrieved successfully",
          activity: mockActivity,
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("activities");
        expect(mockActivitiesChain.select).toHaveBeenCalledWith("*");
        expect(mockActivitiesChain.eq).toHaveBeenCalledWith(
          "user_id",
          mockUserId
        );
        expect(mockActivitiesChain.order).toHaveBeenCalledWith("time", {
          ascending: false,
        });
        expect(mockActivitiesChain.limit).toHaveBeenCalledWith(1);
      });

      it("should handle no activities found", async () => {
        const mockActivitiesChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const { getUserLastActivity } = require("../actions");
        const result = await getUserLastActivity();

        expect(result).toEqual({
          success: false,
          message: "No recent activities found",
        });
      });
    });

    describe("Authentication", () => {
      it("should fail when authentication error occurs", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const { getUserLastActivity } = require("../actions");
        const result = await getUserLastActivity();

        expect(result).toEqual({
          success: false,
          message: "Authentication required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });
    });

    describe("Database errors", () => {
      it("should handle database error", async () => {
        const mockActivitiesChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST500" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockActivitiesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const { getUserLastActivity } = require("../actions");
        const result = await getUserLastActivity();

        expect(result).toEqual({
          success: false,
          message: "Failed to fetch recent activity",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching last activity:",
          {
            message: "Database error",
            code: "PGRST500",
          }
        );

        consoleSpy.mockRestore();
      });

      it("should handle unexpected errors", async () => {
        mockSupabaseClient.from.mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const { getUserLastActivity } = require("../actions");
        const result = await getUserLastActivity();

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in getUserLastActivity:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });
});

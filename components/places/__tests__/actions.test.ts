import { getPlaces, getPlacesPaginated } from "../data";
import { setPlace } from "../actions";
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

  describe("setPlace", () => {
    const mockUserId = "user-123";
    const mockNewPlace = {
      place_id: "place-new",
      name: "New Place",
      location: { lat: 40.7829, lng: -73.9654 },
      created_at: "2023-01-03T00:00:00Z",
      updated_at: "2023-01-03T00:00:00Z",
    };

    const mockUpdatedPlace = {
      place_id: "place-1",
      name: "Updated Place",
      location: { lat: 41.7829, lng: -74.9654 },
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-03T00:00:00Z",
    };

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("Creating new places", () => {
      it("should successfully create a new place", async () => {
        const mockPlacesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockNewPlace,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const result = await setPlace({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: true,
          message: "Place created successfully",
          place: mockNewPlace,
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
        expect(mockPlacesChain.insert).toHaveBeenCalledWith({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });
        expect(mockPlacesChain.select).toHaveBeenCalledWith("*");
        expect(mockPlacesChain.single).toHaveBeenCalled();
      });

      it("should create a place without location", async () => {
        const placeWithoutLocation = { ...mockNewPlace, location: null };
        const mockPlacesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: placeWithoutLocation,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const result = await setPlace({
          name: "New Place",
        });

        expect(result.success).toBe(true);
        expect(mockPlacesChain.insert).toHaveBeenCalledWith({
          name: "New Place",
          location: null,
        });
      });

      it("should trim whitespace from place name", async () => {
        const mockPlacesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockNewPlace,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        await setPlace({
          name: "  New Place  ",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(mockPlacesChain.insert).toHaveBeenCalledWith({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });
      });
    });

    describe("Updating existing places", () => {
      it("should successfully update an existing place", async () => {
        const mockPlacesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockUpdatedPlace,
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const result = await setPlace({
          place_id: "place-1",
          name: "Updated Place",
          location: { lat: 41.7829, lng: -74.9654 },
        });

        expect(result).toEqual({
          success: true,
          message: "Place updated successfully",
          place: mockUpdatedPlace,
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
        expect(mockPlacesChain.update).toHaveBeenCalledWith({
          name: "Updated Place",
          location: { lat: 41.7829, lng: -74.9654 },
          updated_at: expect.any(String),
        });
        expect(mockPlacesChain.eq).toHaveBeenCalledWith("place_id", "place-1");
        expect(mockPlacesChain.select).toHaveBeenCalledWith("*");
        expect(mockPlacesChain.single).toHaveBeenCalled();
      });

      it("should update place with null location", async () => {
        const mockPlacesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockUpdatedPlace, location: null },
            error: null,
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const result = await setPlace({
          place_id: "place-1",
          name: "Updated Place",
          location: null,
        });

        expect(result.success).toBe(true);
        expect(mockPlacesChain.update).toHaveBeenCalledWith({
          name: "Updated Place",
          location: null,
          updated_at: expect.any(String),
        });
      });
    });

    describe("Validation", () => {
      it("should fail when name is empty", async () => {
        const result = await setPlace({
          name: "",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "Place name is required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it("should fail when name is only whitespace", async () => {
        const result = await setPlace({
          name: "   ",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "Place name is required",
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

        const result = await setPlace({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
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

        const result = await setPlace({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "Authentication required",
        });

        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });
    });

    describe("Database errors", () => {
      it("should handle unique constraint violation", async () => {
        const mockPlacesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "Unique constraint violation" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await setPlace({
          name: "Duplicate Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "A place with this name already exists",
        });

        consoleSpy.mockRestore();
      });

      it("should handle foreign key constraint violation", async () => {
        const mockPlacesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: "23503",
              message: "Foreign key constraint violation",
            },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await setPlace({
          place_id: "invalid-id",
          name: "Updated Place",
        });

        expect(result).toEqual({
          success: false,
          message: "Invalid place reference",
        });

        consoleSpy.mockRestore();
      });

      it("should handle generic database error for create", async () => {
        const mockPlacesChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST116" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await setPlace({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "Failed to create place",
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error creating place:", {
          message: "Database error",
          code: "PGRST116",
        });

        consoleSpy.mockRestore();
      });

      it("should handle generic database error for update", async () => {
        const mockPlacesChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST116" },
          }),
        };
        mockSupabaseClient.from.mockReturnValue(mockPlacesChain);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await setPlace({
          place_id: "place-1",
          name: "Updated Place",
        });

        expect(result).toEqual({
          success: false,
          message: "Failed to update place",
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error updating place:", {
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

        const result = await setPlace({
          name: "New Place",
          location: { lat: 40.7829, lng: -73.9654 },
        });

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in setPlace:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it("should handle unexpected errors during update", async () => {
        mockSupabaseClient.auth.getUser.mockRejectedValue(
          new Error("Unexpected error")
        );

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await setPlace({
          place_id: "place-1",
          name: "Updated Place",
        });

        expect(result).toEqual({
          success: false,
          message: "An unexpected error occurred",
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected error in setPlace:",
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });
});

import { createClient } from "@/lib/supabase/server";
import {
  createProfile,
  CreateProfileData,
  getProfile,
  updateProfile,
  UpdateProfileData,
} from "../actions";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Profile Actions", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock methods that return themselves for chaining
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Create a fresh mock client for each test
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockChain),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("createProfile", () => {
    const mockUserId = "user-123";
    const validProfileData: CreateProfileData = {
      name: "John Doe",
      studiengang: "Computer Science",
      university: "Technical University",
    };

    beforeEach(() => {
      // Mock successful authentication by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("successful profile creation", () => {
      it("should create a profile successfully with all fields", async () => {
        // Create separate mock chain instances for the two different database calls
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" }, // Not found error
          }),
        };

        const insertProfileChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              profile_id: "profile-123",
              name: "John Doe",
              studiengang: "Computer Science",
              university: "Technical University",
              user_id: mockUserId,
              created_at: "2023-01-01T00:00:00Z",
              updated_at: "2023-01-01T00:00:00Z",
            },
            error: null,
          }),
        };

        // Mock the from method to return different chains based on call order
        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(insertProfileChain);

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Profile created successfully");
        expect(result.profile).toEqual({
          profile_id: "profile-123",
          name: "John Doe",
          studiengang: "Computer Science",
          university: "Technical University",
          user_id: mockUserId,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        });

        // Verify the correct database calls were made
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
        expect(checkProfileChain.eq).toHaveBeenCalledWith(
          "user_id",
          mockUserId
        );
        expect(insertProfileChain.insert).toHaveBeenCalledWith({
          name: "John Doe",
          studiengang: "Computer Science",
          university: "Technical University",
          user_id: mockUserId,
        });
      });

      it("should create a profile successfully with only required fields", async () => {
        const minimalProfileData: CreateProfileData = {
          name: "Jane Smith",
        };

        // Create separate mock chain instances
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
          }),
        };

        const insertProfileChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              profile_id: "profile-456",
              name: "Jane Smith",
              studiengang: null,
              university: null,
              user_id: mockUserId,
              created_at: "2023-01-01T00:00:00Z",
              updated_at: "2023-01-01T00:00:00Z",
            },
            error: null,
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(insertProfileChain);

        const result = await createProfile(minimalProfileData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Profile created successfully");
        expect(result.profile).toEqual({
          profile_id: "profile-456",
          name: "Jane Smith",
          studiengang: null,
          university: null,
          user_id: mockUserId,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        });

        // Verify the insert was called with null values for optional fields
        expect(insertProfileChain.insert).toHaveBeenCalledWith({
          name: "Jane Smith",
          studiengang: null,
          university: null,
          user_id: mockUserId,
        });
      });

      it("should trim whitespace from input fields", async () => {
        const profileDataWithWhitespace: CreateProfileData = {
          name: "  John Doe  ",
          studiengang: "  Computer Science  ",
          university: "  Technical University  ",
        };

        // Create separate mock chain instances
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
          }),
        };

        const insertProfileChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(insertProfileChain);

        await createProfile(profileDataWithWhitespace);

        // Verify trimmed values were inserted
        expect(insertProfileChain.insert).toHaveBeenCalledWith({
          name: "John Doe",
          studiengang: "Computer Science",
          university: "Technical University",
          user_id: mockUserId,
        });
      });
    });

    describe("validation errors", () => {
      it("should return error for empty name", async () => {
        const invalidProfileData: CreateProfileData = {
          name: "",
        };

        const result = await createProfile(invalidProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Name is required");
        expect(result.profile).toBeUndefined();

        // Should not make any database calls
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it("should return error for whitespace-only name", async () => {
        const invalidProfileData: CreateProfileData = {
          name: "   ",
        };

        const result = await createProfile(invalidProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Name is required");
        expect(result.profile).toBeUndefined();
      });

      it("should return error for name longer than 255 characters", async () => {
        const invalidProfileData: CreateProfileData = {
          name: "a".repeat(256),
        };

        const result = await createProfile(invalidProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Name must be 255 characters or less");
        expect(result.profile).toBeUndefined();
      });

      it("should return error for studiengang longer than 255 characters", async () => {
        const invalidProfileData: CreateProfileData = {
          name: "John Doe",
          studiengang: "a".repeat(256),
        };

        const result = await createProfile(invalidProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Studiengang must be 255 characters or less"
        );
        expect(result.profile).toBeUndefined();
      });

      it("should return error for university longer than 255 characters", async () => {
        const invalidProfileData: CreateProfileData = {
          name: "John Doe",
          university: "a".repeat(256),
        };

        const result = await createProfile(invalidProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "University must be 255 characters or less"
        );
        expect(result.profile).toBeUndefined();
      });
    });

    describe("authentication errors", () => {
      it("should return error when user is not authenticated", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Authentication required");
        expect(result.profile).toBeUndefined();
      });

      it("should return error when authentication fails", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error("Auth error"),
        });

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Authentication required");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("existing profile errors", () => {
      it("should return error when user already has a profile", async () => {
        // Mock existing profile found
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { profile_id: "existing-profile" },
            error: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValueOnce(checkProfileChain);

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("User already has a profile");
        expect(result.profile).toBeUndefined();

        // Should not attempt to create a new profile (from should only be called once)
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
      });

      it("should return error when checking existing profile fails", async () => {
        // Mock database error when checking for existing profile
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "SOME_OTHER_ERROR", message: "Database error" },
          }),
        };

        mockSupabaseClient.from.mockReturnValueOnce(checkProfileChain);

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Failed to check existing profile");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("database errors", () => {
      it("should handle unique constraint violation error", async () => {
        // Mock no existing profile found (race condition scenario)
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
          }),
        };

        const insertProfileChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "Unique constraint violation" },
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(insertProfileChain);

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("User already has a profile");
        expect(result.profile).toBeUndefined();
      });

      it("should handle general database insertion errors", async () => {
        // Mock no existing profile
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
          }),
        };

        const insertProfileChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "SOME_ERROR", message: "Database error" },
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(insertProfileChain);

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Failed to create profile");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("unexpected errors", () => {
      it("should handle unexpected exceptions", async () => {
        // Mock authentication success
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        });

        // Mock unexpected error
        mockSupabaseClient.from.mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const result = await createProfile(validProfileData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("An unexpected error occurred");
        expect(result.profile).toBeUndefined();
      });
    });
  });

  describe("updateProfile", () => {
    const mockUserId = "user-123";
    const validUpdateData: UpdateProfileData = {
      name: "Jane Doe",
      studiengang: "Data Science",
      university: "New University",
    };

    const mockExistingProfile = {
      profile_id: "profile-123",
      name: "John Doe",
      studiengang: "Computer Science",
      university: "Technical University",
      user_id: mockUserId,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    beforeEach(() => {
      // Mock successful authentication by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("successful update", () => {
      it("should update profile successfully with all fields", async () => {
        // Mock profile exists check
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { profile_id: "profile-123" },
            error: null,
          }),
        };

        // Mock profile update
        const updateProfileChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockExistingProfile, ...validUpdateData },
            error: null,
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(updateProfileChain);

        const result = await updateProfile(validUpdateData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Profile updated successfully");
        expect(result.profile).toEqual({
          ...mockExistingProfile,
          ...validUpdateData,
        });
      });

      it("should update profile with partial data", async () => {
        const partialUpdateData = { name: "Jane Smith" };

        // Mock profile exists check
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { profile_id: "profile-123" },
            error: null,
          }),
        };

        // Mock profile update
        const updateProfileChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockExistingProfile, name: "Jane Smith" },
            error: null,
          }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(checkProfileChain)
          .mockReturnValueOnce(updateProfileChain);

        const result = await updateProfile(partialUpdateData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Profile updated successfully");
        expect(result.profile?.name).toBe("Jane Smith");
      });
    });

    describe("validation errors", () => {
      it("should reject empty name", async () => {
        const result = await updateProfile({ name: "" });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Name cannot be empty");
        expect(result.profile).toBeUndefined();
      });

      it("should reject name that's too long", async () => {
        const longName = "a".repeat(256);
        const result = await updateProfile({ name: longName });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Name must be 255 characters or less");
        expect(result.profile).toBeUndefined();
      });

      it("should reject studiengang that's too long", async () => {
        const longStudiengang = "a".repeat(256);
        const result = await updateProfile({ studiengang: longStudiengang });

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Studiengang must be 255 characters or less"
        );
        expect(result.profile).toBeUndefined();
      });

      it("should reject university that's too long", async () => {
        const longUniversity = "a".repeat(256);
        const result = await updateProfile({ university: longUniversity });

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "University must be 255 characters or less"
        );
        expect(result.profile).toBeUndefined();
      });

      it("should reject empty update data", async () => {
        const result = await updateProfile({});

        expect(result.success).toBe(false);
        expect(result.message).toBe("No data provided to update");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("authentication errors", () => {
      it("should handle authentication failure", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const result = await updateProfile(validUpdateData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Authentication required");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("profile not found errors", () => {
      it("should handle profile not found", async () => {
        // Mock profile not found
        const checkProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        };

        mockSupabaseClient.from.mockReturnValueOnce(checkProfileChain);

        const result = await updateProfile(validUpdateData);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Profile not found. Please create a profile first."
        );
        expect(result.profile).toBeUndefined();
      });
    });
  });

  describe("getProfile", () => {
    const mockUserId = "user-123";
    const mockProfile = {
      profile_id: "profile-123",
      name: "John Doe",
      studiengang: "Computer Science",
      university: "Technical University",
      user_id: mockUserId,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    beforeEach(() => {
      // Mock successful authentication by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    describe("successful fetch", () => {
      it("should fetch profile successfully", async () => {
        // Mock profile fetch
        const fetchProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValueOnce(fetchProfileChain);

        const result = await getProfile();

        expect(result.success).toBe(true);
        expect(result.message).toBe("Profile fetched successfully");
        expect(result.profile).toEqual(mockProfile);
      });
    });

    describe("profile not found", () => {
      it("should handle profile not found", async () => {
        // Mock profile not found
        const fetchProfileChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        };

        mockSupabaseClient.from.mockReturnValueOnce(fetchProfileChain);

        const result = await getProfile();

        expect(result.success).toBe(false);
        expect(result.message).toBe("Profile not found");
        expect(result.profile).toBeUndefined();
      });
    });

    describe("authentication errors", () => {
      it("should handle authentication failure", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const result = await getProfile();

        expect(result.success).toBe(false);
        expect(result.message).toBe("Authentication required");
        expect(result.profile).toBeUndefined();
      });
    });
  });
});

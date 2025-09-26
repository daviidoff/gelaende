import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PingButton } from "../PingButton";
import { pingFriend } from "../pingActions";

// Mock the ping action
jest.mock("../pingActions");
const mockPingFriend = pingFriend as jest.MockedFunction<typeof pingFriend>;

describe("PingButton Component", () => {
  const defaultProps = {
    friendId: "user-456",
    friendName: "John Doe",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render ping button with correct title", () => {
    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Ping John Doe");
  });

  it("should show loading state when pinging", async () => {
    // Mock a delayed response that fails so it doesn't enter success state
    mockPingFriend.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: false, message: "Error" }), 50)
        )
    );

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // Initial state - should be enabled
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    // Check loading state - should be disabled while pinging
    expect(button).toBeDisabled();

    // Wait for ping to complete - should be enabled again after error
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("should call pingFriend action on click", async () => {
    mockPingFriend.mockResolvedValue({
      success: true,
      message: "Pinged John Doe!",
    });

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockPingFriend).toHaveBeenCalledWith("user-456");
  });

  it("should call onPingClick callback with success result", async () => {
    const mockOnPingClick = jest.fn();
    mockPingFriend.mockResolvedValue({
      success: true,
      message: "Pinged John Doe!",
    });

    render(<PingButton {...defaultProps} onPingClick={mockOnPingClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnPingClick).toHaveBeenCalledWith(true, "Pinged John Doe!");
    });
  });

  it("should call onPingClick callback with error result", async () => {
    const mockOnPingClick = jest.fn();
    mockPingFriend.mockResolvedValue({
      success: false,
      message: "Friend not found",
    });

    render(<PingButton {...defaultProps} onPingClick={mockOnPingClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnPingClick).toHaveBeenCalledWith(false, "Friend not found");
    });
  });

  it("should show success state after successful ping", async () => {
    mockPingFriend.mockResolvedValue({
      success: true,
      message: "Pinged John Doe!",
    });

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("title", "Pinged John Doe!");
      expect(button).toBeDisabled(); // Disabled for 3 seconds after success
    });
  });

  it("should handle ping action errors gracefully", async () => {
    const mockOnPingClick = jest.fn();
    mockPingFriend.mockRejectedValue(new Error("Network error"));

    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<PingButton {...defaultProps} onPingClick={mockOnPingClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnPingClick).toHaveBeenCalledWith(
        false,
        "Failed to send ping"
      );
    });

    consoleSpy.mockRestore();
  });

  it("should prevent multiple clicks when already pinging", async () => {
    // Mock a delayed response
    mockPingFriend.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, message: "Pinged!" }), 100)
        )
    );

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // Click multiple times quickly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call pingFriend once
    expect(mockPingFriend).toHaveBeenCalledTimes(1);
  });

  it("should prevent clicks when in just pinged state", async () => {
    mockPingFriend.mockResolvedValue({
      success: true,
      message: "Pinged John Doe!",
    });

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Try to click again while in "just pinged" state
    fireEvent.click(button);

    // Should still only have been called once
    expect(mockPingFriend).toHaveBeenCalledTimes(1);
  });

  it("should have correct CSS classes for different states", async () => {
    mockPingFriend.mockResolvedValue({
      success: true,
      message: "Pinged John Doe!",
    });

    render(<PingButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // Initial state
    expect(button).toHaveClass("bg-slate-700/50", "text-slate-300");

    fireEvent.click(button);

    await waitFor(() => {
      // Success state
      expect(button).toHaveClass("bg-green-500/20", "text-green-400");
    });
  });
});

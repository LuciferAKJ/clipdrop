import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUploadStream = vi.fn();
const mockDestroy = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: (...args: any[]) => mockUploadStream(...args),
      destroy: (...args: any[]) => mockDestroy(...args),
    },
  },
}));

import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

describe("lib/cloudinary hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates unique unpredictable public IDs for identical filenames to prevent collision", async () => {
    const capturedOptions: any[] = [];

    mockUploadStream.mockImplementation((options, callback) => {
      capturedOptions.push(options);
      // Simulate successful upload stream callback
      const mockResult = {
        resource_type: options.resource_type,
        type: "upload",
        public_id: `clipdrop/${options.public_id}`,
        format: "png",
        secure_url: `https://res.cloudinary.com/demo/image/upload/clipdrop/${options.public_id}.png`,
        bytes: 1234,
      };
      return {
        end: () => callback(null, mockResult),
      };
    });

    const buffer1 = Buffer.from("image 1");
    const buffer2 = Buffer.from("image 2");

    const result1 = await uploadToCloudinary(buffer1, "photo.png", "image/png");
    const result2 = await uploadToCloudinary(buffer2, "photo.png", "image/png");

    expect(capturedOptions).toHaveLength(2);
    // Both uploads have different public IDs despite having identical original filenames
    expect(capturedOptions[0].public_id).not.toEqual(
      capturedOptions[1].public_id,
    );
    expect(result1.publicId).not.toEqual(result2.publicId);

    // Each public ID retains the sanitized original base name after a UUID prefix
    expect(capturedOptions[0].public_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-photo$/,
    );
    expect(capturedOptions[1].public_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-photo$/,
    );
  });

  it("handles raw files with extension preservation", async () => {
    mockUploadStream.mockImplementation((options, callback) => {
      const mockResult = {
        resource_type: "raw",
        type: "upload",
        public_id: `clipdrop/${options.public_id}`,
        secure_url: `https://res.cloudinary.com/demo/raw/upload/clipdrop/${options.public_id}`,
        bytes: 5678,
      };
      return {
        end: () => callback(null, mockResult),
      };
    });

    const buffer = Buffer.from("pdf document");
    await uploadToCloudinary(buffer, "report.pdf", "application/pdf");

    const passedOptions = mockUploadStream.mock.calls[0][0];
    expect(passedOptions.resource_type).toBe("raw");
    expect(passedOptions.public_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-report\.pdf$/,
    );
  });

  it("deletes from Cloudinary with the returned publicId and correct resource type", async () => {
    mockDestroy.mockResolvedValue({ result: "ok" });

    await deleteFromCloudinary("clipdrop/some-uuid-doc.pdf", "application/pdf");
    expect(mockDestroy).toHaveBeenCalledWith("clipdrop/some-uuid-doc.pdf", {
      resource_type: "raw",
      type: "upload",
    });

    await deleteFromCloudinary("clipdrop/some-uuid-photo", "image/jpeg");
    expect(mockDestroy).toHaveBeenCalledWith("clipdrop/some-uuid-photo", {
      resource_type: "image",
      type: "upload",
    });
  });
});

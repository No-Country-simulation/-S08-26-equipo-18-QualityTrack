import { afterEach, describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { apiClient } from "../api";
import { documentService } from "../documentService";

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe("document HTTP transport", () => {
  it("keeps FormData intact so the browser supplies the multipart boundary", async () => {
    const form = new FormData();
    form.append("file", new File(["%PDF-1.7"], "plano.pdf"));
    form.append("workOrderId", "12");
    apiClient.defaults.adapter = async (config) => {
      expect(config.data).toBe(form);
      expect(config.headers.get("Content-Type")).toBeNull();
      expect(config.url).toBe("/documents/upload");
      return {
        data: { id: 42 },
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      };
    };
    await expect(documentService.upload(form)).resolves.toEqual({ id: 42 });
  });

  it("recovers server errors returned as blobs by authenticated downloads", async () => {
    apiClient.defaults.adapter = async (config) => {
      expect(config.responseType).toBe("blob");
      const response = {
        data: new Blob(
          [JSON.stringify({ message: "Integridad del archivo no válida" })],
          { type: "application/json" },
        ),
        status: 409,
        statusText: "Conflict",
        headers: {},
        config,
      };
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    };
    await expect(documentService.download(42)).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Integridad del archivo no válida",
    });
  });
});

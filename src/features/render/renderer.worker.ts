/// <reference lib="webworker" />
import { previewDecodeSize } from "./decode-size";
import { renderToCanvas } from "../editor/image-processing";
import { compositeLayers } from "./layers";
import type { RenderRequest } from "./studio-renderer";
self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  let source: ImageBitmap | undefined;
  try {
    const { blob, adjustments, geometry, layers, limit } = event.data;
    source = await createImageBitmap(blob,previewDecodeSize(event.data.sourceWidth,event.data.sourceHeight,geometry,limit));
    const canvas = new OffscreenCanvas(1, 1);
    renderToCanvas(source, source.width, source.height, canvas, adjustments, geometry, limit);
    await compositeLayers(canvas, layers);
    const result = canvas.transferToImageBitmap();
    self.postMessage({ bitmap: result }, { transfer: [result] });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "Rendering failed" }); }
  finally { source?.close(); }
};

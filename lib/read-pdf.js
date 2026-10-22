import { parseScutPages } from "./keyu-core.js";
export async function readPDF(data) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    isEvalSupported: false,
    useSystemFonts: true,
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/standard_fonts/",
  }).promise;
  try {
    if (doc.numPages > 20) throw Error("最多支持 20 页课表");
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const p = await doc.getPage(n),
        v = p.getViewport({ scale: 1 }),
        t = await p.getTextContent();
      pages.push({
        height: v.height,
        items: t.items
          .filter((i) => i.str)
          .map((i) => {
            const [x, y] = v.convertToViewportPoint(
              i.transform[4],
              i.transform[5],
            );
            return { str: i.str, x, y, width: i.width };
          }),
      });
    }
    return parseScutPages(pages);
  } finally {
    await doc.destroy();
  }
}

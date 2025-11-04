import { beep } from "@/lib/beep";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useRef } from "react";

export default function CardScanner(props: {
  onFullCardScan?: (
    tinyUrl: string,
    cardObject: { card: { imagePath: string; reference: string } }
  ) => void;
  onTinyUrlScan?: (tinyUrl: string) => void;
  onFailedScan?: (tinyUrl: string | null, error: string) => void;
}) {
  const latestScannedTinyUrl = useRef<string | null>(null);
  const scannedTinyUrls = useRef<Map<string, number>>(new Map());

  console.log("re-render");

  async function handleScan(detectedCodes: IDetectedBarcode[]) {
    let detectedValues = detectedCodes.map((s) => s.rawValue);

    detectedValues = detectedValues
      .map((s) => getTinyUrlFromScanOrNull(s))
      .filter((s) => Boolean(s)) as string[];

    for (const tinyUrl of detectedValues) {
      // Check if card was scanned within the last 5 seconds
      const lastScanTime = scannedTinyUrls.current.get(tinyUrl);
      const now = Date.now();
      if (lastScanTime && now - lastScanTime < 5000) {
        console.log("Card scanned too recently, skipping");
        continue;
      }

      if (latestScannedTinyUrl.current !== tinyUrl) {
        beep();
      }
      props.onTinyUrlScan?.(tinyUrl);
      latestScannedTinyUrl.current = tinyUrl;

      if (scannedTinyUrls.current.has(tinyUrl)) {
        props.onFailedScan?.(tinyUrl, "Card already scanned");
        continue;
      }
      scannedTinyUrls.current.set(tinyUrl, now);

      try {
        const cardScanResponse = await fetch(`/api/card-scan?code=${tinyUrl}`, {
          method: "GET",
        });
        if (!cardScanResponse.ok) {
          props.onFailedScan?.(tinyUrl, "Failed to fetch card data");
          continue;
        }
        const cardObject = (await cardScanResponse.json()) as {
          card: { imagePath: string; reference: string };
        };

        props.onFullCardScan?.(tinyUrl, cardObject);
      } catch (error) {
        props.onFailedScan?.(tinyUrl, `Error scanning card: ${error}`);
      }
    }
  }

  function getTinyUrlFromScanOrNull(code: string) {
    const decoded = decodeURIComponent(code).trim();
    if (!decoded.startsWith("https://qr.altered.gg/")) {
      return null;
    }
    const token = decoded.split("/").pop();
    if (!token) {
      return null;
    }
    return token;
  }

  function highlightCodeOnCanvas(
    detectedCodes: IDetectedBarcode[],
    ctx: CanvasRenderingContext2D
  ) {
    detectedCodes.forEach((detectedCode) => {
      drawAlteredLogo(detectedCode, ctx);
    });
  }

  return (
    <div>
      <Scanner
        allowMultiple
        formats={["qr_code", "rm_qr_code"]}
        components={{
          tracker: highlightCodeOnCanvas,
        }}
        onScan={(detectedCodes: IDetectedBarcode[]) => {
          handleScan(detectedCodes);
        }}
        sound={false}
        onError={(error: any) => {
          if (document.getElementById("result")) {
            document.getElementById("result")!.innerHTML = JSON.stringify(
              error,
              null,
              2
            );
          }
        }}
      />
    </div>
  );
}
// function drawCheckmark(
//   detectedCode: IDetectedBarcode,
//   ctx: CanvasRenderingContext2D,
//   backgroundColor: string = "#22C55E"
// ) {
//   const { boundingBox } = detectedCode;

//   // Use the full bounding box size
//   const borderRadius = Math.min(boundingBox.width, boundingBox.height) * 0.1;

//   // Draw smooth filled checkbox with green background
//   ctx.fillStyle = backgroundColor; // Green background
//   ctx.beginPath();
//   ctx.roundRect(
//     boundingBox.x,
//     boundingBox.y,
//     boundingBox.width,
//     boundingBox.height,
//     borderRadius
//   );
//   ctx.fill();

//   // Draw white checkmark
//   ctx.strokeStyle = "#FFFFFF";
//   ctx.lineWidth = Math.min(boundingBox.width, boundingBox.height) * 0.08;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";
//   ctx.beginPath();
//   // Draw checkmark path
//   ctx.moveTo(
//     boundingBox.x + boundingBox.width * 0.25,
//     boundingBox.y + boundingBox.height * 0.5
//   );
//   ctx.lineTo(
//     boundingBox.x + boundingBox.width * 0.45,
//     boundingBox.y + boundingBox.height * 0.7
//   );
//   ctx.lineTo(
//     boundingBox.x + boundingBox.width * 0.75,
//     boundingBox.y + boundingBox.height * 0.3
//   );
//   ctx.stroke();
// }

// Cache the altered logo image
let alteredLogoImage: HTMLImageElement | null = null;
let alteredLogoImageLoading = false;

function drawAlteredLogo(
  detectedCode: IDetectedBarcode,
  ctx: CanvasRenderingContext2D
) {
  const { boundingBox } = detectedCode;

  // Adjust this scale to make the image bigger or smaller
  // 1.0 = fill the bounding box, >1.0 = larger, <1.0 = smaller
  const imageScale = 1.4;

  // Use the full bounding box size
  const borderRadius = Math.min(boundingBox.width, boundingBox.height) * 0.1;

  // Draw smooth filled background
  ctx.beginPath();
  ctx.roundRect(
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height,
    borderRadius
  );

  // Load the altered.png image if not already loaded
  if (!alteredLogoImage && !alteredLogoImageLoading) {
    alteredLogoImageLoading = true;
    const img = new Image();
    img.src = "/altered.png";
    img.onload = () => {
      alteredLogoImage = img;
      alteredLogoImageLoading = false;
    };
    img.onerror = () => {
      alteredLogoImageLoading = false;
    };
  }

  // Draw the image if it's loaded
  if (alteredLogoImage) {
    const imageWidth = boundingBox.width * imageScale;
    const imageHeight = boundingBox.height * imageScale;
    // Center the scaled image
    const imageX = boundingBox.x + (boundingBox.width - imageWidth) / 2;
    const imageY = boundingBox.y + (boundingBox.height - imageHeight) / 2;

    ctx.drawImage(alteredLogoImage, imageX, imageY, imageWidth, imageHeight);
  }
}

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useRef, useState } from "react";

export default function CardScanner(props: {
  onScan?: (uniqueToken: string, cardObject: any) => void;
}) {
  const [latestScannedCard, setLatestScannedCard] = useState<string | null>(
    null
  );
  const latestScannedTokenRef = useRef<string | null>(null);
  const scannedTokensRef = useRef<Set<string>>(new Set());

  async function handleScan(detectedCodes: IDetectedBarcode[]) {
    const detectedValues = detectedCodes.map((s) => s.rawValue);

    for (const code of detectedValues) {
      const token = getTokenFromScanOrNull(code);
      if (!token) {
        continue;
      }
      if (scannedTokensRef.current.has(token)) {
        continue;
      }
      scannedTokensRef.current.add(token);
      try {
        const cardGuidResponse = await fetch(`/api/card-scan?code=${token}`, {
          method: "GET",
        });
        if (!cardGuidResponse.ok) {
          continue;
        }
        const cardObject = (await cardGuidResponse.json()) as {
          card: { imagePath: string };
        };
        const { imagePath } = cardObject.card;

        latestScannedTokenRef.current = token;
        props.onScan?.(token, cardObject);
        setLatestScannedCard(imagePath);
      } catch (error) {
        alert(`Error scanning card: ${error}`);
      }
    }
  }

  function getTokenFromScanOrNull(code: string) {
    const decoded = decodeURIComponent(code);
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
      const token = getTokenFromScanOrNull(detectedCode.rawValue);

      if (
        token &&
        scannedTokensRef.current.has(token) &&
        latestScannedTokenRef.current !== token
      ) {
        drawCheckmark(detectedCode, ctx, "#F59E0B");
        return;
      }

      drawCheckmark(detectedCode, ctx);
    });
  }

  return (
    <div>
      <Scanner
        allowMultiple
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
function drawCheckmark(
  detectedCode: IDetectedBarcode,
  ctx: CanvasRenderingContext2D,
  backgroundColor: string = "#22C55E"
) {
  const { boundingBox } = detectedCode;

  // Use the full bounding box size
  const borderRadius = Math.min(boundingBox.width, boundingBox.height) * 0.1;

  // Draw smooth filled checkbox with green background
  ctx.fillStyle = backgroundColor; // Green background
  ctx.beginPath();
  ctx.roundRect(
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height,
    borderRadius
  );
  ctx.fill();

  // Draw white checkmark
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.min(boundingBox.width, boundingBox.height) * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  // Draw checkmark path
  ctx.moveTo(
    boundingBox.x + boundingBox.width * 0.25,
    boundingBox.y + boundingBox.height * 0.5
  );
  ctx.lineTo(
    boundingBox.x + boundingBox.width * 0.45,
    boundingBox.y + boundingBox.height * 0.7
  );
  ctx.lineTo(
    boundingBox.x + boundingBox.width * 0.75,
    boundingBox.y + boundingBox.height * 0.3
  );
  ctx.stroke();
}

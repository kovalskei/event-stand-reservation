# Map Image Dimensions Analysis

## Image URL
```
https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png
```

## Container Configuration (Web)
- **Aspect Ratio**: `1920/850`
- **Calculated Ratio**: `2.2588` (approx 2.259)
- **CSS Property**: `aspectRatio: '1920/850'` (from `src/components/booth/BoothMapView.tsx:103`)
- **Object Fit**: `object-contain` (from `src/components/booth/BoothMapView.tsx:110`)

## How to Get Actual Image Dimensions

### Method 1: Using the Browser Console (Recommended)
I've added a utility function that will automatically log the image dimensions when you run the app:

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open the browser and navigate to the app

3. Open the browser console (F12 or Cmd+Option+I)

4. The image dimensions will be automatically logged in this format:
   ```
   === IMAGE DIMENSIONS ANALYSIS ===
   
   Image Width: XXXXpx
   Image Height: XXXXpx
   Image Aspect Ratio: X.XXXX (XXXX/XXXX)
   
   Container Aspect Ratio: 2.2588 (1920/850)
   
   === ANALYSIS ===
   
   [Analysis of how object-contain will behave]
   ```

### Method 2: Using the HTML Test File
Open `test-image-dimensions.html` in your browser to see the dimensions.

### Method 3: Using Node.js Script
Run the included script:
```bash
node get-image-dimensions.js
```

## Understanding object-contain Behavior

### How object-contain Works
The `object-contain` CSS property scales the image to fit within the container while maintaining its aspect ratio. This means:

1. **If Image Aspect Ratio > Container Aspect Ratio** (image is wider):
   - Image will be constrained by **container width**
   - **Vertical letterboxing** will occur (empty space top/bottom)
   - Booth positions will be relative to the visible image area

2. **If Image Aspect Ratio < Container Aspect Ratio** (image is taller):
   - Image will be constrained by **container height**
   - **Horizontal letterboxing** will occur (empty space left/right)
   - Booth positions will be relative to the visible image area

### Container Aspect Ratio
```
1920 / 850 = 2.2588235294117647 ≈ 2.259
```

This means the container is relatively wide (more than 2:1 ratio).

## PDF Export Behavior

From `src/hooks/usePDFExport.ts:75-85`, the PDF export:

1. Loads the image and gets its natural dimensions
2. Calculates the image aspect ratio: `mapAspectRatio = mapImg.width / mapImg.height`
3. Scales the image to fit within the PDF page while maintaining aspect ratio
4. Uses the same logic as object-contain

### PDF Page Dimensions
- **Format**: A4 Landscape
- **Width**: 297mm
- **Height**: 210mm
- **Aspect Ratio**: 1.414

The PDF export calculates:
```javascript
const mapAspectRatio = mapImg.width / mapImg.height;
const availableWidth = pageWidth - 20;
const availableHeight = pageHeight - 40;

let mapWidth = availableWidth;
let mapHeight = mapWidth / mapAspectRatio;

if (mapHeight > availableHeight) {
  mapHeight = availableHeight;
  mapWidth = mapHeight * mapAspectRatio;
}
```

This ensures the map fits within the PDF page with proper aspect ratio preservation.

## Critical Implications

### Why Dimensions Matter

1. **Booth Position Accuracy**: Booth positions are stored as percentages (`x`, `y`, `width`, `height` in %)
2. **Letterboxing Offset**: If letterboxing occurs, the actual image area doesn't start at 0,0 of the container
3. **Web vs PDF Rendering**: Different container aspect ratios may result in different letterboxing
4. **Coordinate Mapping**: Percentage-based positions must be mapped correctly to the actual image bounds

### Current Implementation
- Web uses: `aspectRatio: '1920/850'` (2.259)
- PDF uses: A4 landscape aspect ratio (1.414)
- Image uses: Unknown aspect ratio (need to determine)

If the image aspect ratio is different from 2.259, there WILL be letterboxing on the web, and the positions need to account for this.

## Next Steps

1. Run the app and check the console for actual image dimensions
2. Calculate if letterboxing occurs in web view
3. Verify if PDF export correctly handles the aspect ratio difference
4. Ensure booth positions are correctly mapped in both views

## Files Modified

- `src/utils/getImageDimensions.ts` - New utility to probe image dimensions
- `src/pages/Index.tsx` - Added automatic logging on app load
- `test-image-dimensions.html` - Standalone HTML test page
- `get-image-dimensions.js` - Node.js script for dimension checking

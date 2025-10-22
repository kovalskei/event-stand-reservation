/**
 * Utility to get image dimensions from a URL
 */
export async function getImageDimensions(imageUrl: string): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Test utility to log image dimensions to console
 */
export async function logImageDimensions(imageUrl: string): Promise<void> {
  try {
    const dimensions = await getImageDimensions(imageUrl);
    const containerAspectRatio = 1920 / 850;
    
    console.log('\n=== IMAGE DIMENSIONS ANALYSIS ===\n');
    console.log(`Image Width: ${dimensions.width}px`);
    console.log(`Image Height: ${dimensions.height}px`);
    console.log(`Image Aspect Ratio: ${dimensions.aspectRatio.toFixed(4)} (${dimensions.width}/${dimensions.height})`);
    console.log(`\nContainer Aspect Ratio: ${containerAspectRatio.toFixed(4)} (1920/850)`);
    
    console.log('\n=== ANALYSIS ===\n');
    if (containerAspectRatio > dimensions.aspectRatio) {
      console.log('Container is WIDER than the image');
      console.log('When using object-contain:');
      console.log('  - Image will be constrained by HEIGHT');
      console.log('  - HORIZONTAL letterboxing will occur (empty space on left/right)');
    } else {
      console.log('Container is TALLER than the image');
      console.log('When using object-contain:');
      console.log('  - Image will be constrained by WIDTH');
      console.log('  - VERTICAL letterboxing will occur (empty space on top/bottom)');
    }
    
    console.log('\n================================\n');
  } catch (error) {
    console.error('Error getting image dimensions:', error);
  }
}

const probe = require('probe-image-size');

const imageUrl = 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png';

probe(imageUrl).then(result => {
    console.log('\n=== IMAGE DIMENSIONS ANALYSIS ===\n');
    console.log(`Image Width: ${result.width}px`);
    console.log(`Image Height: ${result.height}px`);
    console.log(`Image Aspect Ratio: ${(result.width / result.height).toFixed(4)} (${result.width}/${result.height})`);
    console.log(`\nContainer Aspect Ratio: ${(1920/850).toFixed(4)} (1920/850)`);
    
    const imageAspect = result.width / result.height;
    const containerAspect = 1920 / 850;
    
    console.log('\n=== ANALYSIS ===\n');
    if (containerAspect > imageAspect) {
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
}).catch(err => {
    console.error('Error:', err);
});
